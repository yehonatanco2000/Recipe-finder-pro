import os
import requests
import logging
from services.base_provider import RecipeProvider
from models.recipe import Recipe

class TastyProvider(RecipeProvider):
    def __init__(self):
        super().__init__("tasty")
        self.base_url = os.getenv('TASTY_BASE_URL')
        self.api_key = os.getenv('TASTY_API_KEY')
        self.api_host = os.getenv('TASTY_API_HOST')

    def search(self, query, cuisine_type=None):
        if not self.api_key:
            logging.error("❌ Tasty API key is missing!")
            return []
        # שימו לב: הפעם המפתחות הולכים ל-Headers ולא ל-Params!
        headers = {
            "x-rapidapi-key": self.api_key,
            "x-rapidapi-host": self.api_host
        }
        # פרמטרי החיפוש הולכים ל-Params (query string)
        api_params = {
            "from": "0",
            "size": "20",
            "q": query
        }
        # התעלמנו זמנית מ-cuisine_type כי ל-Tasty יש שיטת תיוג שונה מאוד
        try:
            response = requests.get(self.base_url, headers=headers, params=api_params)

            # בדיקת הסטטוס היא קריטית כאן! 429 = עברנו את המכסה (Too Many Requests)
            if response.status_code == 429:
                logging.warning("⚠️ Tasty API Rate Limit Reached! (500/month). Disabling Tasty for now.")
                return []  # מחזירים ריק כדי שהשאר ימשיכו לעבוד בעצמם

            if response.status_code != 200:
                logging.error(f"❌ Tasty API Error: {response.status_code} - {response.text}")
                return []
            data = response.json()
            recipes = []

            # Tasty מחזיר הכל ברשימה שנקראת results
            for item in data.get('results', []):
                # לפעמים Tasty מחזיר "לקטים" של סרטונים שאין להם מתכון אמיתי. אנחנו מפלטרים אותם:
                if 'name' in item and 'thumbnail_url' in item:
                    recipes.append(self._convert_to_recipe(item))

            return recipes
        except Exception as e:
            logging.error(f"Error connecting to Tasty: {e}")
            return []

    def _convert_to_recipe(self, item):
        # ב-Tasty, הקישור למתכון נבנה מה-slug שלהם
        slug = item.get('slug', '')
        recipe_url = f"https://tasty.co/recipe/{slug}" if slug else item.get('original_video_url', '')
        return Recipe(
            id=f"tasty_{item['id']}",
            title=item['name'],
            image=item.get('thumbnail_url', ''),  # תמונה מגניבה ואיכותית של באזפיד בענן שלא פגת תוקף
            url=recipe_url,
            source=self.name
        )

