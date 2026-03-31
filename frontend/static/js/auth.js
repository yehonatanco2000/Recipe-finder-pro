// frontend/js/auth.js

/**
 * קובץ זה מנהל את כל הסטטוס (State) של המשתמש.
 * הוא מחזיק האם מחוברים, מה השם, ואילו מועדפים יש.
 * אין כאן פניות לשרת ולא נגיעות במסך ה-HTML!
 */

// משתני מערכת (מיוצאים כדי ש-main יוכל לקרוא אותם)
export let isLoggedIn = false;
export let currentUser = ""; 
export let savedRecipeIds = []; 
export let searchTags = [];

// פעולת התחברות
export function login(username) {
    isLoggedIn = true;
    currentUser = username;
    // שומרים גם בכספת של הדפדפן כדי לזכור אותו לפעם הבאה
    localStorage.setItem('savedUser', username);
}

// פעולת התנתקות
export function logout() {
    isLoggedIn = false;
    currentUser = "";
    savedRecipeIds = [];
    localStorage.removeItem('savedUser');
}

// עדכון רשימת המועדפים (כאשר שואבים אותם מהשרת)
export function updateSavedRecipes(idsArray) {
    savedRecipeIds = idsArray;
}

// הוספת מועדף
export function addSavedRecipe(id) {
    if (!savedRecipeIds.includes(id)) {
        savedRecipeIds.push(id);
    }
}

// הסרת מועדף
export function removeSavedRecipe(id) {
    savedRecipeIds = savedRecipeIds.filter(savedId => savedId !== id);
}

// ניהול תגיות חיפוש
export function addSearchTag(tag) {
    if (tag !== '' && !searchTags.includes(tag)) {
        searchTags.push(tag);
        return true; // הצליח
    }
    return false; // התגית כבר קיימת או ריקה
}

export function removeSearchTag(index) {
    searchTags.splice(index, 1);
}

export function clearSearchTags() {
    searchTags = [];
}
