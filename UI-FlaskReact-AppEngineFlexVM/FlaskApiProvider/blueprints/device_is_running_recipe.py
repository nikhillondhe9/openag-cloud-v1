from flask import Blueprint, request
from datetime import datetime, timezone

from .utils.env_variables import datastore_client
from .utils.response import success_response, error_response
from .utils.auth import get_user_uuid_from_token

device_is_running_bp = Blueprint('device_is_running_bp', __name__)

@device_is_running_bp.route('/api/device_is_running_recipe/',
                            methods=['POST'])
def is_running():
    data = request.get_json()
    user_token = data.get('user_token')
    device_uuid = data.get('device_uuid')

    if user_token is None or device_uuid is None:
        return error_response(
            message='Please make sure you have filled out all the fields.'
        )

    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return error_response(
            message='Invalid token. Unauthorized.'
        )

    query = datastore_client.query(kind='DeviceHistory',
                                   order=['-date_applied'])
    query.add_filter('device_uuid', '=', device_uuid)
    query_result = list(query.fetch(1))
    if not query_result:
        return success_response(
            result=False
        )

    last_recipe = query_result[0]
    if last_recipe['date_expires'] < datetime.now(timezone.utc):
        return success_response(
            result=False
        )
    return success_response(
        result=True
    )
