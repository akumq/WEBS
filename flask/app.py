from flask import Flask
from src.routes import init_routes
import os
from dotenv import load_dotenv

load_dotenv()

def create_app():
    # Créer l'instance Flask
    app = Flask(__name__, template_folder='src/templates')
    
    # Initialiser les routes
    init_routes(app)
    
    return app

# Récupérer les configurations depuis .env
HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', 8050))
DEBUG = os.getenv('DEBUG', 'TRUE').upper() == 'TRUE'

# Démarrer l'application
if __name__ == '__main__':
    app = create_app()
    app.run(host=HOST, port=PORT, debug=DEBUG)