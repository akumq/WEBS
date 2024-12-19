from flask import Flask
import os
from dotenv import load_dotenv
from src.routes import routes
load_dotenv()

def create_app():
    # Créer l'instance Flask
    app = Flask(__name__)
    
    # Configuration explicite des dossiers statiques
    app.static_folder = 'src/static'
    app.static_url_path = '/static'
    app.template_folder = 'src/templates'

    # Initialiser les routes
    app.register_blueprint(routes)

    return app

# Récupérer les configurations depuis .env
HOST = os.getenv('HOST', '0.0.0.0')
PORT = int(os.getenv('PORT', 8050))
DEBUG = os.getenv('DEBUG', 'TRUE').upper() == 'TRUE'

# Démarrer l'application
if __name__ == '__main__':
    app = create_app()
    app.run(host=HOST, port=PORT, debug=True)
