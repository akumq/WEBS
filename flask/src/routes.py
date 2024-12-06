from flask import render_template, jsonify, current_app

def init_routes(app):
    @app.route('/')
    def index():
        return render_template('index.html', message="Bienvenue sur mon application Flask!")

    @app.route('/hello')
    def hello():
        return "Hello, World!"

    @app.route('/data')
    def data():
        reader = current_app.config['sensor_reader']
        latest_data = reader.get_latest_data()
        return jsonify(latest_data)
