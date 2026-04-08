from flask import Blueprint, request, jsonify
from services.edamamProvider import EdamamProvider
from services.recipe_manager import RecipeManager
from models.recipe import Recipe
from database_manager import db
import logging
recipe_bp = Blueprint('recipe', __name__)

@recipe_bp.route('/api/search')
def search_recipes():
    # 1. Extracting ingredients from the browser
    # We extract what the user typed from the URL
    user_ingredients = request.args.get('ingredients')
    logging.info(f"🔍 Received search request with ingredients: {user_ingredients}")
    user_cuisine_type = request.args.get('cuisine')
    health_labels = request.args.get('selectedHealthLabels')
    if health_labels:
        health_labels = health_labels.split(",")  # Convert string to list
    else:
        health_labels = []

    # Server protection: if no ingredients were sent, return an error message
    if not user_ingredients:
        logging.warning("⚠️ Search request missing 'ingredients' parameter.")
        return jsonify({"error": "Please provide ingredients"}), 400

    # 1. Send our agent (function from the other file) to fetch the data
    manager = RecipeManager()
    recipes = manager.search_all(user_ingredients, user_cuisine_type, health_labels)
    recipes_data = [recipe.to_dict() for recipe in recipes]
    if recipes_data != []:
        logging.info(f"✅ Successfully fetched recipes for ingredients: {user_ingredients}")
    else:
        logging.info(f"🔍 No recipes found for ingredients: {user_ingredients}")
    return jsonify(recipes_data)

@recipe_bp.route('/api/toggle_recipe', methods=['POST'])
def toggle_recipe():
    data = request.json
    username = data.get('username')
    recipe_id = data.get('recipe_id')
    recipe_title = data.get('recipe_title')
    recipe_image = data.get('recipe_image')
    recipe_url = data.get('recipe_url')
    return db.toggle_favorite(username, recipe_id, recipe_title, recipe_image, recipe_url)


@recipe_bp.route('/api/favorites', methods=['GET'])
def get_favorites():
    username = request.args.get('username')
    saved_rows = db.get_favorites(username)

    if len(saved_rows) == 0:
        return jsonify([]), 200

    edamam_uris = []
    edamam_fallbacks = {}  # Initialize the empty dictionary here!
    final_favorites = []
    for row in saved_rows:
        recipe_id, recipe_title, recipe_image, recipe_url = row
        if recipe_id.startswith("mealdb_") or recipe_id.startswith("tasty_") or recipe_id.startswith("spoonacular_"):
            r = Recipe(id=recipe_id, title=recipe_title, image=recipe_image, url=recipe_url, source="database")
            final_favorites.append(r.to_dict())
        else:
            # This is an Edamam recipe. Prepare it for refresh:
            edamam_uris.append(recipe_id)
            # And prepare a fallback (in case Edamam blocks us right now)
            edamam_fallbacks[recipe_id] = Recipe(id=recipe_id, title=recipe_title, image=recipe_image,
                                                         url=recipe_url, source="database_fallback")

    if len(edamam_uris) > 0:
        edamam_provider = EdamamProvider()
        edamam_recipes = edamam_provider.get_recipes_by_uris(edamam_uris)

        if edamam_recipes is None:
            edamam_recipes = []  # Extra protection

        # Take all the IDs that Edamam actually returned (outside the if!)
        returned_ids = {r.id for r in edamam_recipes}

        # Now iterate over everything we originally requested:
        for uri in edamam_uris:
            if uri in returned_ids:
                # Edamam returned this successfully!
                recipe = next(r for r in edamam_recipes if r.id == uri)
                final_favorites.append(recipe.to_dict())
            else:
                # Your error caught here: Edamam failed or blocked the request. Triggering fallback from the Database!
                logging.warning(f"⚠️ Edamam failed to fetch fresh data for {uri}. Using database fallback.")
                final_favorites.append(edamam_fallbacks[uri].to_dict())

    logging.info(f"✅ Returned {len(final_favorites)} fresh favorites for user '{username}'.")
    return jsonify(final_favorites), 200

