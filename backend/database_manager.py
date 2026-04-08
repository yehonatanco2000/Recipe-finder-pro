from config import DATABASE_PATH
import sqlite3
import logging
import json
from flask import jsonify
from models.recipe import Recipe
from datetime import datetime, timedelta


class DatabaseManager:
    def __init__(self):
        self.db_path = DATABASE_PATH
        self.connection = sqlite3.connect(self.db_path, check_same_thread=False)  # Allows shared connection among threads


    def init_db(self):
        cursor = self.connection.cursor()

        # 2. SQL command: Create users table (only if it doesn't already exist!)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS saved_recipes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                recipe_id TEXT NOT NULL,
                recipe_title TEXT,
                recipe_image TEXT,
                recipe_url TEXT,
                FOREIGN KEY (user_id) REFERENCES users (id)
            )
        ''')
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS provider_cache (
                query TEXT,
                provider_name TEXT,
                recipes_json TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (query, provider_name)
            )
        ''')

        # 3. Commit (save changes) and close connection
        self.connection.commit()
        logging.info("✅ Database table 'users' is ready!")

    def get_saved_recipe_titles(self,username):

        cursor = self.connection.cursor()

        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if user:
            user_id = user[0]
            cursor.execute("SELECT recipe_title FROM saved_recipes WHERE user_id = ?", (user_id,))
            saved_rows = cursor.fetchall()
            title_list = []
            for row in saved_rows:
                title_list.append(row[0])
            return title_list
        else:
            return None


    def get_from_cache(self,query, provider_name):
        # Always convert to lowercase so there's no difference between Chicken and chicken
        query = query.lower()
        cursor = self.connection.cursor()

        cursor.execute("SELECT recipes_json,timestamp FROM provider_cache WHERE query = ? AND provider_name = ?",
                           (query, provider_name))
        row = cursor.fetchone()

        if row:
            # 1. Found! Now extract the long text
            json_string = row[0]
            saved_time_str = row[1]
            if provider_name == "edamam":
                saved_time = datetime.strptime(saved_time_str, '%Y-%m-%d %H:%M:%S')
                if datetime.utcnow() - saved_time >= timedelta(hours=1):
                    logging.info(f"⏳ Cache expired for Edamam query: {query}. Fetching fresh data!")
                    return None

            # 2. Convert text back to a list of Python "dictionaries"
            recipes_dicts = json.loads(json_string)

            # 3. Convert each dict back into our premium Recipe object, and return the new list
            recipes_objects = []
            for d in recipes_dicts:
                recipes_objects.append(
                    Recipe(id=d['id'], title=d['title'], image=d['image'], url=d['url'], source=d['source']))

            return recipes_objects

        else:
            # Found nothing in cache
            return None

    def save_to_cache(self,query, provider_name, recipes_list):
        query = query.lower()
        if len(recipes_list) == 0:
            logging.info(f"⚠️ No recipes to cache for {provider_name} with query '{query}'. Skipping cache save.")
            return
        # This time the reverse: Convert Recipe objects to dicts, then to long text
        recipes_dicts = [r.to_dict() for r in recipes_list]
        json_string = json.dumps(recipes_dicts)

        cursor = self.connection.cursor()

        # Magic command: REPLACE means if someone inserted this key combo again, just overwrite the old info with the new (Perform an Update). It saves us checking if it exists!
        cursor.execute("REPLACE INTO provider_cache (query, provider_name, recipes_json) VALUES (?, ?, ?)",
                           (query, provider_name, json_string))
        self.connection.commit()

    def __del__(self):
        # When the server shuts down, Python will close the connection gracefully
        if hasattr(self, 'conn') and self.conn:
            self.conn.close()
            logging.info("🔌 Database connection closed gracefully.")


    def toggle_favorite(self,username, recipe_id, recipe_title, recipe_image, recipe_url):
        cursor = self.connection.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if user:
            user_id = user[0]
            cursor.execute("SELECT * FROM saved_recipes WHERE user_id = ? AND recipe_id = ?", (user_id, recipe_id))
            existing_recipe = cursor.fetchone()
            if existing_recipe:
                logging.info(f"🗑️The item '{recipe_title}' was successfully REMOVED from the database for user '{username}'")
                cursor.execute("DELETE FROM saved_recipes WHERE user_id = ? AND recipe_id = ?",
                               (user_id, recipe_id))
                self.connection.commit()
                return jsonify({"message": "Recipe removed successfully!", "action": "removed"}), 200
            else:
                logging.info(f"💾 The item '{recipe_title}' was successfully ADDED to the database for user '{username}'")
                cursor.execute(
                    "INSERT INTO saved_recipes (user_id, recipe_id, recipe_title, recipe_image ,recipe_url) VALUES (?, ?, ?, ?,?)",
                    (user_id, recipe_id, recipe_title, recipe_image, recipe_url))
                self.connection.commit()
                return jsonify({"message": "Recipe saved successfully!", "action": "saved"}), 201
        else:
            logging.warning(f"⚠️ Toggle recipe failed: User '{username}' not found.")
            return jsonify({"error": "User not found!"}), 404




    def get_favorites(self,username):
        cursor = self.connection.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        if user:
            user_id = user[0]
            cursor.execute(
                    "SELECT recipe_id, recipe_title, recipe_image, recipe_url FROM saved_recipes WHERE user_id = ?",
                    (user_id,))
            saved_rows = cursor.fetchall()
            return saved_rows
        else:
            return []

    def register_user(self,username,password):
        cursor = self.connection.cursor()
        try:
            cursor.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, password))
            self.connection.commit()
            logging.info(f"👤 New user registered: {username}")
            return jsonify({"message": "User registered successfully!"}), 201
        except sqlite3.IntegrityError:
            logging.warning(f"⚠️ Registration failed: Username '{username}' already exists.")
            return jsonify({"error": "Username already exists!"}), 400

    def login_user(self,username,password):
        cursor = self.connection.cursor()
        cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
        user = cursor.fetchone()
        if user:
            logging.info(f"👤 User logged in: {username}")
            return jsonify({"message": "Login successful!"}), 200
        else:
            logging.warning(f"⚠️ Login failed for username: {username}")
            return jsonify({"error": "Invalid username or password!"}), 401


db = DatabaseManager()
