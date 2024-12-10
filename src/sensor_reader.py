# Dans src/sensor_reader.py
import posix_ipc
import struct
import threading
import subprocess
import os

class SensorDataReader:
    def __init__(self, patient_id, activity):
        self.patient_id = patient_id
        self.activity = activity
        self.message_queue_name = f"/sensor_queue_{patient_id}_{activity}"
        self.process = None
        self.message_queue = None
        self.is_running = False

    def _start_daemon(self):
        # Lance le daemon qui écrira dans la file de messages
        self.process = subprocess.Popen(
            ['./daemon', str(self.patient_id), str(self.activity)],
            stdout=subprocess.PIPE,
            shell=True
        )

    def _queue_writer(self):
        # Crée la file de messages
        try:
            self.message_queue = posix_ipc.MessageQueue(
                self.message_queue_name, 
                posix_ipc.O_CREAT
            )
        except posix_ipc.ExistentialError:
            posix_ipc.unlink_message_queue(self.message_queue_name)
            self.message_queue = posix_ipc.MessageQueue(
                self.message_queue_name, 
                posix_ipc.O_CREAT
            )

        # Lecture et écriture des données du daemon dans la file de messages
        while self.is_running and self.process.poll() is None:
            line = self.process.stdout.readline().strip()
            if line:
                # Convertit la ligne en octets pour la file de messages
                self.message_queue.send(line.encode('utf-8'))

    def start_reading(self):
        self.is_running = True
        self._start_daemon()
        
        # Thread pour écrire dans la file de messages
        self.writer_thread = threading.Thread(target=self._queue_writer)
        self.writer_thread.start()

    def get_latest_data(self):
        try:
            # Récupère un message de la file
            message, priority = self.message_queue.receive()
            return message.decode('utf-8')
        except posix_ipc.Error:
            return None

    def stop_reading(self):
        self.is_running = False
        if self.process:
            self.process.terminate()
        if hasattr(self, 'writer_thread'):
            self.writer_thread.join()
        
        # Nettoie la file de messages
        if self.message_queue:
            self.message_queue.close()
            posix_ipc.unlink_message_queue(self.message_queue_name)