import uuid

from flask import Blueprint
from flask import Response
from flask import request
from google.cloud import datastore
import ast
from .utils.env_variables import *
from .utils.response import success_response, error_response
from .utils.auth import get_user_uuid_from_token
from datetime import timedelta,datetime
submit_recipe_change_bp = Blueprint('submit_recipe_change_bp',__name__)

def get_existing_recipes(recipe_key):
    print(recipe_key)
    if recipe_key == "flat":
        spectrum_json = {"400-449": 16.67, "450-499": 16.67, "500-549": 16.67, "550-559": 16.67, "600-649": 16.17, "650-699": 16.67}
    elif recipe_key == "low_end":
        spectrum_json = {"400-449": 50.0, "450-499": 50.0, "500-549": 0.0, "550-559": 0.0, "600-649": 0.0, "650-699": 0.0}
    elif recipe_key == "off":
        spectrum_json = {"400-449": 0.0, "450-499": 0.0, "500-549": 0.0, "550-559": 0.0, "600-649": 0.0,
                         "650-699": 0.0}
    elif recipe_key == "mid_end":
        spectrum_json =  {"400-449": 0, "450-499": 0, "500-549": 50.0, "550-559": 50.0, "600-649": 0, "650-699": 0}
    else:
        spectrum_json = {"400-449": 0.0, "450-499": 0.0, "500-549": 0.0, "550-559": 0.0, "600-649": 50.0,
                         "650-699": 50.0}

    return ast.literal_eval(json.dumps(spectrum_json))


# ------------------------------------------------------------------------------
# Handle Change to a recipe running on a device
@submit_recipe_change_bp.route('/api/submit_recipe_change/', methods=['GET', 'POST'])
def submit_recipe_change():
    received_form_response = json.loads(request.data.decode('utf-8'))
    recipe_state = received_form_response.get("recipe_state", {})
    user_token = received_form_response.get("user_token", "")
    device_uuid = received_form_response.get("device_uuid", "")

