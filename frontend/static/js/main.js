// frontend/js/main.js

/**
 * The main boss file. This is defined in HTML as <script type="module" src="...">
 * It imports all tools from remaining files and connects them. (Event Listeners)
 */

import { fetchFavorites, searchRecipes, fetchRecommendations, toggleSavedRecipe, loginUser, registerUser, logoutUser, identifyImageFromAPI } from './api.js';
import { isLoggedIn, currentUser, savedRecipeIds, searchTags, login, logout, updateSavedRecipes, addSavedRecipe, removeSavedRecipe, addSearchTag, removeSearchTag, clearSearchTags } from './auth.js';
import { elements, createRecipeCardHTML, renderChips, showCustomAlert } from './ui.js';


// Modern utility: 'delay' function that pauses code without freezing the screen (Promise-based sleep)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// General smart agent that runs given actions and retries during overload!
async function fetchWithDynamicRetry(apiAction, messageElement, retryCount = 0) {
    if (retryCount > 0) {
        messageElement.innerHTML = `<p style="grid-column: 1 / -1; color: #ff9800; text-align: center; width:100%;">Heavy traffic. Retrying... (Attempt ${retryCount}/3) ⏳</p>`;
    }

    try {
        const response = await apiAction(); // Executes the passed action (apiAction)!
        const data = await response.json();

        // Identifies strictly genuine server overloads, not general errors!
        if ((data.status === "error" && data.message === "Limits exceeded") || 
            data.error === "Failed to generate recommendations" || 
            data.error === "Failed to fetch recipes" ||
            data.error === "Failed to fetch fresh favorites") {
            if (retryCount < 3) {
                messageElement.innerHTML = `<p style="grid-column: 1 / -1; color: #ff9800; text-align: center; width:100%;">Server is busy! Waiting 15 seconds... (Attempt ${retryCount + 1}/3) 🕒</p>`;
                await delay(15000); // Lightweight asynchronous code pause for 15 seconds!
                return await fetchWithDynamicRetry(apiAction, messageElement, retryCount + 1);
            } else {
                messageElement.innerHTML = "<p style='grid-column: 1 / -1; color: #ff6b6b; text-align: center; width:100%;'>Servers are too busy right now. Please try again later. ❌</p>";
                return null;
            }
        }

        return data; // Successfully fetched clean results!

    } catch (error) {
        console.error("Fetch error:", error);
        messageElement.innerHTML = "<p style='color: #ff6b6b; text-align: center; width:100%;'>❌ Error communicating with the server.</p>";
        return null;
    }
}



// ==========================================
// 🚀 Pro trick: Overriding the browser's built-in alert function 🚀
// Anytime our code calls alert('something') from now on - it'll call the custom UI modal!
window.alert = function(msg) {
    showCustomAlert(msg);
};

// Listens to 'Got it' click event to close the popup alert modal
if (elements.closeAlertBtn) {
    elements.closeAlertBtn.addEventListener('click', () => {
        elements.customAlertModal.classList.remove('show');
    });
}

// ==========================================
// Connecting functions to the global environment (window)
// Reason: Module isolation means functions aren't automatically available in HTML (e.g: onclick)
// 🧹 Organized function to clear the screen and transition to a clean Home State
function resetToHomeState() {
    elements.resultsContainer.innerHTML = "";
    elements.searchMessage.innerHTML = "";
    elements.searchInput.value = "";
    clearSearchTags();
    renderChips([]);
    elements.sidebar.classList.remove('open');
    if (isLoggedIn && savedRecipeIds.length > 0) {
        elements.recommendationsWrapper.style.display = 'block';
    } else {
        elements.recommendationsWrapper.style.display = 'none';
    }
}

