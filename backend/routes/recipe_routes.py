from flask import Blueprint, request, jsonify
from services.edamamProvider import EdamamProvider
from services.recipe_manager import RecipeManager
from models.recipe import Recipe
from database_manager import db
import logging
recipe_bp = Blueprint('recipe', __name__)

@recipe_bp.route('/api/search')
def search_recipes():
    # 1. קליטת המצרכים מהדפדפן
    # אנחנו שולפים את מה שהמשתמש הקליד מתוך הכתובת
    user_ingredients = request.args.get('ingredients')
    logging.info(f"🔍 Received search request with ingredients: {user_ingredients}")
    user_cuisine_type = request.args.get('cuisine')

    # הגנת שרת: אם לא שלחו לנו מצרכים, נחזיר הודעת שגיאה
    if not user_ingredients:
        logging.warning("⚠️ Search request missing 'ingredients' parameter.")
        return jsonify({"error": "Please provide ingredients"}), 400

    # 1. שולחים את השליח שלנו (הפונקציה מהקובץ השני) שיביא את הנתונים
    manager = RecipeManager()
    recipes = manager.search_all(user_ingredients, user_cuisine_type)
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
    edamam_fallbacks = {}  # כאן אנחנו מגדירים את המילון הריק!
    final_favorites = []
    for row in saved_rows:
        recipe_id, recipe_title, recipe_image, recipe_url = row
        if recipe_id.startswith("mealdb_") or recipe_id.startswith("tasty_") or recipe_id.startswith("spoonacular_"):
            r = Recipe(id=recipe_id, title=recipe_title, image=recipe_image, url=recipe_url, source="database")
            final_favorites.append(r.to_dict())
        else:
            # זה מתכון של אדמם. נכין אותו לריענון:
            edamam_uris.append(recipe_id)
            # ונכין לו מצנח גיבוי (במקרה שאדמם חוסם אותנו כרגע)
            edamam_fallbacks[recipe_id] = Recipe(id=recipe_id, title=recipe_title, image=recipe_image,
                                                         url=recipe_url, source="database_fallback")

    if len(edamam_uris) > 0:
        edamam_provider = EdamamProvider()
        edamam_recipes = edamam_provider.get_recipes_by_uris(edamam_uris)

        if edamam_recipes is None:
            edamam_recipes = []  # הגנה נוספת

        # ניקח את כל התעודות זהות שאדמם באמת החזיר לנו (מחוץ ל-if!)
        returned_ids = {r.id for r in edamam_recipes}

        # עכשיו נעבור על כל מה שביקשנו ממנו במקור:
        for uri in edamam_uris:
            if uri in returned_ids:
                # אדמם החזיר את זה בהצלחה!
                recipe = next(r for r in edamam_recipes if r.id == uri)
                final_favorites.append(recipe.to_dict())
            else:
                # השגיאה שלך תפסה פה: אדמם כשל או חסם את הבקשה. אנחנו מפעילים את המצנח מתוך ה-Database!
                logging.warning(f"⚠️ Edamam failed to fetch fresh data for {uri}. Using database fallback.")
                final_favorites.append(edamam_fallbacks[uri].to_dict())

    logging.info(f"✅ Returned {len(final_favorites)} fresh favorites for user '{username}'.")
    return jsonify(final_favorites), 200