#debugrob, this is copied from submit_recipe.py, put in common class!
    # Get user uuid associated with this sesssion token
    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return error_response(
            message="Invalid User: Unauthorized"
        )
    user_details_query = datastore_client.query(kind='Users')
    user_details_query.add_filter("user_uuid", "=", user_uuid)
    user_results = list(user_details_query.fetch())
    user_name = ""
    email_address = ""
    if len(user_results) > 0:
        user_name = user_results[0]["username"]
        email_address = user_results[0]["email_address"]

    query = datastore_client.query(kind='RecipeFormat')

    # device_type_caret is NOT in the state!
    #query.add_filter("device_type", '=', recipe_state.get("device_type_caret", ""))
    query.add_filter("device_type", '=', "PFC_EDU")
    query_result = list(query.fetch())
    recipe_format = {}
    if len(query_result) > 0:
        recipe_format = json.loads(query_result[0]["recipe_json"])

    recipe_format["format"] = query_result[0]["format_name"]
    recipe_format["version"] = " ".join(str(x) for x in [2])
    recipe_format["authors"] = [
        {
            "name": str(user_name),
            "uuid": str(user_uuid),
            "email": str(email_address)
        }
    ]
    recipe_format["parent_recipe_uuid"] = str(uuid.uuid4())
    recipe_format["support_recipe_uuids"] = None

    recipe_format["creation_timestamp_utc"] = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S:%f')[:-4] + 'Z'

    rdict = json.loads( recipe_state )
    recipe_format["name"] = rdict.get("recipe_name", "")
    recipe_format["description"]['verbose'] = rdict.get("recipe_description", "")
    recipe_format["description"]['brief'] = rdict.get("recipe_description", "")[:75] if len(
        rdict.get("recipe_description", "")) > 75 else rdict.get("recipe_description", "")
    recipe_format["cultivars"] = [{
        "name": rdict.get("plant_type_caret", "") + "/" + rdict.get("variant_type_caret", ""),
        "uuid": str(uuid.uuid4())
    }]
    recipe_format["cultivation_methods"] = [{
        "name": "Shallow Water Culture",
        "uuid": str(uuid.uuid4())
    }]
    led_panel_dac5578 = rdict.get("led_panel_dac5578", {})
    standard_day_led_spectrum = get_existing_recipes(recipe_key=led_panel_dac5578.get("on_selected_spectrum", ""))
    standard_night_led_spectrum = get_existing_recipes(recipe_key=led_panel_dac5578.get("off_selected_spectrum", ""))
    off_illumination_distance = led_panel_dac5578.get("off_illumination_distance", 5)
    on_illumination_distance = led_panel_dac5578.get("on_illumination_distance", 5)

    recipe_format["environments"]["standard_day"] = {
        "name": "Standard Day",
        "spectrum_key": led_panel_dac5578.get("on_selected_spectrum", ""),
        "light_spectrum_nm_percent":standard_day_led_spectrum,
        "light_intensity_watts": 100,
        "light_illumination_distance_cm": on_illumination_distance,
        "air_temperature_celcius": 22
    }
    recipe_format["environments"]["standard_night"] = {
        "name": "Standard Night",
        "spectrum_key": led_panel_dac5578.get("off_selected_spectrum", ""),
        "light_spectrum_nm_percent": standard_night_led_spectrum,
        "light_intensity_watts": 100,
        "light_illumination_distance_cm": off_illumination_distance,
        "air_temperature_celcius": 22
    }
    recipe_format["environments"]["cold_day"] = {
        "name": "Cold Day",
        "spectrum_key": led_panel_dac5578.get("on_selected_spectrum", ""),
        "light_spectrum_nm_percent": standard_day_led_spectrum,
        "light_intensity_watts": 100,
        "light_illumination_distance_cm": on_illumination_distance,
        "air_temperature_celcius": 10
    }
    recipe_format["environments"]["frost_night"] = {
        "name": "Frost Night",
        "spectrum_key": led_panel_dac5578.get("off_selected_spectrum", ""),
        "light_spectrum_nm_percent": standard_night_led_spectrum,
        "light_intensity_watts": 100,
        "light_illumination_distance_cm": off_illumination_distance,
        "air_temperature_celcius": 2
    }
    recipe_format["phases"][0] = {
        "name": "Standard Growth",
        "repeat": 29,
        "cycles": [
            {
                "name": "Day",
                "environment": "standard_day",
                "duration_hours": int(rdict.get("standard_day", 1))
            },
            {
                "name": "Night",
                "environment": "standard_night",
                "duration_hours": int(rdict.get("standard_night", 1))
            }
        ]
    }
    recipe_format["phases"][1] = {
        "name": "Frosty Growth",
        "repeat": 1,
        "cycles": [
            {
                "name": "Day",
                "environment": "cold_day",
                "duration_hours": 18
            },
            {
                "name": "Night",
                "environment": "frost_night",
                "duration_hours": 6
            }
        ]

    }

    current_recipe_uuid = ""
    # Get the recipe the device is currently running based on entry in the
    # DeviceHisotry

    query_device_history = datastore_client.query(kind="DeviceHistory")
    query_device_history.add_filter('device_uuid', '=', device_uuid)
    query_device_history.order = ["-date_applied"]
    query_device_history_result = list(query_device_history.fetch())

    if len(query_device_history_result) >= 1:
        current_recipe_uuid = query_device_history_result[0]['recipe_uuid']

    # make sure we have a valid recipe uuid
    if None == current_recipe_uuid or 0 == len(current_recipe_uuid):
        current_recipe_uuid = str(uuid.uuid4())

    recipe_format["uuid"] = current_recipe_uuid

    # Add the user to the users kind of entity
    key = datastore_client.key('DeviceHistory')

    # Indexes every other column except the description
    device_history_reg_task = datastore.Entity(key, exclude_from_indexes=['recipe_state'])

    date_applied = datetime.now()
    device_history_reg_task.update({
        "device_uuid": device_uuid,
        'date_applied': date_applied,
        'date_expires': date_applied + timedelta(days=3000),
        "recipe_uuid": current_recipe_uuid,
        "user_uuid": user_uuid,
        "recipe_state": str(recipe_format),
        "updated_at": datetime.now()
    })

    datastore_client.put(device_history_reg_task)

    # convert the values in the dict into what the Jbrain expects
    commands_list = convert_UI_recipe_to_commands(current_recipe_uuid,
                                                  recipe_format)
    send_recipe_to_device_via_IoT(iot_client, device_uuid, commands_list)

    return success_response(
        message="Successfully applied"
    )
