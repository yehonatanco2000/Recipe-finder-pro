from services.edamamProvider import EdamamProvider
from services.mealdb_provider import MealDBProvider
from services.spoonacular_provider import SpoonacularProvider
from services.tasty_provider import TastyProvider
from database_manager import db
import logging
import random

class RecipeManager:
    def __init__(self):
        self.providers = [EdamamProvider(), MealDBProvider(),SpoonacularProvider(), TastyProvider()]

    def search_all(self, query, cuisine_type=None):
        all_recipes = []
        for provider in self.providers:
            try:
                if provider.name in ["edamam","tasty","spoonacular"]:
                    results = db.get_from_cache(query, provider.name)
                    if results is not None:
                        logging.info(f"📦 Cache hit for {provider.name} with query '{query}' and cuisine '{cuisine_type}'")
                        all_recipes.extend(results)
                    else:
                        recipes = provider.search(query, cuisine_type)
                        all_recipes.extend(recipes)
                        db.save_to_cache(query, provider.name, recipes)
                        logging.info(f"✅ {provider.name} returned {len(recipes)} recipes for query '{query}' with cuisine '{cuisine_type}' saved to cache")
                        logging.info(f"✅ {provider.name} returned {len(recipes)} recipes for query '{query}' with cuisine '{cuisine_type}'")
                else:
                    recipes = provider.search(query, cuisine_type)
                    all_recipes.extend(recipes)
                    logging.info(f"✅ {provider.name} returned {len(recipes)} recipes for query '{query}' with cuisine '{cuisine_type}'")
            except Exception as e:
                logging.error(f"Error searching with {provider.name}: {e}")
                continue
        return all_recipes

    def get_random_candidates(self):
        broad_categories = ["dinner", "breakfast", "lunch", "dessert", "snack", "vegan", "healthy", "baking"]
        random_query = random.choice(broad_categories)
        logging.info(f"🔀 Fetching random candidate recipe with query: '{random_query}'")
        return self.search_all(random_query)
