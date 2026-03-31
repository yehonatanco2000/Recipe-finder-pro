// frontend/js/main.js

/**
 * קובץ הבוס הגדול. זהו הקובץ שמוגדר ב-HTML כ- <script type="module" src="...">
 * הוא מייבא את כל הכלים משאר הקבצים ומחבר ביניהם. (מאזיני אירועים - Event Listeners)
 */

import { fetchFavorites, searchRecipes, fetchRecommendations, toggleSavedRecipe, loginUser, registerUser } from './api.js';
import { isLoggedIn, currentUser, savedRecipeIds, searchTags, login, logout, updateSavedRecipes, addSavedRecipe, removeSavedRecipe, addSearchTag, removeSearchTag, clearSearchTags } from './auth.js';
import { elements, createRecipeCardHTML, renderChips, showCustomAlert } from './ui.js';


// כלי עזר מודרני: פונקציית "השהייה" שעוצרת את הקוד אבל לא מקפיאה את המסך (Promise-based sleep)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// הסוכן החכם הכללי שיודע להריץ כל פעולה שהוא מקבל, ולנסות שוב בעת עומס!
async function fetchWithDynamicRetry(apiAction, messageElement, retryCount = 0) {
    if (retryCount > 0) {
        messageElement.innerHTML = `<p style="grid-column: 1 / -1; color: #ff9800; text-align: center; width:100%;">Heavy traffic. Retrying... (Attempt ${retryCount}/3) ⏳</p>`;
    }

    try {
        const response = await apiAction(); // מפעיל את הפעולה (apiAction) שהעברנו לו בסוגריים!
        const data = await response.json();

        // מזהה אך ורק אם יש עומס אמיתי בשרת, ולא כל שגיאה כללית!
        if ((data.status === "error" && data.message === "Limits exceeded") || 
            data.error === "Failed to generate recommendations" || 
            data.error === "Failed to fetch recipes" ||
            data.error === "Failed to fetch fresh favorites") {
            if (retryCount < 3) {
                messageElement.innerHTML = `<p style="grid-column: 1 / -1; color: #ff9800; text-align: center; width:100%;">Server is busy! Waiting 15 seconds... (Attempt ${retryCount + 1}/3) 🕒</p>`;
                await delay(15000); //  עוצר את הקוד כאן ל-15 שניות באופן קליל ואסינכרוני!
                return await fetchWithDynamicRetry(apiAction, messageElement, retryCount + 1);
            } else {
                messageElement.innerHTML = "<p style='grid-column: 1 / -1; color: #ff6b6b; text-align: center; width:100%;'>Servers are too busy right now. Please try again later. ❌</p>";
                return null;
            }
        }

        return data; // הצליח להביא תוצאות נקיות!

    } catch (error) {
        console.error("Fetch error:", error);
        messageElement.innerHTML = "<p style='color: #ff6b6b; text-align: center; width:100%;'>❌ Error communicating with the server.</p>";
        return null;
    }
}



// ==========================================
// 🚀 טריק מקצוענים: דריסת פונקציית ה-alert המובנית בכל הדפדפן 🚀
// כל פעם שקוד כלשהו שלנו יקרא ל- alert("משהו") מעכשיו - הוא בעצם יקרא למודאל המעוצב!
window.alert = function(msg) {
    showCustomAlert(msg);
};

// מאזין לאירוע הלחיצה על "הבנתי" כדי לסגור את חלון ההתראה הקופץ
if (elements.closeAlertBtn) {
    elements.closeAlertBtn.addEventListener('click', () => {
        elements.customAlertModal.classList.remove('show');
    });
}

// ==========================================
// חיבור פונקציות לסביבה העולמית (window)
// הסיבה: בגלל המעבר למודולים הפונקציות לא זמינות באופן אוטומטי מה-HTML ל-JS (למשל: onclick)
// ==========================================

window.removeChip = function(index) {
    removeSearchTag(index);
    renderChips(searchTags);
};

window.toggleDetails = function(element) {
    const card = element.closest('.recipe-card') || element.closest('.fav-card');
    const details = card.querySelector('.recipe-details');
    if (details) {
        details.classList.toggle('show');
    }
};

