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

export function starRecipe(user_token, recipe_uuid) {
    const data = { user_token, recipe_uuid };
    return jsonRequest('/api/star_recipe/', data);
}

export function unstarRecipe(user_token, recipe_uuid) {
    const data = { user_token, recipe_uuid };
    return jsonRequest('/api/unstar_recipe/', data);
}
