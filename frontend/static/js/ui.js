// frontend/js/ui.js

/**
 * קובץ זה אחראי על ה-User Interface (UI).
 * הוא שומר את כל חיפושי האלמנטים ב-HTML (document.getElementById)
 * ומספק פונקציות שמייצרות קוד HTML חדש (כמו כרטיסיות המתכונים).
 */

// משתנה אחד שמרכז את כל האלמנטים במסך
export const elements = {
    menuButton: document.getElementById('menu-button'),
    closeButton: document.getElementById('close-sidebar'),
    homeBtn: document.getElementById('home-btn'),
    sidebar: document.getElementById('sidebar'),
    searchButton: document.getElementById('search-button'),
    searchInput: document.getElementById('search-input'),
    searchMessage: document.getElementById('search-message'),
    resultsContainer: document.getElementById('results'),
    loginModal: document.getElementById('login-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    loginBtn: document.getElementById('login-btn'),
    registerBtn: document.getElementById('register-btn'),
    favoritesBtn: document.getElementById('favorites-list-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    favoritesModal: document.getElementById('favorites-modal'),
    closeFavoritesBtn: document.getElementById('close-favorites-btn'),
    usernameInput: document.getElementById('username-input'),
    passwordInput: document.getElementById('password-input'),
    userGreeting: document.getElementById('user-greeting'),
    registerUsernameInput: document.getElementById('register-username-input'),
    registerPasswordInput: document.getElementById('register-password-input'),
    registerConfirmPasswordInput: document.getElementById('register-confirm-password-input'),
    confirmRegisterBtn: document.getElementById('confirm-register-btn'),
    registerSection: document.getElementById('register-section'),
    chipsContainer: document.getElementById('chip-container'),
    recommendationsWrapper: document.getElementById('recommendations'),
    recommendationsGrid: document.getElementById('recommendations-grid'),
    favoritesGrid: document.getElementById('favorites-grid'),
    openLoginHomeBtn: document.getElementById('open-login-homepage'),
    cuisineSelect: document.getElementById('cuisine-select'),
    customAlertModal: document.getElementById('custom-alert-modal'),
    customAlertText: document.getElementById('custom-alert-text'),
    closeAlertBtn: document.getElementById('close-alert-btn')
};

/**
 * פונקציה שמקפיצה את מודאל ההתראות המעוצב שלנו במרכז המסך
 */
export function showCustomAlert(msg) {
    if (elements.customAlertModal && elements.customAlertText) {
        elements.customAlertText.innerText = msg;
        elements.customAlertModal.classList.add('show');
    }
}

/**
 * פונקציה לבנייתHTML של כרטיסיית מתכון
 * חוסכת לנו כפילות של קוד ב-3 מקומות שונים (חיפוש, מועדפים, המלצות)!
 * 
 * @param {object} recipeData - הנתונים מהשרת
 * @param {boolean} isSaved - האם המתכון שמור אצל המשתמש (מעצב את הלב)
 * @param {string} viewType - הסגנון המבוקש: 'search', 'favorite', 'recommendation'
 * @returns {string} - מחרוזת של HTML
 */
export function createRecipeCardHTML(recipeData, isSaved, viewType) {
    let heartIcon = isSaved ? '❤️' : '🤍';
    
    // סגנון "מועדפים" - כרטיסייה קצת שונה, בלי כפתור הלב כי זה כבר במועדפים
    if (viewType === 'favorite') {
        return `
            <div class="recipe-card" style="text-align: center;">
                <button class="save-btn" onclick="window.toggleSave(this, '${recipeData.id}')" title="Remove from favorites">❤️</button>
                <img src="${recipeData.image}" onerror="this.onerror=null; this.src='/static/images/fallback.png'; this.style.objectFit='contain'; this.style.backgroundColor='#f8f9fa';" class="clickable" onclick="window.toggleDetails(this)">
                <h4 class="recipe-title clickable" onclick="window.toggleDetails(this)" style="margin: 0; font-size: 16px;">${recipeData.title}</h4>
                <div class="recipe-details">
                    <a href="${recipeData.url}" target="_blank" style="display: inline-block; margin-top: 10px; color: #ff6b6b; text-decoration: none; font-weight: bold;">View Full Recipe ➜</a>
                </div>
            </div>
        `;
    } 
    // סגנון "המלצות"
    else if (viewType === 'recommendation') {
        return `
            <div class="recipe-card">
                <button class="save-btn" onclick="window.toggleSave(this, '${recipeData.id}')" title="Saved in favorites">${heartIcon}</button>
                <img src="${recipeData.image}" onerror="this.onerror=null; this.src='/static/images/fallback.png'; this.style.objectFit='contain'; this.style.backgroundColor='#fff';" alt="${recipeData.title}">
                <h2 class="recipe-title" style="font-size: 18px; margin-top: 15px;">${recipeData.title}</h2>
                <div class="recipe-details show" style="display: block; text-align: center; border: none;">
                    <a href="${recipeData.url}" target="_blank" style="background-color: #ff9800; color: white; padding: 5px 10px; text-decoration: none; border-radius: 5px;">watch the recipe</a>
                </div>
            </div>
        `;
    } 
    // סגנון "חיפוש רגיל"
    else {
        let caloriesHTML = recipeData.calories ? `<p style="color: #666;">Calories: ${Math.round(recipeData.calories)} kcal</p>` : '';
        return `
            <div class="recipe-card">
                <div style="position: relative;">
                    <button class="save-btn" onclick="window.toggleSave(this,'${recipeData.id}')" title="Saved in favorites">${heartIcon}</button>
                    <img src="${recipeData.image}" onerror="this.onerror=null; this.src='/static/images/fallback.png'; this.style.objectFit='contain'; this.style.backgroundColor='#fff';" alt="${recipeData.title}" class="clickable" onclick="window.toggleDetails(this)">
                </div>
                <h2 class="recipe-title clickable" onclick="window.toggleDetails(this)">${recipeData.title}</h2>
                <div class="recipe-details">
                    ${caloriesHTML}
                    <a href="${recipeData.url}" target="_blank" style="display: inline-block; margin-top: 10px; color: #ff6b6b; text-decoration: none; font-weight: bold;">View Full Recipe ➜</a>
                </div>
            </div>
        `;
    }
}

// פונקציה לרינדור של תגיות החיפוש (Chips) פנינים
export function renderChips(tagsArr) {
    elements.chipsContainer.innerHTML = '';
    tagsArr.forEach((tag, index) => {
        elements.chipsContainer.innerHTML += `
            <span class="chip">${tag}
            <span class="chip-remove" onclick="window.removeChip(${index})">x</span></span>
        `;
    });
}
