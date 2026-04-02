import sqlite3
import pandas as pd
import numpy as np
import os

# 1. חיבור למסד הנתונים הקיים שלנו
# שימו לב: מכיוון שאנחנו מריצים את הסקריפט הזה מתוך תיקיית scripts, 
# אנחנו מנווטים הורה אחד אחורה אל תיקיית ה-backend הראשית
db_path = os.path.join(os.path.dirname(__file__), '..', 'recipe_app.db')

try:
    conn = sqlite3.connect(db_path)
    print("✅ Successfully connected to the App Database!\n")

    # ==========================================
    # --- דוגמה לפנדס (Pandas DataFrame) ---
    # ==========================================
    # אנחנו שולפים את כל נתוני המטמון שלנו במכה אחת, והופכים אותם לטבלה מודרנית
    print("📊 Loading cache data into Pandas DataFrame...")
    query = "SELECT query, provider_name, timestamp FROM provider_cache"
    df_cache = pd.read_sql_query(query, conn)

    # הצצה על 5 השורות הראשונות בטבלה (כדי לראות שהכל תקין)
    print("\n--- First 5 rows of our Cache Data ---")
    print(df_cache.head())

    # עכשיו מגיע הקסם: Pandas Analytics!
    # אנחנו רוצים לחקור: איזה ספק (provider_name) מספק לנו הכי הרבה חומרי עבודה במטמון?
    # groupby: אוסף את כל השורות לפי קטגוריה וסופר אותן!
    print("\n--- Data Aggregation: Cache Entries grouped by Provider ---")
    provider_counts = df_cache.groupby('provider_name').size()
    print(provider_counts)

    # בוא נשלוף רק את החיפושים שהם 'טבעוניים' (שמכילים את המילה vegan במפתח החיפוש)
    print("\n--- Active Filtering: Only Vegan searches ---")
    vegan_searches = df_cache[df_cache['query'].str.contains('vegan', case=False, na=False)]
    print(vegan_searches)


    # ==========================================
    # --- דוגמה ל-NumPy במערכות שלנו ---
    # ==========================================
    print("\n" + "="*30)
    print("🧪 NumPy Academic Example:")
    # בואו נייצר אראי של כמויות המתכונים שיש לנו אולי ללמוד
    recipe_counts = np.array([10, 20, 15, 0])
    
    # חישוב מתמטי מידי ווקטורי: אם כל מתכון לוקח 10 דקות להכין,
    # כמה דקות הכנה כולל יש בבסיס הנתונים שלנו? (נכפיל את המערך ב-10)
    total_minutes = recipe_counts * 10
    print(f"Base recipe counts: {recipe_counts}")
    print(f"Minutes required to cook them all (Array * 10): {total_minutes}")
    print(f"Total Combined Array Sum (NumPy): {np.sum(total_minutes)} minutes")

    print("\n🎓 Your task: Edit this script to query 'saved_recipes' table and print how many total rows there are!")

except Exception as e:
    print(f"❌ Error occurred: {e}")
finally:
    # בסוף לא שוכחים לסגור את החיבור!
    if 'conn' in locals():
        conn.close()