window.removeChip = function(index) {
    removeSearchTag(index);
    renderChips(searchTags);
    if (searchTags.length === 0) {
        resetToHomeState();
    }
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
    // Now all titles use the same class, making them easy to select!
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
                
                // If inside favorites modal, immediately remove the card element physically from screen!
                if (button.closest('#favorites-grid')) {
                    card.style.opacity = '0';
                    setTimeout(() => card.remove(), 300); 
                }
            }
            
            // 🚀 Heart synchronization: Update all locations where this recipe appears (search / recommendations)
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
// Attaching Event Listeners
// ==========================================

// Open/Close sidebar menu
elements.menuButton.addEventListener('click', () => elements.sidebar.classList.add('open'));
elements.closeButton.addEventListener('click', () => elements.sidebar.classList.remove('open'));

// 'Home' button - returns logically to clean state without refreshing page
elements.homeBtn.addEventListener('click', resetToHomeState);


elements.openLoginHomeBtn.addEventListener('click', () => {
    elements.loginModal.classList.add('show');
});
elements.closeModalBtn.addEventListener('click', () => elements.loginModal.classList.remove('show'));

// Registration modal
elements.registerBtn.addEventListener('click', () => {
    elements.loginModal.classList.remove('show');
    elements.registerSection.classList.add('show');
});

// Close favorites window
elements.closeFavoritesBtn.addEventListener('click', () => elements.favoritesModal.classList.remove('show'));

// Adding ingredients (tags) to search using comma delimiter
elements.searchInput.addEventListener('keyup', (event) => {
    if (event.key === ',') {
        let inputValue = elements.searchInput.value.replace(',', '').trim();
        // Ensure tag can be added (not empty and doesn't exist)
        if (addSearchTag(inputValue)) {
            renderChips(searchTags);
        }
        elements.searchInput.value = '';
    }
});

// User logout
elements.logoutBtn.addEventListener('click', async () => {
    if (isLoggedIn) {
        await logoutUser(currentUser);
        logout();
        document.body.classList.remove('logged-in'); // Revert to initial state without results/recommendations
        elements.logoutBtn.style.display = "none";
        elements.userGreeting.style.display = "none";
        elements.favoritesBtn.style.display = "block";
        elements.openLoginHomeBtn.style.display = "block";
        elements.resultsContainer.innerHTML = "";
        clearSearchTags();
        renderChips([]);
        elements.searchMessage.innerHTML = "";
        elements.sidebar.classList.remove('open');
        elements.searchInput.value = "";
        elements.recommendationsWrapper.style.display = 'none';
        alert('You have been logged out.');
    }
});

// Login button
elements.loginBtn.addEventListener('click', async () => {
    const username = elements.usernameInput.value.trim();
    const password = elements.passwordInput.value;
    
    if (username === "") return alert("Please enter a username.");
    if (password === "") return alert("Please enter a password.");

    const originalBtnText = elements.loginBtn.innerText;
    elements.loginBtn.innerHTML = "<div class='spinner' style='width: 20px; height: 20px; border-width: 3px; margin: 0 auto; border-top-color: white;'></div>";
    elements.loginBtn.style.pointerEvents = 'none';

    try {
        const response = await loginUser(username, password);
        const data = await response.json();

        if (response.ok) {
            login(username); // Call update function from auth.js
            document.body.classList.add('logged-in'); // Unlock ability to display cards
            
            // Fetch favorites directly from server (to know which recipe hearts to color red)
            // We use our Retry agent here to ensure login doesn't 'hang' due to load
            const favData = await fetchWithDynamicRetry(() => fetchFavorites(username), elements.resultsContainer); 
            
            if (favData && Array.isArray(favData)) {
                updateSavedRecipes(favData.map(fav => fav.id));
            }
            
            // Restoring button original state only after all background data is loaded (favorites)
            elements.loginBtn.innerHTML = originalBtnText;
            elements.loginBtn.style.pointerEvents = 'auto';

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
            elements.loginBtn.innerHTML = originalBtnText;
            elements.loginBtn.style.pointerEvents = 'auto';
            alert("Login failed: " + data.error);
        }
    } catch (error) {
        elements.loginBtn.innerHTML = "Login"; // Fallback if variable out of scope
        elements.loginBtn.style.pointerEvents = 'auto';
        console.error("Error during login:", error);
        alert("Could not connect to the server.");
    }
});

