from flask import Flask
from src.routes import init_routes
from src.sensor_reader import SensorDataReader
import os
from dotenv import load_dotenv

load_dotenv()

def create_app():
    # Créer l'instance Flask
    app = Flask(__name__, template_folder='src/templates')

    # Initialiser les routes
    init_routes(app)

    # Initialiser le lecteur de données
    # reader = SensorDataReader(patient_id=1, activity=2)
    # reader.start_reading()

    # # Ajouter le lecteur de données à l'application Flask
    # app.config['sensor_reader'] = reader

    return app

# Récupérer les configurations depuis .env
HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', 8050))
DEBUG = os.getenv('DEBUG', 'TRUE').upper() == 'TRUE'

# Démarrer l'application
if __name__ == '__main__':
    app = create_app()
    app.run(host=HOST, port=PORT, debug=DEBUG)
