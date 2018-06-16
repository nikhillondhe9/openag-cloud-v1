import ast

from flask import Blueprint
from flask import Response
from flask import request

from .utils.env_variables import *

get_recipe_details_bp = Blueprint('get_recipe_details_bp',__name__)

@get_recipe_details_bp.route('/api/get_recipe_details/', methods=['GET', 'POST'])
def get_recipe_details():
    received_form_response = json.loads(request.data.decode('utf-8'))
    recipe_uuid = received_form_response.get("recipe_uuid", None)
    user_token = received_form_response.get("user_token", None)
    if recipe_uuid is None or user_token is None:
        return Response({"message": "Error occured"}, status=500, mimetype='application/json')

    query = datastore_client.query(kind='Recipes')
    query.add_filter('recipe_uuid', '=', recipe_uuid)

    # Get uuid's of all devices attached with this user
    all_user_devices = []
    device_query = datastore_client.query(kind='Devices')
    query_session = datastore_client.query(kind="UserSession")
    query_session.add_filter('session_token', '=', user_token)
    query_session_result = list(query_session.fetch())
    user_uuid = None
    if len(query_session_result) > 0:
        user_uuid = query_session_result[0].get("user_uuid", None)

    device_query.add_filter('user_uuid', '=', user_uuid)
    devices_query_result = list(device_query.fetch())
    for result_row in list(devices_query_result):
        device_id = result_row.get("device_uuid", "")
        all_user_devices.append(device_id)

    # Recipe History - Somehow filter this in the context of the devices the user has registered with them
    recipe_history = {}
    recipe_history_query = datastore_client.query(kind="RecipeHistory")
    recipe_history_query.add_filter('recipe_uuid', '=', recipe_uuid)
    recipe_history_query.order = ['-updated_at']
    recipe_history_query_result = list(recipe_history_query.fetch())
    total_number_of_history_records = len(recipe_history_query_result)
    if total_number_of_history_records > 1:
        oldest_record = recipe_history_query_result[total_number_of_history_records - 1]
        for device in all_user_devices:
            recipe_history[device] = []

        for i in range(0, total_number_of_history_records - 1):
            print(oldest_record)
            history_result = recipe_history_query_result[i]
            if history_result["device_uuid"] in all_user_devices:
                device_uuid = history_result["device_uuid"]
                changes_in_record = (get_key_differences(ast.literal_eval(oldest_record["recipe_state"]),
                                                         ast.literal_eval(history_result["recipe_state"])))
                print(changes_in_record)
                recipe_history[device_uuid].append({
                    "updated_at": history_result.get("updated_at", "").strftime("%Y-%m-%d %H:%M:%S"),
                    "device_name": get_device_name(device_uuid),
                    "changes_in_record": changes_in_record
                })

    query_result = list(query.fetch())
    results = list(query_result)
    results_array = []
    if len(results) > 0:
        for result_row in results:
            components_array = []
            components = result_row.get("components", [])
            for component_id in components:
                component_query = datastore_client.query(kind='Components')
                component_query.add_filter('component_id', '=', int(component_id))
                query_result = list(component_query.fetch())
                component_results = list(query_result)

                if len(component_results) > 0:
                    for component_result_row in component_results:
                        result_json = {
                            'component_key': component_result_row.get("component_key", ""),
                            'component_id': component_result_row.get("component_id", ""),
                            'component_description': component_result_row.get("component_description", ""),
                            'component_label': component_result_row.get("component_label", ""),
                            'component_type': component_result_row.get("component_type", ""),
                            'field_json': json.loads(component_result_row.get("field_json", {})),
                            'modified_at': component_result_row.get("modified_at", "").strftime("%Y-%m-%d %H:%M:%S")
                        }
                        components_array.append(result_json)

            result_json = {
                'recipe_name': result_row.get("recipe_name", ""),
                'recipe_plant': result_row.get("recipe_plant", ""),
                'recipe_json': result_row.get("recipe_json", {}),
                'modified_at': result_row.get("modified_at", "").strftime("%Y-%m-%d %H:%M:%S"),
                'recipe_uuid': result_row.get("recipe_uuid", ""),
                "components": components_array
            }
            results_array.append(result_json)

        data = json.dumps({
            "response_code": 200,
            "results": results_array,
            "history": recipe_history

        })
        result = Response(data, status=200, mimetype='application/json')
        return result