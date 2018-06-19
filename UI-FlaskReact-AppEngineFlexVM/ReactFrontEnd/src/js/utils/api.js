function jsonRequest(endpoint, data, method = 'POST') {
    return fetch(process.env.REACT_APP_FLASK_URL + endpoint, {
        method: method,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json());
}

export function signup(username, password, email_address, organization) {
    const data = { username, password, email_address, organization };
    return jsonRequest('/api/signup/', data);
}

export function login(username, password) {
    const data = { username, password };
    return jsonRequest('/login/', data);
}

export function registerDevice(
    user_token, device_name, device_reg_no, device_notes, device_type
) {
    const data = {
        user_token,
        device_name,
        device_reg_no,
        device_notes,
        device_type
    };
    return jsonRequest('/api/register/', data);
}

// TODO: Modify this after making the twitter post more informative
// on the back end.
export function postToTwitter(user_token) {
    return userTokenRequest('/api/posttwitter/', user_token)
}

// TODO: Change this once the route gets actually implemented
export function submitAccessCode(user_token, access_code) {
    const data = { user_token, access_code };
    return jsonRequest('/api/submit_access_code/', data)
}

export function saveRecipe(user_token, recipe_json) {
    const data = { user_token, recipe_json };
    return jsonRequest('/api/save_recipe/', data);
}

export function submitRecipeChange(user_token, recipe_state) {
    const data = { user_token, recipe_state };
    return jsonRequest('/api/submit_recipe_change/', data);
}

export function applyRecipeToDevice(user_token, recipe_uuid, device_uuid) {
    const data = { user_token, recipe_uuid, device_uuid };
    return jsonRequest('/api/apply_to_device/', data);
}

// Recipe Specific Requests
function recipeInfoRequest(endpoint, user_token, recipe_uuid) {
    const data = { user_token, recipe_uuid };
    return jsonRequest(endpoint, data);
}

export function getRecipeComponents(user_token, recipe_uuid) {
    return recipeInfoRequest('/api/get_recipe_components/', user_token,
                             recipe_uuid);
}

export function getRecipeDetails(user_token, recipe_uuid) {
    return recipeInfoRequest('/api/get_recipe_details/', user_token,
                             recipe_uuid);
}

// Device Specific Requests
function deviceInfoRequest(endpoint, user_token, device_uuid) {
    const data = {
        user_token: user_token,
        selected_device_uuid: device_uuid
    };
    return jsonRequest(endpoint, data);
}

export function getCurrentStats(user_token, device_uuid) {
    return deviceInfoRequest('/api/get_current_stats/', user_token,
                             device_uuid);
}

export function getCO2Details(user_token, device_uuid) {
    return deviceInfoRequest('/api/get_co2_details/', user_token,
                             device_uuid);
}

export function getTempDetails(user_token, device_uuid) {
    return deviceInfoRequest('/api/get_temp_details/', user_token,
                             device_uuid);
}

export function getLEDPanel(user_token, device_uuid) {
    return deviceInfoRequest('/api/get_led_panel/', user_token,
                             device_uuid);
}

// TODO: Change this after making the route actually get the
// peripherals for a specific device
export function getDevicePeripherals(user_token, device_uuid) {
    return deviceInfoRequest('/api/get_device_peripherals/', user_token,
                             device_uuid)
}

// User Specific Requests
function userTokenRequest(endpoint, user_token) {
    const data = { user_token };
    return jsonRequest(endpoint, data);
}

export function getDeviceCode(user_token) {
    return userTokenRequest('/api/create_new_code/', user_token);
}

export function getUserDevices(user_token) {
    return userTokenRequest('/api/get_user_devices/', user_token);
}

export function getUserImage(user_token) {
    return userTokenRequest('/api/get_user_image/', user_token);
}

export function getAllRecipes(user_token) {
    return userTokenRequest('/api/get_all_recipes/', user_token);
}