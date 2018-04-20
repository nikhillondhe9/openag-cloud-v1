import json
from datetime import datetime, timedelta
import ast
from flask import Flask, request
from flask import Response
from flask_cors import CORS
from google.cloud import datastore
from passlib.hash import pbkdf2_sha256
from FCClass.user import User
from FCClass.user_session import UserSession
from google.cloud import bigquery

bigquery_client = bigquery.Client()
app = Flask(__name__)
import uuid

import os

os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = './authenticate.json'
# Remove this later - Only use it for testing purposes. Not safe to leave it here
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})
CORS(app)

# Client id for datastore client
cloud_project_id = "openag-v1"
# Datastore client for Google Cloud
datastore_client = datastore.Client(cloud_project_id)


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

    if username is None or email_address is None or password is None:
        result = Response({"message": "Please make sure you have added values for all the fields"}, status=500,
                          mimetype='application/json')
        return result

    user_uuid = User(username=username, password=password, email_address=email_address,
                     organization=organization).insert_into_db(datastore_client)

    if user_uuid:
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

    if username is None or password is None:
        result = Response({"message": "Please make sure you have added values for all the fields"}, status=500,
                          mimetype='application/json')
        return result

    user_uuid = User(username=username, password=password).login_user(client=datastore_client)
    if user_uuid:
        session_token = UserSession(user_uuid=user_uuid).insert_into_db(client=datastore_client)
        data = json.dumps({
            "response_code": 200,
            "user_uuid": user_uuid,
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

    received_form_response = json.loads(request.data)
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


@app.route('/api/get_recipe_components/', methods=['GET', 'POST'])
def get_recipe_components():
    print("Fetching components related to a recipe")
    received_form_response = json.loads(request.data)
    recipe_uuid = str(received_form_response.get("recipe_id", '0'))

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
                            'component_key': result_row.get("component_key", ""),
                            'component_id': result_row.get("component_id", ""),
                            'component_description': result_row.get("component_description", ""),
                            'component_label': result_row.get("component_label", ""),
                            'component_type': result_row.get("component_type", ""),
                            'field_json': json.loads(result_row.get("field_json", {})),
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
                        'component_key': result_row.get("component_key", ""),
                        'component_id': result_row.get("component_id", ""),
                        'component_description': result_row.get("component_description", ""),
                        'component_label': result_row.get("component_label", ""),
                        'component_type': result_row.get("component_type", ""),
                        'field_json': json.loads(result_row.get("field_json", {})),
                        'modified_at': result_row.get("modified_at", "").strftime("%Y-%m-%d %H:%M:%S")
                    }
                    components_array.append(result_json)
                    print("Components arrau")
    data = json.dumps({
        "response_code": 200,
        "results": components_array,
        'recipe_json': recipe_json,
        "component_ids_array": component_ids_array
    })
    result = Response(data, status=200, mimetype='application/json')
    return result


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
    print("")
    print(components)
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


@app.route('/api/get_temp_details/', methods=['GET', 'POST'])
def get_temp_details():
    # received_form_response = json.loads(request.data)
    job_config = bigquery.QueryJobConfig()

    job_config.use_legacy_sql = False
    insert_user_query = """SELECT
  FORMAT_TIMESTAMP( '%c', TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')), 'America/New_York') as eastern_time,
  REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)') as var,
  REGEXP_EXTRACT(id, r'(?:[^\~]*\~){5}([^-]*)') as device,  #matches up to first '-' in the id, to not show the random UUID stuff.
  values as row_values
  # , id
  FROM test.vals
  #WHERE starts_with(id, "Exp~")
  #WHERE starts_with(id, "EDU_Basil_test_grow_1~Cmd~")
  #WHERE starts_with(id, "EDU_Basil_test_grow_1")
  WHERE starts_with(id, "EDU_Basil_test_grow_2")
  #WHERE starts_with(id, "FS-2-40")
  #WHERE starts_with(id, "FS-2-40~Cmd")
  AND 'temp_humidity_sht25' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)')
  ORDER BY REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)') DESC 
  LIMIT 200"""
    query_job = bigquery_client.query(insert_user_query, job_config=job_config)
    result = None
    query_result = query_job.result()
    humidity_array = []
    temp_array = []
    result_json = {
        'RH':humidity_array,
        'temp':temp_array
    }
    for row in query_result:
        # print("{} : {} views".format(row.row_values,row.eastern_time))

        values_json = (ast.literal_eval(row.row_values))
        if "values" in values_json:
            values = values_json["values"]
            if len(values) >0 :
                result_json["temp"].append({'value':values[0]['value'],'time':row.eastern_time})
                if len(values) > 1:
                    result_json["RH"].append({'value':values[1]['value'],'time':row.eastern_time})

    print(result_json)
    data = json.dumps({
        "response_code": 200,
        "results":result_json
    })

    result = Response(data, status=200, mimetype='application/json')
    return result

@app.route('/api/get_led_panel/', methods=['GET', 'POST'])
def get_led_panel():
    # received_form_response = json.loads(request.data)
    job_config = bigquery.QueryJobConfig()

    job_config.use_legacy_sql = False
    insert_user_query = """SELECT
  FORMAT_TIMESTAMP( '%c', TIMESTAMP( REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)')), 'America/New_York') as eastern_time,
  REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)') as var,
  REGEXP_EXTRACT(id, r'(?:[^\~]*\~){5}([^-]*)') as device,  #matches up to first '-' in the id, to not show the random UUID stuff.
  values as row_values
  # , id
  FROM test.vals
  #WHERE starts_with(id, "Exp~")
  #WHERE starts_with(id, "EDU_Basil_test_grow_1~Cmd~")
  #WHERE starts_with(id, "EDU_Basil_test_grow_1")
  WHERE starts_with(id, "EDU_Basil_test_grow_2")
  #WHERE starts_with(id, "FS-2-40")
  #WHERE starts_with(id, "FS-2-40~Cmd")
  AND 'LED_panel' = REGEXP_EXTRACT(id, r'(?:[^\~]*\~){3}([^~]*)')
  ORDER BY REGEXP_EXTRACT(id, r'(?:[^\~]*\~){4}([^~]*)') DESC 
  LIMIT 50"""
    query_job = bigquery_client.query(insert_user_query, job_config=job_config)
    result = None
    query_result = query_job.result()
    humidity_array = []
    temp_array = []
    result_json = []
    for row in query_result:
        # print("{} : {} views".format(row.row_values,row.eastern_time))

        values_json = (ast.literal_eval(row.row_values))
        if "values" in values_json:
            values = values_json["values"]
            if len(values) >0 :
                result_json.append({'value':values[0]['value'],'time':row.eastern_time})

    print(result_json)
    data = json.dumps({
        "response_code": 200,
        "results":result_json
    })

    result = Response(data, status=200, mimetype='application/json')
    return result


@app.route('/api/apply_to_device/', methods=['GET', 'POST'])
def apply_to_device():
    received_form_response = json.loads(request.data)

    device_uuid = received_form_response.get("device_uuid", None)
    recipe_uuid = received_form_response.get("recipe_uuid", None)
    user_token = received_form_response.get("user_token", None)
    date_applied = datetime.now()

    # Add the user to the users kind of entity
    key = datastore_client.key('DeviceHistory')

    # check if the device already has a valid history
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
        'date_expires': date_applied + timedelta(days=3000)
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
