import sqlite3
import pandas as pd
import numpy as np
import os

# 1. Connect to our existing database
# Note: Since we run this script from the scripts folder, 
# we navigate one parent back to the main backend folder
db_path = os.path.join(os.path.dirname(__file__), '..', 'recipe_app.db')

try:
    conn = sqlite3.connect(db_path)
    print("✅ Successfully connected to the App Database!\n")

    # ==========================================
    # --- Pandas DataFrame Example ---
    # ==========================================
    # We fetch all cache data at once and convert it into a modern table
    print("📊 Loading cache data into Pandas DataFrame...")
    query = "SELECT query, provider_name, timestamp FROM provider_cache"
    df_cache = pd.read_sql_query(query, conn)

    # Peek at the first 5 rows in the table (to ensure everything is fine)
    print("\n--- First 5 rows of our Cache Data ---")
    print(df_cache.head())

    # Now comes the magic: Pandas Analytics!
    # We want to research: which provider gives us the most workspace materials in cache?
    # groupby: Collects all rows by category and counts them!
    print("\n--- Data Aggregation: Cache Entries grouped by Provider ---")
    provider_counts = df_cache.groupby('provider_name').size()
    print(provider_counts)

    # Let's fetch only the 'vegan' searches (containing the word vegan in the search query)
    print("\n--- Active Filtering: Only Vegan searches ---")
    vegan_searches = df_cache[df_cache['query'].str.contains('vegan', case=False, na=False)]
    print(vegan_searches)


    # ==========================================
    # --- NumPy Example in our systems ---
    # ==========================================
    print("\n" + "="*30)
    print("🧪 NumPy Academic Example:")
    # Let's generate an array of recipe quantities we might study
    recipe_counts = np.array([10, 20, 15, 0])
    
    # Immediate vector math calculation: if each recipe takes 10 minutes to prepare,
    # How many total prep minutes in our database? (multiply array by 10)
    total_minutes = recipe_counts * 10
    print(f"Base recipe counts: {recipe_counts}")
    print(f"Minutes required to cook them all (Array * 10): {total_minutes}")
    print(f"Total Combined Array Sum (NumPy): {np.sum(total_minutes)} minutes")

    print("\n🎓 Your task: Edit this script to query 'saved_recipes' table and print how many total rows there are!")

except Exception as e:
    print(f"❌ Error occurred: {e}")
finally:
    # Don't forget to close the connection at the end!
    if 'conn' in locals():
        conn.close()
