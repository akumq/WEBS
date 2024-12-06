from flask import render_template

def init_routes(app):
    @app.route('/')
    def index():
        return render_template('index.html', message="Bienvenue sur mon application Flask!")
    
    @app.route('/hello')
    def hello():
        return "Hello, World!"