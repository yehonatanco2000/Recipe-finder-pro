from services.base_provider import RecipeProvider
from models.recipe import Recipe
import os
import requests
import logging

class MealDBProvider(RecipeProvider):
    def __init__(self):
        super().__init__("mealdb")
        self.base_url = os.getenv('MEALDB_BASE_URL')

    def search(self,query,cuisine_type=None):
        api_params = {
            's': query
        }
        try:
            response = requests.get(self.base_url, params=api_params)
            data = response.json()
            if response.status_code != 200:
                logging.error(f"❌ MealDB API Error: {response.text}")
                return []
            recipes = []
            meals = data.get('meals')
            if meals:
                for meal in meals:
                    recipes.append(self._convert_to_recipe(meal))
                return recipes
            else:
                return []
        except Exception as e:
            logging.error(f"Error connecting to MealDB: {e}")
            return []

    def _convert_to_recipe(self,meal):
        url_meal = meal.get('strSource')
        if not url_meal:
            url_meal =  f"https://www.themealdb.com/meal/{meal['idMeal']}"
        return Recipe(
                id = "mealdb_" + meal['idMeal'],
                title = meal['strMeal'],
                image = meal['strMealThumb'],
                url = url_meal,
                source = self.name
        )