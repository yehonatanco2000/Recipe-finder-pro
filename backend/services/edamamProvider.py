from services.base_provider import RecipeProvider
from models.recipe import Recipe
import os
import requests
import logging
import time


class EdamamProvider(RecipeProvider):
    def __init__(self):
        super().__init__("edamam")
        self.base_url = os.getenv('EDAMAM_BASE_URL')
        self.app_id = os.getenv('EDAMAM_APP_ID')
        self.app_key = os.getenv('EDAMAM_APP_KEY')


    def search(self,query,cuisine_type=None,health_labels=None):

        # 2. Pack the data into a dictionary
        api_params = {
            'type': 'public',
            'q': query,
            'app_id': self.app_id,
            'app_key': self.app_key
        }
        if health_labels:
            api_params['health'] = health_labels

        if cuisine_type and cuisine_type.lower() != "none":
            api_params['cuisineType'] = cuisine_type

        try:
            # 3. Execute request to the external server
            response = requests.get(self.base_url, params=api_params)
            data = response.json()
            if response.status_code != 200:
                logging.error(f"❌ Edamam API Error: {response.text}")
                return []  # Return empty on error

            recipes = []
            for hit in data['hits']:
                recipes.append(self._convert_to_recipe(hit))
            return recipes

        except Exception as e:
            logging.error(f"Error connecting to Edamam: {e}")
            return []

    def _convert_to_recipe(self,hit):
        r = hit['recipe']
        return Recipe(
             id = r['uri'],
             title =  r['label'],
             image = r['image'],
             url = r['url'],
             source = self.name
        )

    def get_recipes_by_uris(self,uri_list):
        """Fetch recipes from Edamam by URI list. Supports splitting into requests of 20 (Edamam limit)"""
        if not uri_list:
            return []

        by_uri_url = self.base_url.replace('/v2', '/v2/by-uri')

        all_recipes = []

        for i in range(0, len(uri_list), 20):
            chunk = uri_list[i:i + 20]
            time.sleep(3)  # Add larger delay (3 seconds) to prevent Edamam Burst block
            api_params = {
                'type': 'public',
                'app_id': self.app_id,
                'app_key': self.app_key,
                'uri': chunk
            }

            try:
                response = requests.get(by_uri_url, params=api_params)
                if response.status_code == 200:
                    data = response.json()
                    for hit in data.get('hits', []):
                        all_recipes.append(self._convert_to_recipe(hit))
                else:
                    logging.error(f"❌ Edamam URI Fetch Error: {response.status_code} - {response.text}")
            except Exception as e:
                logging.error(f"❌ Error in Edamam chunk: {e}")

        return all_recipes
