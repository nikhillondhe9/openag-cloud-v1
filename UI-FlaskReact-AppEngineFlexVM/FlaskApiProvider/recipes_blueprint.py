import json
import os
import ast
import base64
import json
import os
import time
import uuid
import sys, traceback
from datetime import datetime, timedelta

from flask import Blueprint
from flask import Response
from flask import request
from google.cloud import datastore

# Environment variables, set locally for testing and when deployed to gcloud.
path_to_google_service_account = os.environ['GOOGLE_APPLICATION_CREDENTIALS']
cloud_project_id = os.environ['GCLOUD_PROJECT']
cloud_region = os.environ['GCLOUD_REGION']
device_registry = os.environ['GCLOUD_DEV_REG']



# Datastore client for Google Cloud
datastore_client = datastore.Client(cloud_project_id)

consumer_key = os.environ['consumer_key']
consumer_secret = os.environ['consumer_secret']
access_token = os.environ['access_token']
access_secret = os.environ['access_secret']


recipes_blueprint = Blueprint('recipes_blueprint',__name__)
@recipes_blueprint.route('/api/get_all_recipes/', methods=['GET', 'POST'])
def get_all_recipes():
    print("Fetching all the recipes")

    received_form_response = json.loads(request.data.decode('utf-8'))
    user_token = received_form_response.get("user_token", None)
    query_session = datastore_client.query(kind="UserSession")
    query_session.add_filter('session_token', '=', user_token)
    query_session_result = list(query_session.fetch())
    user_uuid = None
    if len(query_session_result) > 0:
        user_uuid = query_session_result[0].get("user_uuid", None)

    # Get the user devices and pass that information to the front end too
    query = datastore_client.query(kind='Devices')
    query.add_filter('user_uuid', '=', user_uuid)
    query_result = list(query.fetch())
    devices_results = list(query_result)

    devices = []
    if len(devices_results) > 0:
        for result_row in devices_results:
            device_json = {
                'device_uuid': result_row.get("device_uuid", ""),
                'device_notes': result_row.get("device_notes", ""),
                'device_type': result_row.get("device_type", ""),
                'device_reg_no': result_row.get("device_reg_no", ""),
                'registration_date': result_row.get("registration_date", "").strftime("%Y-%m-%d %H:%M:%S"),
                'user_uuid': result_row.get("user_uuid", ""),
                'device_name': result_row.get("device_name", "")
            }
            devices.append(device_json)

    # Get all recipes
    query = datastore_client.query(kind='Recipes')
    query_result = list(query.fetch())
    results = list(query_result)
    results_array = []
    if len(results) > 0:
        for result_row in results:
            result_json = {
                'recipe_name': result_row.get("recipe_name", ""),
                'recipe_plant': result_row.get("recipe_plant", ""),
                'recipe_json': result_row.get("recipe_json", {}),
                'modified_at': result_row.get("modified_at", "").strftime("%Y-%m-%d %H:%M:%S"),
                'recipe_uuid': result_row.get("recipe_uuid", "")
            }
            results_array.append(result_json)

        data = json.dumps({
            "response_code": 200,
            "results": results_array,
            "devices": devices
        })
        result = Response(data, status=200, mimetype='application/json')
        return result
    else:
        data = json.dumps({
            "response_code": 500,
            "results": results_array,
            "devices": devices
        })
        result = Response(data, status=500, mimetype='application/json')
        return result

@recipes_blueprint.route('/api/save_recipe/', methods=['GET', 'POST'])
def save_recipe():
    received_form_response = json.loads(request.data.decode('utf-8'))
    recipe_json = json.loads(received_form_response.get("recipe_json", None))
    recipe_name = recipe_json.get("recipe_name", None)
    recipe_plant = recipe_json.get("plant_type", None)
    recipe_json = recipe_json
    recipe_uuid = str(uuid.uuid4())
    created_from_uuid = recipe_json.get("template_recipe_uuid", None)
    modified_at = datetime.now()
    user_token = received_form_response.get("user_token", None)
    components = recipe_json.get("components", [])

    if user_token is None or recipe_json is None or recipe_name is None:
        result = Response({"message": "Please make sure you have added values for all the fields"}, status=500,
                          mimetype='application/json')
        return result

    query_session = datastore_client.query(kind="UserSession")
    query_session.add_filter('session_token', '=', user_token)
    query_session_result = list(query_session.fetch())
    user_uuid = None
    if len(query_session_result) > 0:
        user_uuid = query_session_result[0].get("user_uuid", None)

    # Add the user to the users kind of entity
    key = datastore_client.key('Recipes')
    # Indexes every other column except the description
    device_reg_task = datastore.Entity(key, exclude_from_indexes=[])

    device_reg_task.update({
        'recipe_name': recipe_name,
        'recipe_plant': recipe_plant,
        'recipe_json': json.dumps(recipe_json),
        'recipe_uuid': recipe_uuid,
        'user_uuid': user_uuid,
        'created_from_uuid': created_from_uuid,
        'modified_at': modified_at,
        'components': components
    })

    datastore_client.put(device_reg_task)

    if device_reg_task.key:
        data = json.dumps({
            "response_code": 200
        })
        result = Response(data, status=200, mimetype='application/json')

    else:
        data = json.dumps({
            "message": "Sorry something failed. Womp womp!"
        })
        result = Response(data, status=500, mimetype='application/json')

    return result


@recipes_blueprint.route('/api/get_recipe_details/', methods=['GET', 'POST'])
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