window.toggleSave = async function(button, recipeId) {
    if (!isLoggedIn) {
        alert("Please log in to save recipes!");
        return;
    }

    const card = button.closest('.recipe-card');
    // עכשיו כל הכותרות משתמשות באותו קלאס, אז קל מאוד למצוא אותן!
    const recipeTitle = card.querySelector('.recipe-title').innerText;
    const recipeImage = card.querySelector('img').src;
    const recipeUrl = card.querySelector('.recipe-details a').href;

    const recipeDataToSave = {
        username: currentUser,
        recipe_id: recipeId,
        recipe_title: recipeTitle,
        recipe_image: recipeImage,
        recipe_url: recipeUrl
    };

    try {
        const response = await toggleSavedRecipe(recipeDataToSave);
        if (response.ok) {
            const data = await response.json();
            if (data.action === "saved") {
                button.innerText = '❤️';
                addSavedRecipe(recipeId);
            } else {
                button.innerText = '🤍';
                removeSavedRecipe(recipeId);
                
                // אם אנחנו בתוך מודאל המועדפים, נסיר את הכרטיסייה פיזית מהמסך מיד!
                if (button.closest('#favorites-grid')) {
                    card.style.opacity = '0';
                    setTimeout(() => card.remove(), 300); 
                }
            }
            
            // 🚀 סנכרון לבבות: מעדכן את כל המקומות שבהם המתכון הזה מופיע (בחיפוש ובהמלצות)
            const allSameHearts = document.querySelectorAll(`button[onclick*='${recipeId}']`);
            allSameHearts.forEach(h => h.innerText = (data.action === "saved" ? '❤️' : '🤍'));

        } else {
            const data = await response.json();
            alert("Failed to save recipe: " + data.error);
        }
    } catch (error) {
        console.error("Error saving recipe:", error);
        alert("Could not connect to the server to save the recipe.");
    }
};

// ==========================================
// הוספת מאזיני אירועים (Event Listeners)
// ==========================================

// פתיחה/סגירה תפריט צד
elements.menuButton.addEventListener('click', () => elements.sidebar.classList.add('open'));
elements.closeButton.addEventListener('click', () => elements.sidebar.classList.remove('open'));

// כפתור "בית" - מחזיר אותנו למצב נקי בלי לרענן את הדף
elements.homeBtn.addEventListener('click', () => {
    elements.resultsContainer.innerHTML = "";
    elements.searchMessage.innerHTML = "";
    elements.searchInput.value = "";
    clearSearchTags(); // מנקה את רשימת התגיות ב-auth.js
    renderChips([]);   // מנקה את התצוגה של התגיות במסך
    elements.sidebar.classList.remove('open');
    // אם המשתמש מחובר, נשארים עם ההמלצות שלו
    if (isLoggedIn) {
        elements.recommendationsWrapper.style.display = 'block';
    }
});


elements.openLoginHomeBtn.addEventListener('click', () => {
    elements.loginModal.classList.add('show');
});
elements.closeModalBtn.addEventListener('click', () => elements.loginModal.classList.remove('show'));

// מודאל הרשמה
elements.registerBtn.addEventListener('click', () => {
    elements.loginModal.classList.remove('show');
    elements.registerSection.classList.add('show');
});

// סגירת חלון מועדפים
elements.closeFavoritesBtn.addEventListener('click', () => elements.favoritesModal.classList.remove('show'));

// הוספת מצרכים (תגיות) בחיפוש בעזרת פסיק
elements.searchInput.addEventListener('keyup', (event) => {
    if (event.key === ',') {
        let inputValue = elements.searchInput.value.replace(',', '').trim();
        // מוודאים שאפשר להוסיף את התגית (שלא ריקה ולא קיימת כבר)
        if (addSearchTag(inputValue)) {
            renderChips(searchTags);
        }
        elements.searchInput.value = '';
    }
});

// התנתקות משתמש
elements.logoutBtn.addEventListener('click', () => {
    if (isLoggedIn) {
        logout();
        elements.logoutBtn.style.display = "none";
        elements.userGreeting.style.display = "none";
        elements.favoritesBtn.style.display = "none";
        elements.openLoginHomeBtn.style.display = "block";
        elements.resultsContainer.innerHTML = "";
        elements.searchMessage.innerHTML = "";
        elements.sidebar.classList.remove('open');
        elements.searchInput.value = "";
        elements.recommendationsWrapper.style.display = 'none';
        alert('You have been logged out.');
    }
});

