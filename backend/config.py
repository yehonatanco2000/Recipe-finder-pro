import os
from dotenv import load_dotenv
load_dotenv()

PORT = 5000

# שימוש בנתיב אבסולוטי כדי למנוע טעויות בזיהוי הקובץ
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DATABASE_PATH = os.path.join(BASE_DIR, 'backend', 'my_database.db')