// Execute Registration button
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
            document.body.classList.add('logged-in'); // Unlock ability to display cards
            

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

// View Favorites
elements.favoritesBtn.addEventListener('click', async () => {
    if (!isLoggedIn) return alert('Please log in to view your favorites!');
    
    elements.sidebar.classList.remove('open');
    elements.favoritesModal.classList.add('show');
    elements.favoritesGrid.innerHTML = "<div style='grid-column: 1 / -1; text-align: center; width: 100%;'><div class='spinner'></div><p style='color: black; margin-top: 15px;'>Cooking up your favorites... 👨‍🍳</p></div>";


    const data = await fetchWithDynamicRetry(() => fetchFavorites(currentUser), elements.favoritesGrid);

    if (!data) return; // Loading state or error was already printed in grid by agent
    elements.favoritesGrid.innerHTML = "";

    // Guard clauses: if we got an error object instead of array (agent failed), just exit
    if (!data || !Array.isArray(data)) return;

    if (data.length === 0) {
        elements.favoritesGrid.innerHTML = "<p style='color: white; text-align: center; width: 100%;'>You haven't saved any recipes yet! 🤍</p>";
        return;
    }

    // Utilizing our UI function. Specific functionality designed here for favorites:
    data.forEach(favRecipe => {
        elements.favoritesGrid.innerHTML += createRecipeCardHTML(favRecipe, true, 'favorite');
    });
});

// Search button
elements.searchButton.addEventListener('click', async () => {
    let selectedHealthLabels = []; // Reset health label filter on new search
    if (elements.searchInput.value.trim() !== "") {
        addSearchTag(elements.searchInput.value.trim());
        elements.searchInput.value = "";
        renderChips(searchTags); // Render missing UI chip! Avoids array memory state mismatch
    }
    
    if (searchTags.length === 0) {
        return alert('Please enter an ingredient to search for recipes.');
    }
    if (elements.vegan.checked) selectedHealthLabels.push(elements.vegan.value);
    if (elements.vegetarian.checked) selectedHealthLabels.push(elements.vegetarian.value);
    if (elements.glutenFree.checked) selectedHealthLabels.push(elements.glutenFree.value);
    if (elements.peanut.checked) selectedHealthLabels.push(elements.peanut.value);

    const ingredientsStr = searchTags.join(',').toLowerCase();
    elements.sidebar.classList.remove('open');
    elements.resultsContainer.innerHTML = "";
    elements.searchMessage.innerHTML = "<p>Loading recipes... ⏳</p>";
    elements.recommendationsWrapper.style.display = 'none'; // Clear recommendations from screen instantly upon search
    let cuisine = elements.cuisineSelect.value;

    // Activate our general utility agent! Pass it the task (search request) and target grid for messages
    const data = await fetchWithDynamicRetry(() => searchRecipes(ingredientsStr, cuisine,selectedHealthLabels), elements.searchMessage);

   // If agent returned null, it means it failed even after 3 attempts!
    // Then we just exit out, it already logged the error on screen.
    if (!data) return;

    // -- If reached here - correct response! Output standard --
    elements.searchMessage.innerHTML = "";
    const recipesList = data;
    if (!recipesList || recipesList.length === 0) {
          elements.searchMessage.innerHTML = "<p>No recipes found. Try different ingredients!</p>";
          return;
    }

    elements.recommendationsWrapper.style.display = 'none';

    recipesList.forEach(item => {
        const recipeData = item;
        // Cast both favorite IDs and recipe ID to strings to prevent strictly typed mismatch due to distinct API providers
        const isSaved = savedRecipeIds.some(savedId => String(savedId).trim() === String(recipeData.id).trim());
        elements.resultsContainer.innerHTML += createRecipeCardHTML(recipeData, isSaved, 'search');
    });
});

