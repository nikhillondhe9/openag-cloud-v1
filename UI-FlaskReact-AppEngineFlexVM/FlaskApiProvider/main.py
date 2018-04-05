from flask import Flask, render_template, request
from flask import Response
import json
from calendar import timegm
from flask_cors import CORS
from datetime import datetime, timedelta
from google.cloud import bigquery
from google.cloud import datastore
from passlib.hash import pbkdf2_sha256

app = Flask(__name__)
import uuid

import os

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = './authenticate.json'
# Remove this later - Only use it for testing purposes. Not safe to leave it here
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})
CORS(app)

# Client id for datastore client
cloud_project_id = "openag-v1"


@app.route('/api/register/', methods=['GET', 'POST'])
def register():
    received_form_response = json.loads(request.data)

    user_token = received_form_response.get("user_token", None)
    device_name = received_form_response.get("device_name", None)
    device_reg_no = received_form_response.get("device_reg_no", None)
    device_notes = received_form_response.get("device_notes", None)
    device_type = received_form_response.get("device_type", None)
    time_stamp = datetime.now()

    if user_token is None or device_reg_no is None:
        result = Response({"message": "Please make sure you have added values for all the fields"}, status=500,
                          mimetype='application/json')
        return result

    datastore_client = datastore.Client(cloud_project_id)
    query_session = datastore_client.query(kind="UserSession")
    query_session.add_filter('session_token', '=', user_token)
    query_session_result = list(query_session.fetch())
    user_uuid = None
    if len(query_session_result) > 0:
        user_uuid = query_session_result[0].get("user_uuid", None)

    # Add the user to the users kind of entity
    key = datastore_client.key('Devices')
    # Indexes every other column except the description
    device_reg_task = datastore.Entity(key, exclude_from_indexes=[])

    device_reg_task.update({
        'device_uuid': str(uuid.uuid4()),
        'device_name': device_name,
        'device_reg_no': device_reg_no,
        'device_notes': device_notes,
        'user_uuid': user_uuid,
        'device_type': device_type,
        'registration_date': time_stamp
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


@app.route('/api/signup/', methods=['GET', 'POST'])
def signup():
    received_form_response = json.loads(request.data)

    username = received_form_response.get("username", None)
    email_address = received_form_response.get("email_address", None)
    password = received_form_response.get("password", None)
    organization = received_form_response.get("organization", None)
    user_uuid = str(uuid.uuid4())
    date_added = datetime.now()

    datastore_client = datastore.Client(cloud_project_id)
    # Add the user to the users kind of entity
    key = datastore_client.key('Users')

    # Indexes every other column except the description
    signup_task = datastore.Entity(key, exclude_from_indexes=[])

    if username is None or email_address is None or password is None:
        result = Response({"message": "Please make sure you have added values for all the fields"}, status=500,
                          mimetype='application/json')
        return result

    encrypted_password = pbkdf2_sha256.hash(password)
    signup_task.update({
        'username': username,
        'email_address': email_address,
        'password': encrypted_password,
        'date_added': date_added,
        'organization': organization,
        'user_uuid': user_uuid,
        'is_verified': True
    })

    datastore_client.put(signup_task)
    if signup_task.key:
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


@app.route('/login/', methods=['GET', 'POST'])
def login():
    received_form_response = json.loads(request.data)

    username = received_form_response.get("username", None)
    password = received_form_response.get("password", None)

    datastore_client = datastore.Client(cloud_project_id)

    if username is None or password is None:
        result = Response({"message": "Please make sure you have added values for all the fields"}, status=500,
                          mimetype='application/json')
        return result

    query = datastore_client.query(kind='Users')
    query.add_filter('username', '=', username)
    query_result = list(query.fetch())

    if len(list(query_result)) > 0:
        print("User found - Verifying password")
        is_verified = pbkdf2_sha256.verify(password, query_result[0]['password'])
        if is_verified:
            session_token = str(uuid.uuid4())
            date_added = datetime.now()
            expiration_date = date_added + timedelta(hours=24)
            # Add the user to the UserSession kind of entity
            key = datastore_client.key('UserSession')
            session_task = datastore.Entity(key, exclude_from_indexes=[])
            session_task.update({
                'user_uuid': query_result[0]['user_uuid'],
                'session_token': session_token,
                'created_date': date_added,
                'expiration_date': expiration_date
            })
            datastore_client.put(session_task)
            data = json.dumps({
                "response_code": 200,
                "user_uuid": query_result[0]['user_uuid'],
                "user_token": session_token,
                "message": "Login Successful"
            })
            result = Response(data, status=200, mimetype='application/json')

    else:
        data = json.dumps({
            "response_code": 500,
            "message": "Login failed. Please check your credentials"
        })
        result = Response(data, status=500, mimetype='application/json')
    return result


@app.route('/api/get_user_devices/', methods=['GET', 'POST'])
def get_user_devices():
    print("Fetching all the user deivces")

    received_form_response = json.loads(request.data)

    user_token = received_form_response.get("user_token", None)

    if user_token is None:
        result = Response({"message": "Please make sure you have added values for all the fields"}, status=500,
                          mimetype='application/json')
        return result

    datastore_client = datastore.Client(cloud_project_id)
    query = datastore_client.query(kind='Devices')
    query_session = datastore_client.query(kind="UserSession")
    query_session.add_filter('session_token', '=', user_token)
    query_session_result = list(query_session.fetch())
    user_uuid = None
    if len(query_session_result) > 0:
        user_uuid = query_session_result[0].get("user_uuid", None)

    query.add_filter('user_uuid', '=', user_uuid)
    query_result = list(query.fetch())

    results = list(query_result)

    results_array = []
    if len(results) > 0:
        for result_row in results:
            result_json = {
                'device_uuid': result_row.get("device_uuid", ""),
                'device_notes': result_row.get("device_notes", ""),
                'device_type': result_row.get("device_type", ""),
                'device_reg_no': result_row.get("device_reg_no", ""),
                'registration_date': result_row.get("registration_date", "").strftime("%Y-%m-%d %H:%M:%S"),
                'user_uuid': result_row.get("user_uuid", ""),
                'device_name': result_row.get("device_name", "")
            }
            results_array.append(result_json)

        data = json.dumps({
            "response_code": 200,
            "results": results_array
        })
        result = Response(data, status=200, mimetype='application/json')
        return result
    else:
        data = json.dumps({
            "response_code": 500,
            "results": results_array
        })
        result = Response(data, status=500, mimetype='application/json')
        return result


@app.route('/api/get_all_recipes/', methods=['GET', 'POST'])
def get_all_recipes():
    print("Fetching all the recipes")
    datastore_client = datastore.Client(cloud_project_id)
    received_form_response = json.loads(request.data)
    user_token =received_form_response.get("user_token",None)
    query_session = datastore_client.query(kind="UserSession")
    query_session.add_filter('session_token', '=', user_token)
    query_session_result = list(query_session.fetch())
    user_uuid = None
    if len(query_session_result) > 0:
        user_uuid = query_session_result[0].get("user_uuid", None)
    #Get the user devices and pass that information to the front end too
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
            "devices":devices
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


@app.route('/api/get_recipe_components/', methods=['GET', 'POST'])
def get_recipe_components():
    print("Fetching components related to a recipe")
    received_form_response = json.loads(request.data)
    recipe_uuid = str(received_form_response.get("recipe_id", '0'))

    datastore_client = datastore.Client(cloud_project_id)
    components_array = []
    component_ids_array = []
    recipe_json = {}

    if recipe_uuid != '0':
        recipe_query = datastore_client.query(kind='Recipes')
        recipe_query.add_filter('recipe_uuid', '=', recipe_uuid)
        recipe_query_result = list(recipe_query.fetch())
        if len(recipe_query_result) == 1:
            component_ids = recipe_query_result[0]['components']
            recipe_json = recipe_query_result[0]['recipe_json']
            recipe_json = json.dumps(
                {k: v for k, v in json.loads(recipe_json).items() if k != 'components' or k != 'user_token'})
            for component_id in component_ids:
                component_ids_array.append(str(component_id))
                query = datastore_client.query(kind='Components')
                query.add_filter('component_id', '=', int(component_id))
                query_result = list(query.fetch())
                results = list(query_result)
                print("My Component results")
                print(results)
                if len(results) > 0:
                    for result_row in results:
                        result_json = {
                            'component_description': result_row.get("component_description", ""),
                            'component_id': result_row.get("component_id", ""),
                            'component_name': result_row.get("component_name", ""),
                            'component_type': result_row.get("component_type", ""),
                            'fields_json': json.loads(result_row.get("fields_json", {})),
                            'modified_at': result_row.get("modified_at", "").strftime("%Y-%m-%d %H:%M:%S")
                        }
                        components_array.append(result_json)
    else:
        print("Get components")
        for component_id in ["1", "2", "3"]:
            recipe_json = json.dumps({})
            component_ids_array.append(str(component_id))
            query = datastore_client.query(kind='Components')
            query.add_filter('component_id', '=', int(component_id))
            query_result = list(query.fetch())
            results = list(query_result)
            print("My Component results")
            print(results)
            if len(results) > 0:
                for result_row in results:
                    result_json = {
                        'component_description': result_row.get("component_description", ""),
                        'component_id': result_row.get("component_id", ""),
                        'component_name': result_row.get("component_name", ""),
                        'component_type': result_row.get("component_type", ""),
                        'fields_json': json.loads(result_row.get("fields_json", {})),
                        'modified_at': result_row.get("modified_at", "").strftime("%Y-%m-%d %H:%M:%S")
                    }
                    components_array.append(result_json)
    data = json.dumps({
        "response_code": 200,
        "results": components_array,
        'recipe_json': recipe_json,
        "component_ids_array": component_ids_array
    })
    result = Response(data, status=200, mimetype='application/json')
    return result
    # else:
    #     data = json.dumps({
    #         "response_code": 500,
    #         "results": components_array,
    #         'recipe_json': recipe_json,
    #         "component_ids_array": component_ids_array
    #     })
    #     result = Response(data, status=500, mimetype='application/json')
    #     return result


@app.route('/api/save_recipe/', methods=['GET', 'POST'])
def save_recipe():
    received_form_response = json.loads(request.data)
    recipe_json = json.loads(received_form_response.get("recipe_json", None))
    recipe_name = recipe_json.get("recipe_name", None)
    recipe_plant = recipe_json.get("plant_type", None)
    recipe_json = recipe_json
    recipe_uuid = str(uuid.uuid4())
    created_from_uuid = recipe_json.get("template_recipe_uuid", None)
    modified_at = datetime.now()
    user_token = received_form_response.get("user_token", None)
    components = recipe_json.get("components", [])
    print("SAV")
    print(components)
    if user_token is None or recipe_json is None or recipe_name is None:
        result = Response({"message": "Please make sure you have added values for all the fields"}, status=500,
                          mimetype='application/json')
        return result

    datastore_client = datastore.Client(cloud_project_id)
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


@app.route('/api/apply_to_device/', methods=['GET', 'POST'])
def apply_to_device():
    received_form_response = json.loads(request.data)

    device_uuid = received_form_response.get("device_uuid", None)
    recipe_uuid = received_form_response.get("recipe_uuid", None)
    user_token = received_form_response.get("user_token", None)
    date_applied = datetime.now()

    datastore_client = datastore.Client(cloud_project_id)
    # Add the user to the users kind of entity
    key = datastore_client.key('DeviceHistory')

    #check if the device already has a valid history
    # device_query = datastore_client.query(kind='DeviceHistory')
    # device_query.add_filter('device_uuid', '=', device_uuid)
    # #Fetch any records added before today
    # device_query.add_filter('date_applied', '<=', datetime.now())
    # device_query_result = list(device_query.fetch())
    #
    # if len(device_query_result) > 0:
    #     for result in device_query_result:
    #         if result["date_expired"] > datetime.now():
    #
    # Indexes every other column except the description
    apply_to_device_task = datastore.Entity(key, exclude_from_indexes=[])

    if device_uuid is None or recipe_uuid is None or user_token is None:
        result = Response({"message": "Please make sure you have added values for all the fields"}, status=500,
                          mimetype='application/json')
        return result

    apply_to_device_task.update({
        'device_uuid': device_uuid,
        'recipe_uuid': recipe_uuid,
        'date_applied': date_applied,
        'date_expires': date_applied+timedelta(days=3000)
    })

    datastore_client.put(apply_to_device_task)
    if apply_to_device_task.key:
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