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
    # 1. קוראים לרובוט שיודע לעשות את המתמטיקה של המילים
    vectorizer = TfidfVectorizer()

    # 2. נותנים לו את הרשימה שלנו (corpus) כדי שיבנה את הטבלה
    tfidf_matrix = vectorizer.fit_transform(corpus)
    # 3. מחשבים את הדמיון (הציונים) בין המשתמש (0) לבין כל שאר המתכונים (מ-1 והלאה)
    similarity_scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])
    # המשתנה הזה מכיל רשימה של ציונים (מאפס עד אחד)
    # נשטח אותו לרשימה רגילה כדי שיהיה קל לקרוא
    scores_list = similarity_scores[0]
    top_3_recipe_index = scores_list.argsort()[-3:][::-1]
    best_3_recipes = []
    for index in top_3_recipe_index:
        best_3_recipes.append(unknown_recipes[index].to_dict())
    return best_3_recipes





