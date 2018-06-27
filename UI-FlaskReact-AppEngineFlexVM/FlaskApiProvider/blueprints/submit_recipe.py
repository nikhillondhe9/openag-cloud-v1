from flask import Blueprint
from flask import request
from google.cloud import datastore
import ast
from .utils.auth import get_user_uuid_from_token
from .utils.env_variables import *
from .utils.response import success_response, error_response
import uuid
from datetime import datetime,timedelta
submit_recipe_bp = Blueprint('submit_recipe', __name__)


# ------------------------------------------------------------------------------
# Handle Change to a recipe running on a device
@submit_recipe_bp.route('/api/submit_recipe/', methods=['GET', 'POST'])
def submit_recipe():
    received_form_response = json.loads(request.data.decode('utf-8'))
    recipe_state = received_form_response.get("state", {})
    user_token = received_form_response.get("user_token", "")
    device_uuid = received_form_response.get("device_uuid","")
    image_url = received_form_response.get("image_url","")


    user_details_query = datastore_client.query(kind='Users')

    key = datastore_client.key('Recipes')
    recipe_reg_task = datastore.Entity(key, exclude_from_indexes=["recipe"])

    # Get user uuid associated with this sesssion token
    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return error_response(
            message="Invalid User: Unauthorized"
        )
    user_details_query.add_filter("user_uuid", "=", user_uuid)
    user_results = list(user_details_query.fetch())
    user_name = ""
    email_address = ""
    if len(user_results) > 0:
        user_name = user_results[0]["username"]
        email_address = user_results[0]["email_address"]


    query = datastore_client.query(kind='RecipeFormat')
    query.add_filter("device_type", '=', recipe_state.get("device_type_caret", ""))
    query_result = list(query.fetch())
    recipe_format = {}
    if len(query_result) > 0:
        recipe_format = json.loads(query_result[0]["recipe_json"])


    recipe_format["format"] = query_result[0]["format_name"]
    recipe_format["version"] =" ".join(str(x) for x in [2])
    recipe_format["authors"] = [
        {
            "name":str(user_name),
            "uuid":str(user_uuid),
            "email":str(email_address)
        }
    ]
    recipe_format["parent_recipe_uuid"]= str(uuid.uuid4())
    recipe_format["support_recipe_uuids"] = None

    recipe_format["creation_timestamp_utc"] = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S:%f')[:-4] + 'Z'
    recipe_format["name"] = recipe_state.get("recipe_name", "")
    recipe_format["description"]['verbose'] = recipe_state.get("recipe_description", "")
    recipe_format["description"]['brief'] = recipe_state.get("recipe_description", "")[:75] if len(
        recipe_state.get("recipe_description", "")) > 75 else recipe_state.get("recipe_description", "")
    recipe_format["cultivars"] = [{
        "name": recipe_state.get("plant_type_caret", "") + "/" + recipe_state.get("variant_type_caret", ""),
        "uuid": str(uuid.uuid4())
    }]
    recipe_format["cultivation_methods"] = [{
        "name": "Shallow Water Culture",
        "uuid": str(uuid.uuid4())
    }]

    recipe_format["environments"]["standard_day"] = {
        "name": "Standard Day",
        "light_spectrum_nm_percent": {"400-449": float(recipe_state.get("led_panel_dac5578_on_red", 16.67)) ,
                                      "449-499": float(recipe_state.get("led_panel_dac5578_on_blue", 16.67)) ,
                                      "500-549": float(recipe_state.get("led_panel_dac5578_on_green", 16.67)) ,
                                      "550-599": float(recipe_state.get("led_panel_dac5578_on_far_red", 16.67)) ,
                                      "600-649": float(recipe_state.get("led_panel_dac5578_on_warm_white", 16.67)) ,
                                      "650-699": float(recipe_state.get("led_panel_dac5578_on_cool_white", 16.67)) },
        "light_intensity_watts": 100,
        "light_illumination_distance_cm": 10,
        "air_temperature_celcius": 22
    }
    recipe_format["environments"]["standard_night"] = {
        "name": "Standard Night",
        "light_spectrum_nm_percent": {"400-449": float(recipe_state.get("led_panel_dac5578_off_red", 16.67)) ,
                                      "449-499": float(recipe_state.get("led_panel_dac5578_off_blue", 16.67)) ,
                                      "500-549": float(recipe_state.get("led_panel_dac5578_off_green", 16.67)) ,
                                      "550-599": float(recipe_state.get("led_panel_dac5578_off_far_red", 16.67)) ,
                                      "600-649": float(recipe_state.get("led_panel_dac5578_off_warm_white", 16.67)) ,
                                      "650-699": float(recipe_state.get("led_panel_dac5578_off_cool_white", 16.67)) },
        "light_intensity_watts": 100,
        "light_illumination_distance_cm": 10,
        "air_temperature_celcius": 22
    }
    recipe_format["environments"]["cold_day"] = {
        "name": "Cold Day",
        "light_spectrum_nm_percent": {"400-449": float(recipe_state.get("led_panel_dac5578_on_red", 16.67)) ,
                                      "449-499": float(recipe_state.get("led_panel_dac5578_on_blue", 16.67)) ,
                                      "500-549": float(recipe_state.get("led_panel_dac5578_on_green", 16.67)) ,
                                      "550-599": float(recipe_state.get("led_panel_dac5578_on_far_red", 16.67)) ,
                                      "600-649": float(recipe_state.get("led_panel_dac5578_on_warm_white", 16.67)) ,
                                      "650-699": float(recipe_state.get("led_panel_dac5578_on_cool_white", 16.67)) },
        "light_intensity_watts": 100,
        "light_illumination_distance_cm": 10,
        "air_temperature_celcius": 10
    }
    recipe_format["environments"]["frost_night"] = {
        "name": "Frost Night",
        "light_spectrum_nm_percent": {"400-449": float(recipe_state.get("led_panel_dac5578_off_red", 16.67)) ,
                                      "449-499": float(recipe_state.get("led_panel_dac5578_off_blue", 16.67)) ,
                                      "500-549": float(recipe_state.get("led_panel_dac5578_off_green", 16.67)) ,
                                      "550-599": float(recipe_state.get("led_panel_dac5578_off_far_red", 16.67)) ,
                                      "600-649": float(recipe_state.get("led_panel_dac5578_off_warm_white", 16.67)) ,
                                      "650-699": float(recipe_state.get("led_panel_dac5578_off_cool_white", 16.67)) },
        "light_intensity_watts": 100,
        "light_illumination_distance_cm": 10,
        "air_temperature_celcius": 2
    }
    recipe_format["phases"][0] =   {
                "name": "Standard Growth",
                "repeat": 29,
                "cycles": [
                    {
                        "name": "Day",
                        "environment": "standard_day",
                        "duration_hours":  int(recipe_state.get("standard_day",1))
                    },
                    {
                        "name": "Night",
                        "environment": "standard_night",
                        "duration_hours": int(recipe_state.get("standard_night",1))
                    }
                ]
            }
    recipe_format["phases"][1]={
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

    current_recipe_uuid = str(uuid.uuid4())
    recipe_format["uuid"] = current_recipe_uuid
    recipe_reg_task.update({
        "recipe_uuid":current_recipe_uuid,
        "user_uuid": user_uuid,
        "recipe": json.dumps(recipe_format),
        "date_created": datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S:%f')[:-4] + 'Z',
        "device_type": recipe_state.get("device_type_caret", ""),
        "format":query_result[0]["format_name"],
        "image_url":image_url
    })

    datastore_client.put(recipe_reg_task)

    # Add the user to the users kind of entity
    key = datastore_client.key('DeviceHistory')

    # Indexes every other column except the description
    apply_to_device_task = datastore.Entity(key, exclude_from_indexes=[])

    if device_uuid is None or current_recipe_uuid is None or user_token is None:
        return error_response(
            message="Please make sure you have added values for all the fields"
        )

    date_applied = datetime.now()
    recipe_session_token = str(uuid.uuid4())
    apply_to_device_task.update({
        'recipe_session_token': recipe_session_token,
        # Used to track the recipe applied to the device and modifications made to it.
        'device_uuid': device_uuid,
        'recipe_uuid': current_recipe_uuid,
        'date_applied': date_applied,
        'date_expires': date_applied + timedelta(days=3000),
        'user_uuid': user_uuid
    })

    # Add a new recipe history record to indicate an event for when you applied this recipe to this device
    key = datastore_client.key('RecipeHistory')
    device_reg_task = datastore.Entity(key, exclude_from_indexes=["recipe_state"])
    device_reg_task.update({
        "device_uuid": device_uuid,
        "recipe_uuid": current_recipe_uuid,
        "user_uuid": user_uuid,
        "recipe_session_token": str(uuid.uuid4()),
        "recipe_state": str(recipe_format),
        "updated_at": datetime.now()
    })

    datastore_client.put(device_reg_task)

    datastore_client.put(apply_to_device_task)

    # convert the values in the dict into what the Jbrain expects
    commands_list = convert_UI_recipe_to_commands(current_recipe_uuid,recipe_format)
    send_recipe_to_device_via_IoT(iot_client, device_uuid, commands_list)

    return success_response(
        message="Successfully applied"
    )
