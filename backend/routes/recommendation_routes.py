from flask import Blueprint, request, jsonify
from services.ml_recommender import get_user_taste_profile,calculate_best_match
from services.recipe_manager import RecipeManager
from database_manager import db
import logging

recommendation_bp = Blueprint('recommendation', __name__)

@recommendation_bp.route('/api/recommendations', methods=['GET'])
def get_recommendations():
    username = request.args.get('username')
    title_list = db.get_saved_recipe_titles(username)
    if title_list is None or len(title_list) == 0:
        logging.warning(f"⚠️ No saved recipes found for user '{username}'. Cannot generate recommendations.")
        return jsonify({"error": "No saved recipes found for user"}), 404
    user_profile_deatils = get_user_taste_profile(title_list)
    manager = RecipeManager()
    candidates_data = manager.get_random_candidates()
    if user_profile_deatils is None or candidates_data is None:
        logging.error(f"❌ Failed to generate recommendations for user '{username}'. User profile or candidate data is missing.")
        return jsonify({"error": "Failed to generate recommendations"}), 500
    best_matches = calculate_best_match(user_profile_deatils,title_list,candidates_data)
    logging.info(f"✅ Successfully generated new recommendations for user '{username}'. Returning {len(best_matches)} best matches.")
    return jsonify(best_matches), 200

