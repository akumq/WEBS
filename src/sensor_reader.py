import posix_ipc
import struct
import threading
import subprocess
import os
import logging



class SensorDataReader:
    def __init__(self, patient_id, activity):
        # Initialisation des paramètres
        self.patient_id = patient_id
        self.activity = activity
        self.process = None
        self.stdout = None

        self.latest_data = None
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


    def start_daemon(self):
        # Lance le daemon qui écrira dans la file de messages
        self.process = subprocess.Popen(
            ['./cpp/daemon', str(self.patient_id), str(self.activity)],
            stdout=self.stdout,
            shell=True
        )
        
    def _readMessage(self):
        self.logger.debug("Lecture du stdout du daemon")
        while self.isRunning:
            if self.stdout:
                line = self.stdout.read()
            else :
                self.logger.error("Impossible de lire le stdout")