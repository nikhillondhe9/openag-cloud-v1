import json
from flask import Blueprint, request
from datetime import datetime
import pytz
from .utils.env_variables import datastore_client
from .utils.response import success_response, error_response
from .utils.auth import get_user_uuid_from_token

get_device_recipe_history_bp = Blueprint('get_device_recipe_history_bp', __name__)

@get_device_recipe_history_bp.route('/api/get_device_recipe_history/',
                            methods=['POST'])
def get_current_recipe_info():
    data = request.get_json()
    user_token = data.get('user_token')
    device_uuid = data.get('device_uuid')
    recipe_uuid = data.get('recipe_uuid')

    if user_token is None or device_uuid is None or recipe_uuid is None:
        return error_response(
            message='Please make sure you have a valid uuid for device and recipe'
        )

    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return error_response(
            message='Invalid token. Unauthorized.'
        )

    query = datastore_client.query(kind='DeviceHistory',
                                   order=['-date_applied'])
    query.add_filter('device_uuid', '=', device_uuid)
    query.add_filter('recipe_uuid', '=', recipe_uuid)
    query_result = list(query.fetch(1))
    if len(query_result) == 0:
        return success_response(
            expired=True
        )

    current_recipe = query_result[0]
    current_recipe_session_token = current_recipe["recipe_session_token"]

    query = datastore_client.query(kind='DeviceHistory')
    query.add_filter('recipe_session_token', '=', current_recipe_session_token)
    query_result = list(query.fetch())
    if len(query_result) == 0:
        print("Query result")
        print(query_result)


