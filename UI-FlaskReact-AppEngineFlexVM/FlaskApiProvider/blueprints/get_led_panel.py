from flask import Response
from flask import request
from flask import Blueprint
from .utils.env_variables import *
from .utils.response import success_response, error_response
from .utils.database import get_led_panel_history

get_led_panel_bp = Blueprint('get_led_panel_bp',__name__)

# ------------------------------------------------------------------------------
# This is old code, not used.
@get_led_panel_bp.route('/api/get_led_panel/', methods=['GET', 'POST'])
def get_led_panel():
    received_form_response = json.loads(request.data.decode('utf-8'))
    device_uuid = received_form_response.get("selected_device_uuid", None)

    if device_uuid is None:
        device_uuid = 'None'

    led_data = get_led_panel_history( device_uuid )
    result_json = []
    for led_json in led_data:
        result_json.append({'cool_white': led_json.get("380-399",0),
                            'warm_white': led_json.get("400-499",0),
                            'blue': led_json.get("500-599",0),
                            'green': led_json.get("600-700",0),
                            'red': led_json.get("701-780",0),
                            'far_red': led_json.get("650-699",0)})

    return success_response(
        results=result_json
    )
