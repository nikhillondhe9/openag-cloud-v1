import uuid

from flask import Blueprint
from flask import Response
from flask import request
from google.cloud import datastore

from .utils.env_variables import *
from .utils.response import success_response, error_response
from .utils.auth import get_user_uuid_from_token

submit_recipe_change_bp = Blueprint('submit_recipe_change_bp',__name__)

# ------------------------------------------------------------------------------
# Handle Change to a recipe running on a device
@submit_recipe_change_bp.route('/api/submit_recipe_change/', methods=['GET', 'POST'])
def submit_recipe_change():
    received_form_response = json.loads(request.data.decode('utf-8'))
    recipe_state = received_form_response.get("recipe_state", {})
    user_token = received_form_response.get("user_token", "")

    recipe_session_token = received_form_response.get("recipe_session_token", "")
    key = datastore_client.key('RecipeHistory')
    device_reg_task = datastore.Entity(key, exclude_from_indexes=[])

    # Get user uuid associated with this sesssion token
    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return error_response(
            message="Invalid User: Unauthorized"
        )

    # Build a custom recipe dict from the dashboard values
    recipe_dict = {}
    recipe_state = json.loads(recipe_state)
    device_uuid = recipe_state.get("selected_device_uuid", "")
    recipe_dict['temp_humidity_sht25'] = str(recipe_state['sensor_temp'])
    recipe_dict['co2_t6713'] = str(recipe_state['sensor_co2'])
    led_on = recipe_state['led_on_data']
    recipe_dict['LED_panel_on_far_red'] = str(led_on['far_red'])
    recipe_dict['LED_panel_on_red'] = str(led_on['red'])
    recipe_dict['LED_panel_on_warm_white'] = str(led_on['warm_white'])
    recipe_dict['LED_panel_on_green'] = str(led_on['green'])
    recipe_dict['LED_panel_on_cool_white'] = str(led_on['cool_white'])
    recipe_dict['LED_panel_on_blue'] = str(led_on['blue'])
    led_off = recipe_state['led_off_data']
    recipe_dict['LED_panel_off_far_red'] = str(led_off['far_red'])
    recipe_dict['LED_panel_off_red'] = str(led_off['red'])
    recipe_dict['LED_panel_off_warm_white'] = str(led_off['warm_white'])
    recipe_dict['LED_panel_off_green'] = str(led_off['green'])
    recipe_dict['LED_panel_off_cool_white'] = str(led_off['cool_white'])
    recipe_dict['LED_panel_off_blue'] = str(led_off['blue'])

    current_recipe_uuid = ""
    recipe_session_token = ""
    # Get the recipe the device is currently running based on entry in the DeviceHisotry

    query_device_history = datastore_client.query(kind="DeviceHistory")
    query_device_history.add_filter('device_uuid', '=', device_uuid)
    query_device_history.order = ["-date_applied"]
    query_device_history_result = list(query_device_history.fetch())

    if len(query_device_history_result) >= 1:
        current_recipe_uuid = query_device_history_result[0]['recipe_uuid']
        recipe_session_token = query_device_history_result[0]['recipe_session_token']

    # make sure we have a valid recipe uuid
    if None == current_recipe_uuid or 0 == len(current_recipe_uuid):
        current_recipe_uuid = str(uuid.uuid4())

    device_reg_task.update({
        "device_uuid": device_uuid,
        "recipe_uuid": current_recipe_uuid,
        "user_uuid": user_uuid,
        "recipe_session_token": recipe_session_token,
        "recipe_state": str(recipe_dict),
        "updated_at": datetime.now()
    })

    datastore_client.put(device_reg_task)

    # convert the values in the dict into what the Jbrain expects
    commands_list = convert_UI_recipe_to_commands(current_recipe_uuid,
                                                  recipe_dict)
    send_recipe_to_device_via_IoT(iot_client, device_uuid, commands_list)

    return success_response(
        message="Successfully applied"
    )
