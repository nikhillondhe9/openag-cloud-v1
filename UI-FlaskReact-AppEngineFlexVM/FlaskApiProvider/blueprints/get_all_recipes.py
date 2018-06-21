from flask import Blueprint
from flask import request

from .utils.auth import get_user_uuid_from_token
from .utils.env_variables import *
from .utils.response import success_response, error_response

get_all_recipes_bp = Blueprint('get_all_recipes', __name__)


@get_all_recipes_bp.route('/api/get_all_recipes/', methods=['GET', 'POST'])
def get_all_recipes():

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

    #Get all user devices
    query = datastore_client.query(kind='Devices')
    query.add_filter('user_uuid', '=', user_uuid)
    query_result = list(query.fetch())
    results = list(query_result)
    devices_array = []
    if len(results) > 0:
        for result_row in results:
            device_id = result_row.get("device_uuid", "")
            device_reg_no = result_row.get("device_reg_no", "")
            device_name = result_row.get("device_name", "")
            print('  {}, {}, {}'.format(
                device_id, device_reg_no, device_name))
            result_json = {
                'device_uuid': device_id,
                'device_notes': result_row.get("device_notes", ""),
                'device_type': result_row.get("device_type", ""),
                'device_reg_no': device_reg_no,
                'registration_date': result_row.get("registration_date", "").strftime("%Y-%m-%d %H:%M:%S"),
                'user_uuid': result_row.get("user_uuid", ""),
                'device_name': device_name
            }
            devices_array.append(result_json)


    recipe_query = datastore_client.query(kind='Recipes')
    query_result = list(recipe_query.fetch())
    results = list(query_result)

    results_array = []
    for result in results:
        recipe_json = json.loads(result["recipe"])
        results_array.append( {
            'name':recipe_json['name'],
            'description':recipe_json['description']['brief'],
            'recipe_uuid':result["recipe_uuid"],
            "recipe_json":recipe_json
        })

    return success_response(
        results=results_array,
        devices=devices_array
    )
