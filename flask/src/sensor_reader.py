import subprocess
import json
import threading

class SensorDataReader:
    def __init__(self, patient_id, activity):
        self.patient_id = patient_id
        self.activity = activity
        self.process = None
        self.data_queue = []
        self.lock = threading.Lock()

    def start_reading(self):
        self.process = subprocess.Popen(
            ['cpp/daemon', str(self.patient_id), str(self.activity)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            universal_newlines=True
        )

        # Thread de lecture
        threading.Thread(target=self._read_stream, daemon=True).start()

    def _read_stream(self):
        for line in self.process.stdout:
            with self.lock:
                # Traitement et stockage des données
                processed_data = self._parse_line(line.strip())
                if processed_data:
                    self.data_queue.append(processed_data)
                    # Limitation de la taille de la queue
                    if len(self.data_queue) > 100:
                        self.data_queue.pop(0)

    def _parse_line(self, line):
        # Convertir la ligne CSV en dictionnaire structuré
        try:
            values = line.split(',')
            return {
                'timestamp': values[0],
                'alx': float(values[1]),
                'aly': float(values[2]),
                # Complétez selon vos colonnes
            }
        except:
            return None

    def get_latest_data(self):
        with self.lock:
            return self.data_queue[-1] if self.data_queue else None

    def stop(self):
        if self.process:
            self.process.terminate()