elements.themeToggle.addEventListener('change', () => {
    if (elements.themeToggle.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
    }
});

elements.snapBtn.addEventListener('click', () => {
    elements.cameraInput.click();
});

elements.cameraInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Creates user experience - notification that model is reading image
    elements.searchInput.value = "Analyzing... 🤖";

    try {
        const response = await identifyImageFromAPI(file);
        const data = await response.json();

        if (data.status === 'success') {
            elements.searchInput.value = ""; // Clear loading message
            addSearchTag(data.label); // Pop the beautiful orange search tag to screen!
            renderChips(searchTags); // Render new tag directly on screen
        } else {
            alert("AI Error: " + data.error);
            elements.searchInput.value = "";
        }
    } catch (err) {
        console.error("Error recognizing image:", err);
        alert("Failed to analyze image. Is the server running?");
        elements.searchInput.value = "";
    }

    // Clear previous file value so identical image can be uploaded twice physically
    elements.cameraInput.value = "";
});

// ==========================================
// Initialization functions - executed on site reload
// ==========================================

async function loadRecommendations() {
    if (!currentUser) return;
    
    // If no favorites, instantly hide block and halt execution
    if (savedRecipeIds.length === 0) {
        elements.recommendationsWrapper.style.display = 'none';
        return;
    }

    // Make wrapper visible pre-content ONLY if no active search is populating center block,
    // and render specific UI loader notification status indicators
    if (elements.resultsContainer.innerHTML.trim() === "") {
        elements.recommendationsWrapper.style.display = 'block';
    }

    elements.recommendationsGrid.innerHTML = "<p style='grid-column: 1 / -1; color: white; text-align: center; width: 100%;'>Fetching your personal top picks... ⏳</p>";

    // The agent steps in here too! Pass it the recommendations request, and the specific grid as message stage
    const data = await fetchWithDynamicRetry(
        () => fetchRecommendations(currentUser),
        elements.recommendationsGrid
    );

    if (!data) return; // Loading state or error was already printed in grid by agent
    
    // For 'new user without favorites' natural error, hide the block entirely per standard behavior
    if (data.error || data.length === 0) {
        elements.recommendationsWrapper.style.display = 'none';
        return;
    }

    elements.recommendationsGrid.innerHTML = "";
    data.forEach(recipeData => {
        const isSaved = savedRecipeIds.some(savedId => String(savedId).trim() === String(recipeData.id).trim()); 
        elements.recommendationsGrid.innerHTML += createRecipeCardHTML(recipeData, isSaved, 'recommendation');
    });
    console.log("Recommended recipes loaded securely.");
}


// Restore display mode (Dark/Light)
if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    elements.themeToggle.checked = true;
} else {
    elements.themeToggle.checked = false;
}

// Restore authenticated user from vault (localStorage) upon page load (if logged in)
const userFromStorage = localStorage.getItem('savedUser');
if (userFromStorage) {
    login(userFromStorage);
    document.body.classList.add('logged-in'); 

    elements.openLoginHomeBtn.style.display = "none";
    elements.userGreeting.innerText = `Hello ${currentUser} 👋`;
    elements.userGreeting.style.display = "block";
    elements.logoutBtn.style.display = "block";
    elements.favoritesBtn.style.display = "block";

    // Update our cached saved recipes array globally so UI hearts accurately render red
    fetchFavorites(currentUser)
        .then(res => res.json())
        .then(data => {
            if (data && Array.isArray(data)) {
                updateSavedRecipes(data.map(fav => fav.id));
            }
            // After favorites successful sync update, it is completely safe to call recommendations trigger
            loadRecommendations();
        })
        .catch(err => console.error("Could not fetch favorites on load", err));
}
