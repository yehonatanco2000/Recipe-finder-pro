<div align="center">
  <img src="https://img.shields.io/badge/Python-Flask-blueviolet?style=for-the-badge&logo=python" alt="Python Flask"/>
  <img src="https://img.shields.io/badge/Vanilla-JS-yellow?style=for-the-badge&logo=javascript" alt="Vanilla JS"/>
  <img src="https://img.shields.io/badge/AI-HuggingFace-orange?style=for-the-badge" alt="HuggingFace CLIP"/>
  <img src="https://img.shields.io/badge/ML-Scikit_Learn-blue?style=for-the-badge&logo=scikit-learn" alt="Scikit-Learn"/>
</div>

# 👨‍🍳 Recipe Finder Pro

**Recipe Finder Pro** is a high-performance, full-stack web application designed to intelligently aggregate recipe data, analyze fridge ingredients using offline Computer Vision, and provide hyper-personalized recommendations using Machine Learning.

This project was built from the ground up to demonstrate a comprehensive understanding of modern system architecture, AI integration, and clean code principles.

## ✨ Core Features

*   **🌐 API Aggregator (Adapter Pattern)**: Seamlessly fetches and standardizes recipe data from multiple diverse external providers (Edamam, Spoonacular, Tasty) into a unified internal format.
*   **📷 Offline Computer Vision API**: Users can take a picture of an ingredient in their fridge, and the app will identify it using a Zero-Shot classification model (**Hugging Face CLIP**) running *completely locally/offline* to save latency and bandwidth.
*   **🧠 Machine Learning Recommendations**: Utilizes **TF-IDF Vectorization** and **Cosine Similarity** (`scikit-learn`) to mathmatically cluster the user's saved favorites against massive datasets to provide accurate, personalized recommendations.
*   **💾 Intelligent Caching Layer**: Heavily mitigates API rate limits by saving raw query results via a custom SQLite3 caching manager, utilizing rapid `REPLACE INTO` statements to ensure fresh data.
*   **💎 Premium "Glassmorphism" UI with Dark Mode**: An Apple-inspired, responsive user interface built rapidly with pure HTML5, CSS3 Variables, and Vanilla ES6 JavaScript. Includes full native Dark Mode support based on user preference.
*   **♿ User-Centric Accessibility**: Advanced filtering engines allow users to strictly navigate recipes by complex dietary restrictions (Vegan, Gluten-Free, Peanut-Free), allergies, and global Cuisine types.
## 🏗️ Architecture & Engineering Highlights

As a software engineer, I placed a heavy emphasis on architectural design patterns and separation of concerns throughout the codebase:

### 1. Object-Oriented Backend (Python)
*   **Strategy / Adapter Pattern**: The system utilizes a parent `RecipeManager` class that orchestrates requests across various `Provider` subclasses (e.g., `EdamamProvider`, `TastyProvider`). This eliminates messy `if/else` networks and strictly adheres to the **Open/Closed Principle**. Adding a new API provider requires zero changes to the core routing logic.
*   **Modular Blueprints**: Flask routes are strictly isolated based on domain logic (`auth_routes.py`, `recipe_routes.py`, `vision_routes.py`).
*   **Production-Grade Logging**: Stripped out all beginner `print()` statements and implemented global `logging`. It cleanly formats and centralizes authentication events, API fetch statuses, and errors.
*   **Database Management**: Integrated `SQLite3` with an auto-initialization mechanism (`init_db()`), eliminating the need for complex manual migrations while protecting the cache table structure using `REPLACE INTO` logic.

### 2. Modern Vanilla JS Frontend
*   The frontend avoids "spaghetti code" by employing strict **Separation of Concerns**:
    *   `api.js`: Solely responsible for Network/Fetch execution.
    *   `auth.js`: Manages local state and session persistence (treating data similarly to a Redux store).
    *   `ui.js`: Purely handles DOM manipulations and transitions.
    *   `main.js`: The central Controller managing Event Listeners and orchestration.

## 🚀 The Development Journey

This repository represents an intensive, self-taught roadmap. Coming into this project learning many of these concepts from scratch, I treated this application as a relentless bootcamp for professional engineering practices:
*   **Version Control**: Developed using structured **Git** commits to securely manage feature branches.
*   **AI Pair Programming**: Actively leveraged GitHub Copilot and AI assistants (Gemini) as "Senior Developers" to help manage architectural scoping, maximize the efficiency of logic algorithms, and polish UI micro-interactions. Emphasizing prompt engineering allowed me to safely refactor and push the project beyond standard junior capabilities.

## ⚙️ Local Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/recipe-app.git
   cd recipe-app
   ```
2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Configure the Environment:**
   * An example environment file is provided to safely guide setup. Run:
     ```bash
     cp .env.example .env
     ```
   * Open the newly created `.env` file and insert your API Keys (`EDAMAM`, `SPOONACULAR`, etc.)
   * Set `TRANSFORMERS_OFFLINE=0` for the very first execution (so the CLIP AI model can physically download to your machine). Once downloaded, flip this to `1` to run the model entirely locally and instantly.
4. **Boot the Backend Server:**
   ```bash
   python backend/app.py
   ```
   *(Note: The database tables will instantly auto-initialize on the first run, no manual SQL commands are required).*
5. **Access the application:**
   Navigate to `http://localhost:5000` in your browser.

---
*Built with ❤️ by Yehonatan Cohen.*
