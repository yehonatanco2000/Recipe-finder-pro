from services.base_provider import RecipeProvider
from models.recipe import Recipe
import os
import requests
import logging

class SpoonacularProvider(RecipeProvider):
    def __init__(self):
        super().__init__("spoonacular")
        self.base_url = os.getenv('SPOONACULAR_BASE_URL')
        self.api_key = os.getenv('SPOONACULAR_API_KEY')

    def search(self,query,cuisine_type=None):
        if not self.api_key:
            logging.error("❌ Spoonacular API key is missing!")
            return []
        api_params = {
            'apiKey': self.api_key,
            'includeIngredients': query,  # שינוי קטן בשם הפרמטר לעומת אדמם
            'addRecipeInformation': 'true',  # פקודת קסם כדי לקבל את ה-URL
            'number': 20 # נבקש עד 20 תוצאות
        }
        if cuisine_type and cuisine_type.lower() != "none":
            api_params['cuisine'] = cuisine_type
        try:
            response = requests.get(self.base_url, params=api_params)
            data = response.json()
            if response.status_code != 200:
                logging.error(f"❌ Spoonacular API Error: {response.text}")
                return []
            recipes = []
            for item in data.get('results', []):
                recipes.append(self._convert_to_recipe(item))
            return recipes
        except Exception as e:
            logging.error(f"Error connecting to Spoonacular: {e}")
            return []

    def _convert_to_recipe(self,item):
        image_url = item.get('image', '')
        if "-312x231" in image_url:
            image_url = image_url.replace("-312x231", "-636x393")
        return Recipe(
            id=f"spoonacular_{item['id']}",  # שומרים על התקן שלנו! קידומת + מזהה
            title=item['title'],
            image=image_url,
            url=item.get('sourceUrl', ''),  # במקרה חריג שאין, נחזיר ריק
            source=self.name
        )