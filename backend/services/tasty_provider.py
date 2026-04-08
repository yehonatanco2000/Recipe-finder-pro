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

    def search(self, query, cuisine_type=None, health_labels=None):
        if not self.api_key:
            logging.error("❌ Tasty API key is missing!")
            return []
        # Note: This time keys go to Headers and not Params!
        headers = {
            "x-rapidapi-key": self.api_key,
            "x-rapidapi-host": self.api_host
        }
        # Search parameters go to Params (query string)
        api_params = {
            "from": "0",
            "size": "20",
            "q": query
        }
        tag_labels = []
        if health_labels:
            for label in health_labels:
                if label == "vegan":
                    tag_labels.append("vegan")
                elif label == "vegetarian":
                    tag_labels.append("vegetarian")
                elif label == "gluten-free":
                    tag_labels.append("gluten_free")
        if tag_labels:
            api_params['tags'] = ','.join(tag_labels)
        # Temporarily ignored cuisine_type because Tasty uses a very different tagging method
        try:
            response = requests.get(self.base_url, headers=headers, params=api_params)

            # Status check is critical here! 429 = Quota exceeded (Too Many Requests)
            if response.status_code == 429:
                logging.warning("⚠️ Tasty API Rate Limit Reached! (500/month). Disabling Tasty for now.")
                return []  # Return empty so the rest continue working independently

            if response.status_code != 200:
                logging.error(f"❌ Tasty API Error: {response.status_code} - {response.text}")
                return []
            data = response.json()
            recipes = []

            # Tasty returns everything in a list called results
            for item in data.get('results', []):
                # Sometimes Tasty returns video compilations without a real recipe. We filter them:
                if 'name' in item and 'thumbnail_url' in item:
                    recipes.append(self._convert_to_recipe(item))

            return recipes
        except Exception as e:
            logging.error(f"Error connecting to Tasty: {e}")
            return []

    def _convert_to_recipe(self, item):
        # In Tasty, the recipe link is built from their slug
        slug = item.get('slug', '')
        recipe_url = f"https://tasty.co/recipe/{slug}" if slug else item.get('original_video_url', '')
        return Recipe(
            id=f"tasty_{item['id']}",
            title=item['name'],
            image=item.get('thumbnail_url', ''),  # Cool high-quality Buzzfeed cloud image that doesn't expire
            url=recipe_url,
            source=self.name
        )

