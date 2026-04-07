// frontend/js/auth.js

/**
 * State Management Module.
 * This file maintains the application's runtime status, including user sessions,
 * saved recipe IDs, and active search tags. It does not perform API calls or direct DOM manipulation.
 */

// Exported state variables (Accessed by main.js and ui.js)
export let isLoggedIn = false;
export let currentUser = ""; 
export let savedRecipeIds = []; 
export let searchTags = [];

/**
 * Updates the state to 'logged in' and persists the user session.
 */
export function login(username) {
    isLoggedIn = true;
    currentUser = username;
    // Persist the user in localStorage for session restoration on page load
    localStorage.setItem('savedUser', username);
}

/**
 * Resets the application state on logout.
 */
export function logout() {
    isLoggedIn = false;
    currentUser = "";
    savedRecipeIds = [];
    localStorage.removeItem('savedUser');
}

/**
 * Updates the global list of favorite recipe IDs (synchronized from the server).
 */
export function updateSavedRecipes(idsArray) {
    savedRecipeIds = idsArray;
}

/**
 * Adds a recipe ID to the local favorites collection.
 */
export function addSavedRecipe(id) {
    if (!savedRecipeIds.includes(id)) {
        savedRecipeIds.push(id);
    }
}

/**
 * Removes a recipe ID from the local favorites collection.
 */
export function removeSavedRecipe(id) {
    savedRecipeIds = savedRecipeIds.filter(savedId => savedId !== id);
}

// ----------------------------------------------------
// Search Tag Management
// ----------------------------------------------------

/**
 * Adds a unique search tag to the collection.
 * @returns {boolean} - true if the tag was added, false if it already exists or is empty.
 */
export function addSearchTag(tag) {
    if (tag !== '' && !searchTags.includes(tag)) {
        searchTags.push(tag);
        return true; 
    }
    return false; 
}

export function removeSearchTag(index) {
    searchTags.splice(index, 1);
}

export function clearSearchTags() {
    searchTags = [];
}
