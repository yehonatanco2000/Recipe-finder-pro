from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np




def get_user_taste_profile(title_list):
    if len(title_list) == 0:
        return None
    final_string = " ".join(title_list)
    return final_string


def calculate_best_match(user_profile,user_profile_list ,candidates_data):
    corpus = []
    corpus.append(user_profile)
    unknown_recipes = []
    for recipe in candidates_data:
        if recipe.title not in user_profile_list:
            unknown_recipes.append(recipe)
    for recipe in unknown_recipes:
        corpus.append(recipe.title)
    # 1. Call the engine that knows how to do word math
    vectorizer = TfidfVectorizer()

    # 2. Give it our list (corpus) to build the table
    tfidf_matrix = vectorizer.fit_transform(corpus)
    # 3. Calculate the similarity (scores) between the user (0) and all other recipes (from 1 onwards)
    similarity_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])
    # This variable contains a list of scores (zero to one)
    # Flatten it to a standard list for easier reading
    scores_list = similarity_scores[0]
    top_3_recipe_index = scores_list.argsort()[-3:][::-1]
    best_3_recipes = []
    for index in top_3_recipe_index:
        best_3_recipes.append(unknown_recipes[index].to_dict())
    return best_3_recipes





