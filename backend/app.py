from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from database_manager import db
from routes.auth_routes import auth_bp
from routes.recipe_routes import recipe_bp
from routes.recommendation_routes import recommendation_bp
from routes.vision_routes import vision_bp
from config import PORT
import logging
import os

# Project folders setup (Root Directory)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

app = Flask(__name__,
            template_folder=os.path.join(BASE_DIR, 'frontend', 'templates'),
            static_folder=os.path.join(BASE_DIR, 'frontend', 'static'))

CORS(app)


app.register_blueprint(auth_bp)
app.register_blueprint(recipe_bp)
app.register_blueprint(recommendation_bp)
app.register_blueprint(vision_bp)

# We MUST use force=True, because Flask or other libraries might have already
# quietly set up the Root Logger. Without force=True, this command is completely ignored!
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', force=True)

# Silences background noise: disables auto-prints from Flask server (werkzeug)
# So you only see your own nice logs on screen, unless there's a fatal crash
logging.getLogger('werkzeug').setLevel(logging.ERROR)

@app.route('/')
def home():
    return render_template('base.html')

if __name__ == '__main__':
    db.init_db()  # Ensure table exists before server starts
    app.run(debug=True, host='0.0.0.0', port=PORT)