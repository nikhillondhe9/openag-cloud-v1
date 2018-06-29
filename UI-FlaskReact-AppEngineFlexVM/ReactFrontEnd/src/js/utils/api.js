function jsonRequest(endpoint, data, method = 'POST') {
    return fetch(process.env.REACT_APP_FLASK_URL + endpoint, {
        method: method,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(response => {
            if (response.response_code == 200) {
                return Promise.resolve(response);
            } else {
                return Promise.reject(response);
            }
        });
}

export function saveRecipe(user_token, recipe_uuid) {
    const data = { user_token, recipe_uuid };
    return jsonRequest('/api/save_for_later/', data);
}

export function unsaveRecipe(user_token, recipe_uuid) {
    const data = { user_token, recipe_uuid };
    return jsonRequest('/api/unsave_for_later/', data);
}

export function getCurrentRecipeInfo(user_token, device_uuid) {
    const data = { user_token, device_uuid };
    return jsonRequest('/api/get_current_recipe_info/', data);
}

export function getUserInfo(user_token) {
    const data = { user_token };
    return jsonRequest('/api/get_user_info/', data);
}
