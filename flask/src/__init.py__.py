from flask import Flask
import os
from dotenv import load_dotenv

# Charger les variables d'environnement
load_dotenv()

def create_app():
    app = Flask(__name__)

    app.config['DEBUG'] = os.getenv('DEBUG', 'False') == 'True'
    
    from . import routes
    app.register_blueprint(routes.bp)
    
    return app
