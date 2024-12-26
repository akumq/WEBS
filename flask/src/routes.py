from flask import Blueprint, render_template, jsonify
from src.sensor_reader import SensorDataReader
# Créez un blueprint
routes = Blueprint('routes', __name__)

@routes.route('/')
def index():
    return render_template('index.html', message="Bienvenue sur mon application Flask!")

@routes.route('/hello')
def hello():
    return "Hello, World!"

@routes.route('/data')
def get_sensor_data():
    reader = SensorDataReader(patient_id=1, activity=2)
    reader.start_reading()
    data = reader.get_latest_data()
    reader.stop_reading()
    return jsonify({"data": data})