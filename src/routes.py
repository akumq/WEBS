from flask import Blueprint, render_template, jsonify, request
from src.sensor_reader import SensorDataReader
import threading
import json

# Créez un blueprint
routes = Blueprint('routes', __name__)

# Dictionnaire pour stocker les lecteurs de capteurs
sensor_readers = {}

@routes.route('/',methods=['GET'])
def index():
    return render_template('index.html',)

@routes.route('/start_reader', methods=['POST'])
def start_reader():
    data = request.json
    patient_id = data.get('patient_id')
    activity = data.get('activity')

    if patient_id is None or activity is None:
        return jsonify({"error": "Patient ID and activity are required"}), 400

    sensor_readers[f"{patient_id}_{activity}"] = SensorDataReader(patient_id,activity)
    message = sensor_readers[f"{patient_id}_{activity}"].startDaemon()

    return jsonify({"status": "success", "confirmation": message, "message": f"Sensor started for patient {patient_id}, activity {activity}"}), 200

@routes.route('/get_latest_data', methods=['GET'])
def get_latest_data():
    patient_id = request.args.get('patient_id')
    activity = request.args.get('activity')
    
    if patient_id is None or activity is None:
        return jsonify({"error": "Patient ID and activity are required"}), 400
    
    reader_key = f"{patient_id}_{activity}"
    reader = sensor_readers.get(reader_key)
    
    if reader is not None:  
        latest_data = reader.getLatestData()
        print(f"Debug - Données récupérées : {latest_data}")
        
        if latest_data is not None:
            return jsonify({"data": latest_data})
        else:
            return jsonify({"error": "No data available"}), 404
    else:
        return jsonify({"error": "Reader not started. Use /start_sensor"}), 400

@routes.route('/stop_reader', methods=['POST'])
def stop_reader():
    data = request.json
    patient_id = data.get('patient_id')
    activity = data.get('activity')
    
    if patient_id is None or activity is None:
        return jsonify({"error": "Patient ID and activity are required"}), 400
    
    reader_key = f"{patient_id}_{activity}"  # Changement de '_$' à '_'
    reader = sensor_readers.get(reader_key)
    
    if reader is not None: 
        reader.Remove()
        sensor_readers.pop(reader_key)
        return jsonify({"message": "Reader was succesfully deleted"})
    else:
        return jsonify({"error": "Reader not started. Use /start_sensor"}), 400

    
@routes.route('/get_history_data', methods=['GET'])
def get_history_data():
    patient_id = request.args.get('patient_id')
    activity = request.args.get('activity')
    
    if patient_id is None or activity is None:
        return jsonify({"error": "Patient ID and activity are required"}), 400
    
    reader_key = f"{patient_id}_{activity}"
    reader = sensor_readers.get(reader_key)
    
    if reader is not None:
        history_data = reader.getHistoryData()
        return jsonify(history_data), 200
    else:
        return jsonify({"error": "Reader not started. Use /start_sensor"}), 400