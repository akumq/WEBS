import posix_ipc
import threading
import subprocess
import logging
import queue


class SensorDataReader:
    def __init__(self, patient_id, activity, queueSize=30):
        # Initialisation des paramètres
        self.patient_id = patient_id
        self.activity = activity
        self.process = None


        self.latest_data = None
        self.dataQueue = queue.Queue(maxsize=queueSize)
        self.isRunning = True

        # Initalisation des logs
        logging.basicConfig(
            filename=f"{patient_id}_{activity}_log.txt",
            filemode='a',
            format='%(asctime)s,%(msecs)d %(name)s %(levelname)s %(message)s',
            datefmt='%H:%M:%S',
            level=logging.DEBUG
        )

        self.logger = logging.getLogger(f'SensorReader_{patient_id}_{activity}')
        self.logger.info("Running WEBS")

        # Initialisation des threads:
        self.reading_thread = threading.Thread(target=self._readMessage)
        self.reading_lock = threading.Lock()
        
    def startDaemon(self):
        # Lance le daemon qui écrira dans la file de messages
        
        self.process = subprocess.Popen(
            ["./daemon", f"{self.patient_id}", f"{self.patient_id}"],
            stdout=subprocess.PIPE,
            shell=False
        )
        self.logger.debug(f"Lancement du daemon\n\t patient:{self.patient_id} , activity:{self.activity}")
        
        self.reading_thread.start()

    def _readMessage(self):
        self.logger.debug(f"Lecture du stdout du daemon\n\t patient:{self.patient_id} , activity:{self.activity}")
        while self.isRunning:
            if self.process:
                with self.reading_lock:
                    line = self.process.stdout.readline().decode('utf-8').strip()
                    if line:  # Vérifier si la ligne n'est pas vide
                        self.latest_data = line
                        try:
                            self.dataQueue.put_nowait(line)
                        except queue.Full:
                            # Retirer l'élément le plus ancien si la queue est pleine
                            self.dataQueue.get()
                            self.dataQueue.put(line)
                    # self.logger.debug(f"Ligne reçu {line}")
            else :
                self.logger.error("Impossible de lire le stdout")
                
    def getLatestData(self):
        with self.reading_lock:
            self.logger.debug(f"Ligne envoyé {self.latest_data}")
            return str(self.latest_data)
    
    def Remove(self):
        self.isRunning = False
        if self.process:
            self.process.terminate()
            
        self.reading_thread.join()
    
    def getHistoryData(self):
        with self.reading_lock:
            tab = {}
            i = 0
            while not self.dataQueue.empty():
                tab[i] = str(self.dataQueue.get())
                i += 1
                
        return tab
            