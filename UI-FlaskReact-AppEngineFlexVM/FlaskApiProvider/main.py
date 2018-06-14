from flask import Flask
from flask_cors import CORS

from blueprints import apply_to_device,create_access_code, download_as_csv, get_co2_details, \
    get_current_stats, get_led_panel, get_recipe_components, get_recipe_details, get_temp_details, get_user_devices, \
    post_to_twitter, \
    register_device, save_recipe, submit_recipe_change, verify_user_session, user_authenticate

app = Flask(__name__)
app.register_blueprint(apply_to_device.apply_to_device_bp)
app.register_blueprint(create_access_code.create_new_code_bp)
app.register_blueprint(download_as_csv.download_as_csv_bp)
app.register_blueprint(get_co2_details.get_co2_details_bp)
app.register_blueprint(get_current_stats.get_current_stats_bp)
app.register_blueprint(get_led_panel.get_led_panel_bp)
app.register_blueprint(get_recipe_components.get_recipe_components_bp)
app.register_blueprint(get_recipe_details.get_recipe_details_bp)
app.register_blueprint(get_temp_details.get_temp_details_bp)
app.register_blueprint(get_user_devices.get_user_devices_bp)
app.register_blueprint(post_to_twitter.posttwitter_bp)
app.register_blueprint(register_device.register_bp)
app.register_blueprint(save_recipe.save_recipe_bp)
app.register_blueprint(submit_recipe_change.submit_recipe_change_bp)
app.register_blueprint(user_authenticate.user_authenticate)
app.register_blueprint(verify_user_session.verify_user_session_bp)

# Remove this later - Only use it for testing purposes. Not safe to leave it here
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})
CORS(app)

# ------------------------------------------------------------------------------
if __name__ == '__main__':
    # This is used when running locally. Gunicorn is used to run the
    # application on Google App Engine. See entrypoint in app.yaml.
    app.run(host='127.0.0.1', port=5000, debug=True)
