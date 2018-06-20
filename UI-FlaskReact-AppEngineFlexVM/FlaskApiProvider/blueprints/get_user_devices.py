
from flask import Blueprint
from flask import Response
from flask import request

from .utils.env_variables import *
from .utils.response import (success_response, error_response,
                             pre_serialize_device)
from .utils.auth import get_user_uuid_from_token

get_user_devices_bp = Blueprint('get_user_devices_bp',__name__)

@get_user_devices_bp.route('/api/get_user_devices/', methods=['GET', 'POST'])
def get_user_devices():
    print("Fetching all the user devices")

    received_form_response = json.loads(request.data.decode('utf-8'))
    user_token = received_form_response.get("user_token", None)
    if user_token is None:
        return error_response(
            message="Please make sure you have added values for all the fields"
        )

    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return error_response(
            message="Invalid User: Unauthorized"
        )

    query = datastore_client.query(kind='Devices')
    query.add_filter('user_uuid', '=', user_uuid)
    query_result = list(query.fetch())

    results = list(query_result)

    results_array = []
    if len(results) > 0:
        for result_row in results:
            device_json = pre_serialize_device(result_row)
            print('    {}, {}, {}'.format(
                device_json['device_uuid'],
                device_json['device_reg_no'],
                device_json['device_name']
            ))
            results_array.append(device_json)

        return success_response(
            results=results_array
        )
    else:
        return error_response(
            results=results_array
        )
