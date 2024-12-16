import posix_ipc
import signal
import threading
# import subprocess
import os
import queue
import logging
import time

class SensorDataReader:
    def __init__(self, patient_id, activity, history_size=100):
        self.patient_id = patient_id
        self.activity = activity
        self.mq_name = f"/sensor_queue_{patient_id}_{activity}"
        
        self.process = None
        self.pid = None
        
        # Utiliser une queue thread-safe avec un verrou
        self.data_queue = queue.Queue(maxsize=history_size)
        
        self.stop_event = threading.Event()
        self.lock = threading.Lock()
        
        # Configuration du logging
        logging.basicConfig(
            filename=f"{patient_id}_{activity}_log.txt",
            filemode='a',
            format='%(asctime)s,%(msecs)d %(name)s %(levelname)s %(message)s',
            datefmt='%H:%M:%S',
            level=logging.DEBUG
        )
        self.logger = logging.getLogger(f'SensorReader_{patient_id}_{activity}')
        self.logger.info("Running Urban Planning")
        
        try:
            # Supprimer d'abord la file de messages existante si nécessaire
            try:
                posix_ipc.unlink_message_queue(self.mq_name)
            except posix_ipc.ExistentialError:
                pass
            
            # Créer la file de messages
            self.mq = posix_ipc.MessageQueue(
                self.mq_name, 
                posix_ipc.O_CREAT,
                mode=0o666,
                max_messages=10,
                max_message_size=1024
            )
        except Exception as e:
            self.logger.error(f"Erreur lors de la création de la file de messages : {e}")
            raise
    
    def start_daemon(self):
        try:
            self.pid = os.fork()
            if self.pid == 0:  # Processus enfant
                try:
                    # Exécuter le démon
                    os.execv('./daemon', ['./daemon', str(self.patient_id), str(self.activity)])
                except Exception as e:
                    self.logger.error(f"Erreur lors du lancement du démon : {e}")
                    os._exit(1)
            else:  # Processus parent
                # Attendre un court instant pour s'assurer que le démon a démarré
                time.sleep(1)
                self.logger.debug(f"Daemon lancé avec PID : {self.pid}")
                return f"Daemon lancé avec PID : {self.pid}"
        except Exception as e:
            self.logger.error(f"Erreur lors du fork : {e}")
            raise

    def start_reading(self):
        try:
            # Démarrer le démon
            daemon_info = self.start_daemon()
            self.logger.info(daemon_info)
            
            # Démarrer le thread de lecture des messages
            self.reading_thread = threading.Thread(target=self.read_messages)
            self.reading_thread.start()
        except Exception as e:
            self.logger.error(f"Erreur au démarrage : {e}")
            raise
    
    def read_messages(self):
        try:
            while not self.stop_event.is_set():
                try:
                    # Recevoir un message avec un court timeout
                    message, _ = self.mq.receive(timeout=1)
                    
                    # Décoder et traiter le message
                    decoded_message = message.decode('utf-8').strip()
                    
                    # Ajouter à la file avec gestion de la taille
                    with self.lock:
                        if self.data_queue.full():
                            self.data_queue.get_nowait()
                        self.data_queue.put(decoded_message, block=False)
                    
                    
                    # print(f"Message reçu : {decoded_message}")
                
                except posix_ipc.BusyError:
                    # Timeout sans message, continuer
                    continue
                except Exception as e:
                    self.logger.error(f"Erreur de lecture des messages : {e}")
                    break
        except Exception as e:
            self.logger.error(f"Erreur générale dans read_messages : {e}")
        finally:
            self.stop_event.set()

    def stop(self):
        """
        Arrête proprement le processus et nettoie les ressources
        """
        try:
            # Arrêter le démon
            if self.pid:
                os.kill(self.pid, signal.SIGINT)
            
            # Arrêter le thread
            self.stop_event.set()
            if hasattr(self, 'reading_thread'):
                self.reading_thread.join()
            
            # Nettoyer la file de messages
            if hasattr(self, 'mq'):
                self.mq.close()
                posix_ipc.unlink_message_queue(self.mq_name)
        except Exception as e:
            self.logger.error(f"Erreur lors de l'arrêt : {e}")

    def getLatestData(self):
        """
        Récupère la dernière donnée
        """
        try:
            # Essayer de récupérer la dernière donnée sans bloquer
            return self.data_queue.get_nowait()
        except queue.Empty:
            return None

    def getHistoryData(self, n=None):
        """
        Récupère l'historique des données
        """
        # Convertir la file en liste
        data_list = list(self.data_queue.queue)
        
        # Si n est None, retourner toutes les données
        if n is None:
            return data_list
        
        # Retourner les n dernières lignes
        return data_list[-n:]