// כפתור התחברות
elements.loginBtn.addEventListener('click', async () => {
    const username = elements.usernameInput.value.trim();
    const password = elements.passwordInput.value;
    
    if (username === "") return alert("Please enter a username.");
    if (password === "") return alert("Please enter a password.");

    try {
        const response = await loginUser(username, password);
        const data = await response.json();

        if (response.ok) {
            login(username); // קריאה לפונקציית העדכון מ-auth.js
            
            // משיכת מועדפים ישירות מהשרת (כדי לדעת איזה מתכונים נעיצוב הלב אדום)
            // השתמשנו בסוכן ה-Retry שלנו גם כאן כדי לוודא שהתחברות לא "נתקעת" בגלל עומס
            const favData = await fetchWithDynamicRetry(() => fetchFavorites(username), elements.resultsContainer); 
            
            if (favData && Array.isArray(favData)) {
                updateSavedRecipes(favData.map(fav => fav.recipe_id));
            }
            

            elements.openLoginHomeBtn.style.display = "none";
            elements.userGreeting.innerText = `Hello ${currentUser} 👋`;
            elements.userGreeting.style.display = "block";
            elements.logoutBtn.style.display = "block";
            elements.favoritesBtn.style.display = "block";
            elements.loginModal.classList.remove('show');
            elements.usernameInput.value = "";
            elements.passwordInput.value = "";
            
            alert('Login successful! Welcome back.');
            loadRecommendations();
        } else {
            alert("Login failed: " + data.error);
        }
    } catch (error) {
        console.error("Error during login:", error);
        alert("Could not connect to the server.");
    }
});

// כפתור ביצוע הרשמה
elements.confirmRegisterBtn.addEventListener('click', async () => {
    const username = elements.registerUsernameInput.value.trim();
    const password = elements.registerPasswordInput.value;
    const confirmPassword = elements.registerConfirmPasswordInput.value;

    if (username === "" || password === "" || confirmPassword === "") return alert("Please fill in all fields.");
    if (password !== confirmPassword) return alert("Passwords do not match.");

    try {
        const response = await registerUser(username, password);
        const data = await response.json();

        if (response.ok) {
            login(username);
            

            elements.userGreeting.innerText = `Hello ${currentUser} 👋`;
            elements.userGreeting.style.display = "block";
            elements.logoutBtn.style.display = "block";
            elements.favoritesBtn.style.display = "block";
            elements.recommendationsWrapper.style.display = 'none';
            elements.registerSection.classList.remove('show');
            elements.loginModal.classList.remove('show');
            elements.openLoginHomeBtn.style.display = "none";
            
            elements.registerUsernameInput.value = "";
            elements.registerPasswordInput.value = "";
            elements.registerConfirmPasswordInput.value = "";
            
            alert('Registered successfully! Welcome to the kitchen.');
        } else {
            alert("Registration failed: " + data.error);
        }
    } catch (error) {
        console.error("Error during registration:", error);
        alert("Could not connect to the server. Is Python running?");
    }
});

// צפייה במועדפים
elements.favoritesBtn.addEventListener('click', async () => {
    if (!isLoggedIn) return alert('Please log in to view your favorites!');
    
    elements.sidebar.classList.remove('open');
    elements.favoritesModal.classList.add('show');
    elements.favoritesGrid.innerHTML = "<p style='color: white; text-align: center; width: 100%;'>Loading your favorites... ⏳</p>";

    const data = await fetchWithDynamicRetry(() => fetchFavorites(currentUser), elements.favoritesGrid);

    if (!data) return; // השעון או השגיאה כבר הודפסו בגריד על ידי הסוכן
    elements.favoritesGrid.innerHTML = "";

    // הגנה: אם קיבלנו אובייקט עם שגיאה במקום מערך (בגלל שהסוכן סיים בלי הצלחה), פשוט נצא
    if (!data || !Array.isArray(data)) return;

    if (data.length === 0) {
        elements.favoritesGrid.innerHTML = "<p style='color: white; text-align: center; width: 100%;'>You haven't saved any recipes yet! 🤍</p>";
        return;
    }

    // שימוש בפונקציה שלנו מה-UI. בנינו כאן פונקציונליות מיוחדת לעיצוב המועדפים:
    data.forEach(favRecipe => {
        elements.favoritesGrid.innerHTML += createRecipeCardHTML(favRecipe, true, 'favorite');
    });
});

