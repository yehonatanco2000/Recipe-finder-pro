from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from database_manager import db
from routes.auth_routes import auth_bp
from routes.recipe_routes import recipe_bp
from routes.recommendation_routes import recommendation_bp
from config import PORT
import logging
import os

# הגדרת תיקיות הפרויקט (Root Directory)
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

app = Flask(__name__,
            template_folder=os.path.join(BASE_DIR, 'frontend', 'templates'),
            static_folder=os.path.join(BASE_DIR, 'frontend', 'static'))

CORS(app)

app.register_blueprint(auth_bp)
app.register_blueprint(recipe_bp)
app.register_blueprint(recommendation_bp)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# משתיק רעשי רקע: מכבה את ההדפסות האוטומטיות של שרת ה-Flask (שנקרא werkzeug)
# כדי שתראה במסך רק את הלוגים היפים שהכנת בעצמך, אלא אם יש שגיאת קריסה
logging.getLogger('werkzeug').setLevel(logging.ERROR)

@app.route('/')
def home():
    return render_template('base.html')

if __name__ == '__main__':
    db.init_db()  # וודא שהטבלה קיימת לפני שהשרת מתחיל לעבוד
    app.run(debug=True, port=PORT)