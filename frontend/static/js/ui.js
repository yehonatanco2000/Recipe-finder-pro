// frontend/js/ui.js

/**
 * קובץ זה אחראי על ה-User Interface (UI).
 * הוא שומר את כל חיפושי האלמנטים ב-HTML (document.getElementById)
 */

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
    closeRegisterBtn: document.getElementById('close-register-btn'),
    chipsContainer: document.getElementById('chip-container'),
    recommendationsWrapper: document.getElementById('recommendations'),
    recommendationsGrid: document.getElementById('recommendations-grid'),
    favoritesGrid: document.getElementById('favorites-grid'),
    openLoginHomeBtn: document.getElementById('open-login-homepage'),
    cuisineSelect: document.getElementById('cuisine-select'),
    customAlertModal: document.getElementById('custom-alert-modal'),
    customAlertText: document.getElementById('custom-alert-text'),
    closeAlertBtn: document.getElementById('close-alert-btn'),
    vegan: document.getElementById('vegan-check'),
    vegetarian: document.getElementById('vegetarian-check'),
    glutenFree: document.getElementById('gluten-check'),
    peanut: document.getElementById('peanut-check'),
    themeToggle: document.getElementById('theme-toggle'),
    snapBtn: document.getElementById('snap-btn'),
    cameraInput: document.getElementById('camera-input')
};

export function showCustomAlert(msg) {
    if (elements.customAlertModal && elements.customAlertText) {
        elements.customAlertText.innerText = msg;
        elements.customAlertModal.classList.add('show');
    }
}

export function createRecipeCardHTML(recipeData, isSaved, viewType) {
    let heartIcon = isSaved ? '❤️' : '🤍';
    
    // בסיס הכרטיסייה - נשתמש במבנה אחיד ומקצועי
    const caloriesHTML = recipeData.calories ? `<p class="recipe-calories">🔥 ${Math.round(recipeData.calories)} kcal</p>` : '';
    
    return `
        <div class="recipe-card ${viewType}-card">
            <div class="card-image-wrapper">
                <button class="save-btn" onclick="window.toggleSave(this,'${recipeData.id}','${recipeData.title.replace(/'/g, "\\'")}','${recipeData.image}','${recipeData.url}')" title="Save to favorites">
                    ${heartIcon}
                </button>
                <img src="${recipeData.image}" onerror="this.onerror=null; this.src='/static/images/fallback.png';" alt="${recipeData.title}" class="clickable" onclick="window.toggleDetails(this)">
            </div>
            <div class="card-content">
                <h3 class="recipe-title clickable" onclick="window.toggleDetails(this)">${recipeData.title}</h3>
                <div class="recipe-details">
                    ${caloriesHTML}
                    <a href="${recipeData.url}" target="_blank" class="view-recipe-link">View Full Recipe ➜</a>
                </div>
            </div>
        </div>
    `;
}

export function renderChips(tagsArr) {
    if (!elements.chipsContainer) return;
    elements.chipsContainer.innerHTML = '';
    tagsArr.forEach((tag, index) => {
        elements.chipsContainer.innerHTML += `
            <span class="chip">${tag}
            <span class="chip-remove" onclick="window.removeChip(${index})">x</span></span>
        `;
    });
}