// לחצן חיפוש
elements.searchButton.addEventListener('click', async () => {

    if (elements.searchInput.value.trim() !== "") {
        addSearchTag(elements.searchInput.value.trim());
        elements.searchInput.value = "";
        renderChips(searchTags); // הוספתי בשבילך! זה היה הפקשוש - בלי השורה הזו הקוד זוכר את המילה אבל שוכח לצייר אותה
    }
    
    if (searchTags.length === 0) {
        return alert('Please enter an ingredient to search for recipes.');
    }

    const ingredientsStr = searchTags.join(',').toLowerCase();
    elements.sidebar.classList.remove('open');
    elements.resultsContainer.innerHTML = "";
    elements.searchMessage.innerHTML = "<p>Loading recipes... ⏳</p>";
    let cuisine = elements.cuisineSelect.value;

    // מפעילים את כלי העזר הכללי שלנו! שולחים לו מה לעשות (החיפוש) ואיפה לגרף הודעות
    const data = await fetchWithDynamicRetry(() => searchRecipes(ingredientsStr, cuisine), elements.searchMessage);

   // אם הסוכן החזיר חלל ריק (null), סימן שהוא נכשל גם אחרי 3 ניסיונות!
    // ואז אנחנו פשוט יוצרים החוצה, הוא כבר הדפיס את התקלה במסך.
    if (!data) return;

    // -- אם הגענו לכאן - יש תשובה נכונה! רגיל --
    elements.searchMessage.innerHTML = "";
    const recipesList = data;
    if (!recipesList || recipesList.length === 0) {
          elements.searchMessage.innerHTML = "<p>No recipes found. Try different ingredients!</p>";
          return;
    }

    elements.recommendationsWrapper.style.display = 'none';

    recipesList.forEach(item => {
        const recipeData = item;
        const isSaved = savedRecipeIds.includes(recipeData.id);
        elements.resultsContainer.innerHTML += createRecipeCardHTML(recipeData, isSaved, 'search');
    });
});

// ==========================================
// פונקציות אתחול - כשהאתר נטען מחדש
// ==========================================

async function loadRecommendations() {
    if (!currentUser) return;
    
    // אנו מציגים את הקובייה לפני שיש תוכן רק בתנאי שאין חיפוש באמצע המסך,
    // ומדפיסים הודעה שיודעת לתת לחיווי (פדרג/המתנה)
    if (elements.resultsContainer.innerHTML.trim() === "") {
        elements.recommendationsWrapper.style.display = 'block';
    }

    elements.recommendationsGrid.innerHTML = "<p style='grid-column: 1 / -1; color: white; text-align: center; width: 100%;'>Fetching your personal top picks... ⏳</p>";

    // הנה הסוכן נכנס גם לכאן! הפעם שולחים לו את בסיס ההמלצות, ואת לוח הגריד כבמת ההודעות
    const data = await fetchWithDynamicRetry(
        () => fetchRecommendations(currentUser),
        elements.recommendationsGrid
    );

    if (!data) return; // השעון או השגיאה כבר הודפסו בגריד על ידי הסוכן
    
    // אם זו שגיאה טבעית של "משתמש חדש בלי מועדפים", נעלים את הקובייה לחלוטין כמו פעם ונסיים
    if (data.error) {
        elements.recommendationsWrapper.style.display = 'none';
        return;
    }

    // אם הכל עבר חלק, נצייר:
    elements.recommendationsGrid.innerHTML = "";
    data.forEach(recipeData => {
        const isSaved = savedRecipeIds.includes(recipeData.id); // בודק אם כבר עשינו לייק בעבר!
        const recipeCardHTML = createRecipeCardHTML(recipeData, isSaved, 'recommendation');
        elements.recommendationsGrid.innerHTML += recipeCardHTML;
    });
    console.log("Recommended recipes loaded securely.");
}


// שחזור משתמש מהכספת בטעינת העמוד (אם כבר התחברנו בעבר)
const userFromStorage = localStorage.getItem('savedUser');
if (userFromStorage) {
    login(userFromStorage);

    elements.openLoginHomeBtn.style.display = "none";
    elements.userGreeting.innerText = `Hello ${currentUser} 👋`;
    elements.userGreeting.style.display = "block";
    elements.logoutBtn.style.display = "block";
    elements.favoritesBtn.style.display = "block";

    // מעדכנים את מערך המתכונים השמורים שלנו כדי לדעת איזה לב לעשות אדום
    fetchFavorites(currentUser)
        .then(res => res.json())
        .then(data => {
            updateSavedRecipes(data.map(fav => fav.recipe_id));
        })
        .catch(err => console.error("Could not fetch favorites on load", err));
}


// ברגע שה-HTML נטען כראוי נפעיל את תהליך חיפוש ההמלצות
window.addEventListener('DOMContentLoaded', loadRecommendations);
