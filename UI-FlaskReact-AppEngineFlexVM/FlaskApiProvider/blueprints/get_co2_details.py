from flask import Blueprint
from flask import Response
from flask import request

from .utils.env_variables import *
from .utils.database import get_co2_history
from .utils.response import success_response, error_response

get_co2_details_bp = Blueprint('get_co2_details_bp',__name__)

#------------------------------------------------------------------------------
@get_co2_details_bp.route('/api/get_co2_details/', methods=['GET', 'POST'])
def get_co2_details():
    received_form_response = json.loads(request.data.decode('utf-8'))
    device_uuid = received_form_response.get("selected_device_uuid", None)

    if device_uuid is None:
        device_uuid = 'None'

    results = get_co2_history( device_uuid )

    return success_response(
        results=results
    )
