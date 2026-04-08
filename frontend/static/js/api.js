// frontend/js/api.js

/**
 * This file is strictly responsible for executing server requests (Backend).
 * We built organized functions so we don't have to rewrite fetch every time.
 */

import { BASE_URL } from './config.js';

/**
 * Internal function for executing server requests to prevent code repetition ('DRY')
 * @param {string} endpoint - The server path (e.g., '/login')
 * @param {string} method - Request method (GET, POST etc.)
 * @param {object} bodyData - Data to send in POST requests (optional)
 * @returns {Promise<Response>} - Returns the server's response
 */
async function apiCall(endpoint, method = 'GET', bodyData = null) {
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    // Add data if there is info to send (like in Login/Register/Save)
    if (bodyData) {
        options.body = JSON.stringify(bodyData);
    }
    
    // Return the raw Response object, so main.js can check if(response.ok)
    return await fetch(`${BASE_URL}${endpoint}`, options);
}

// ----------------------------------------------------
// Export all functions exposed to other files
// ----------------------------------------------------

export async function loginUser(username, password) {
    return await apiCall('/login', 'POST', { username, password });
}

export async function registerUser(username, password) {
    return await apiCall('/register', 'POST', { username, password });
}

export async function logoutUser(username) {
    return await apiCall('/logout', 'POST', { username });
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
    // Unique fetch here since we cannot send JSON, only physical FormData for files
    const response = await fetch('/api/vision', {
        method: 'POST',
        body: formData
    });
    return response;
}
