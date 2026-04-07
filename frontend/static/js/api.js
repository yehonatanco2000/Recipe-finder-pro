// frontend/js/api.js

/**
 * קובץ זה אחראי אך ורק על ביצוע הקריאות לשרת (Backend).
 * בנינו פונקציות מסודרות כדי שלא נצטרך לרשום fetch בכל פעם מחדש.
 */

import { BASE_URL } from './config.js';

/**
 * פונקציית פנימית לביצוע קריאות לשרת כדי למנוע חזרה על קוד ('DRY')
 * @param {string} endpoint - הנתיב לשרת (לדוגמה: '/login')
 * @param {string} method - סוג הבקשה (GET, POST וכו')
 * @param {object} bodyData - נתונים לשליחה בבקשות POST (אופציונלי)
 * @returns {Promise<Response>} - מחזירה את התשובה מהשרת
 */
async function apiCall(endpoint, method = 'GET', bodyData = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    // אם יש מידע לשלוח (כמו ב-Login/Register/Save), נוסיף אותו
    if (bodyData) {
        options.body = JSON.stringify(bodyData);
    }
    
    // מחזירים את אובייקט ה-Response כמו שהוא, כדי ש-main.js יוכל לבדוק אם if(response.ok)
    return await fetch(`${BASE_URL}${endpoint}`, options);
}

// ----------------------------------------------------
// ייצוא כל הפונקציות שאנחנו חושפים לקבצים האחרים
// ----------------------------------------------------

export async function loginUser(username, password) {
    return await apiCall('/login', 'POST', { username, password });
}

export async function registerUser(username, password) {
    return await apiCall('/register', 'POST', { username, password });
}

export async function fetchFavorites(username) {
    return await apiCall(`/favorites?username=${username}`, 'GET');
}

export async function searchRecipes(ingredients, cuisine,selectedHealthLabels) {
    return await apiCall(`/search?ingredients=${ingredients}&cuisine=${cuisine}&selectedHealthLabels=${selectedHealthLabels}`, 'GET');
}

export async function fetchRecommendations(username) {
    return await apiCall(`/recommendations?username=${username}`, 'GET');
}

export async function toggleSavedRecipe(recipeDataToSave) {
    return await apiCall('/toggle_recipe', 'POST', recipeDataToSave);
}

export async function identifyImageFromAPI(imageFile) {
    const formData = new FormData();
    formData.append('image', imageFile);
    // עושים פה fetch ייחודי כי כאן אי אפשר לשלוח JSON, אלא רק FormData פיזי של קבצים
    const response = await fetch('/api/vision', {
        method: 'POST',
        body: formData
    });
    return response;
}
