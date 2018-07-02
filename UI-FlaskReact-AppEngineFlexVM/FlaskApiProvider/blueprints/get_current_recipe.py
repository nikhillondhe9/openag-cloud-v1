from flask import Blueprint
from flask import request
import ast
from .utils.auth import get_user_uuid_from_token
from .utils.env_variables import *
from .utils.response import success_response, error_response

get_current_recipe_bp = Blueprint('get_current_recipe', __name__)


@get_current_recipe_bp.route('/api/get_current_recipe/', methods=['GET', 'POST'])
def get_current_recipe():

    received_form_response = json.loads(request.data.decode('utf-8'))
    device_uuid = received_form_response.get("selected_device_uuid", None)

    query = datastore_client.query(kind='DeviceHistory',
                                   order=['-date_applied'])
    query.add_filter('device_uuid', '=', device_uuid)
    query_result = list(query.fetch(1))
    if not query_result:
        return error_response(
            message='No recipe running on your device.'
        )

    recipe_state = {}
    if len(query_result) > 0:
        recipe_state = ast.literal_eval(query_result[0]['recipe_state'])

    return success_response(
        results=recipe_state
    )