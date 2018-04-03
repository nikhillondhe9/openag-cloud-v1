
from flask import Flask, render_template, request
from flask import Response
import json
from calendar import timegm
from flask_cors import CORS
from datetime import datetime,timedelta
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

#Client id for datastore client
cloud_project_id = "openag-v1"


@app.route('/')
def hell_world():
    return 'Hello, World!'


@app.route('/api/register/',methods=['GET', 'POST'])
def register():

    received_form_response = json.loads(request.data)
    client = bigquery.Client()
    username = received_form_response.get("username",None)
    deviceNumber = received_form_response.get("deviceNumber",None)
    deviceName = received_form_response.get("deviceName",None)
    deviceDescription = received_form_response.get("deviceDescription", None)
    time_stamp = datetime.now()
    job_config = bigquery.QueryJobConfig()

    # Set use_legacy_sql to False to use standard SQL syntax.
    # Note that queries are treated as standard SQL by default.
    job_config.use_legacy_sql = False

    if username is None or deviceNumber is None:
        result = Response({"message":"Please make sure you have added values for all the fields"}, status=500, mimetype='application/json')
        return result

    insert_user_query = """INSERT INTO test.devices (user_id, device_id, device_notes,date_added,device_name) VALUES (@username, @deviceNumber, @deviceDescription,@date_added,@deviceName)"""
    query_params = [
        bigquery.ScalarQueryParameter('username', 'STRING', username),
        bigquery.ScalarQueryParameter('deviceNumber', 'STRING', deviceNumber),
        bigquery.ScalarQueryParameter('deviceDescription', 'STRING', deviceDescription),
        bigquery.ScalarQueryParameter('deviceName', 'STRING', deviceName),
        bigquery.ScalarQueryParameter(
            'date_added',
            'TIMESTAMP',
            time_stamp)
    ]
    job_config.query_parameters = query_params

    query_job= client.query(insert_user_query,job_config=job_config)
    print(query_job.result())

    data = json.dumps({
        "response_code":200
    })

    result = Response(data, status=200, mimetype='application/json')
    return result


@app.route('/api/signup/',methods=['GET', 'POST'])
def signup():
    received_form_response = json.loads(request.data)

    username = received_form_response.get("username",None)
    email_address = received_form_response.get("email_address",None)
    password = received_form_response.get("password",None)
    organization = received_form_response.get("organization",None)
    user_uuid = str(uuid.uuid4())
    date_added = datetime.now()

    datastore_client = datastore.Client(cloud_project_id)
    # Add the user to the users kind of entity
    key = datastore_client.key('Users')

    # Indexes every other column except the description
    signup_task = datastore.Entity(key, exclude_from_indexes=[])

    if username is None or email_address is None or password is None:
        result = Response({"message":"Please make sure you have added values for all the fields"}, status=500, mimetype='application/json')
        return result

    encrypted_password  = pbkdf2_sha256.hash(password)
    signup_task.update({
        'username': username,
        'email_address': email_address,
        'password':encrypted_password ,
        'date_added': date_added,
        'organization': organization,
        'user_uuid': user_uuid,
        'is_verified': True
    })

    datastore_client.put(signup_task)
    if signup_task.key:
        data = json.dumps({
            "response_code":200
        })

        result = Response(data, status=200, mimetype='application/json')

    else:
        data = json.dumps({
            "message": "Sorry something failed. Womp womp!"
        })
        result = Response(data, status=500, mimetype='application/json')

    return result



@app.route('/login/',methods=['GET', 'POST'])
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
        is_verified  = pbkdf2_sha256.verify(password,query_result[0]['password'])
        if is_verified:
            session_token = uuid.uuid4()
            date_added = datetime.now()
            expiration_date = date_added+timedelta(hours=24)
            # Add the user to the UserSession kind of entity
            key = datastore_client.key('UserSession')
            session_task = datastore.Entity(key, exclude_from_indexes=[])
            session_task.update({
                'user_uuid': query_result[0]['user_uuid'],
                'session_token': str(session_token),
                'created_date': date_added,
                'expiration_date': expiration_date
            })
            datastore_client.put(session_task)
            data = json.dumps({
                "response_code": 200,
                "message": "Login Successful"
            })
            result = Response(data, status=200, mimetype='application/json')

    else:
        data = json.dumps({
            "response_code":500,
            "message":"Login failed. Please check your credentials"
        })
        result = Response(data, status=500, mimetype='application/json')
    return result


@app.route('/api/get_user_devices/',methods=['GET', 'POST'])
def get_user_devices():
    print("Fetching all the user deivces")
    received_form_response = json.loads(request.data)
    client = bigquery.Client()
    username = received_form_response.get("username", None)
    job_config = bigquery.QueryJobConfig()

    # Set use_legacy_sql to False to use standard SQL syntax.
    # Note that queries are treated as standard SQL by default.
    job_config.use_legacy_sql = False

    if username is None:
        result = Response({"message": "Please make sure you have added values for all the fields"}, status=500,
                          mimetype='application/json')
        return result

    insert_user_query = """SELECT * FROM test.devices WHERE user_id=@username"""
    query_params = [
        bigquery.ScalarQueryParameter('username', 'STRING', username)
    ]
    job_config.query_parameters = query_params

    query_job = client.query(insert_user_query, job_config=job_config)
    query_result = query_job.result()

    results_array = []
    for row in list(query_result):
        print("Printing row")
        print(row[0])
        row_json = {
            "user_id":row[0],
            "device_id":row[1],
            "date_added":str(row[2]),
            "device_notes":row[3],
            "device_name":row[4]
        }
        results_array.append(row_json)

    if len(results_array) > 0:
        data = json.dumps({
             "response_code": 200,
             "results":results_array
        })

    else:
        data = json.dumps({
            "response_code":200,
            "message":"Please check your credentials"
        })

    result = Response(data, status=200, mimetype='application/json')
    return result


@app.route('/api/get_all_recipes/',methods=['GET', 'POST'])
def get_all_recipes():

    received_form_response = json.loads(request.data)
    client = bigquery.Client()
    job_config = bigquery.QueryJobConfig()

    # Set use_legacy_sql to False to use standard SQL syntax.
    # Note that queries are treated as standard SQL by default.
    job_config.use_legacy_sql = False

    selct_all_recipes_query = """SELECT * FROM test.recipes"""
    query_job = client.query(selct_all_recipes_query, job_config=job_config)
    query_result = query_job.result()
    print("Results")
    print(query_result)
    if len(list(query_result)) > 0:

        data = json.dumps({
             "response_code": 200
        })

    else:
        data = json.dumps({
            "response_code":200,
            "message":"Please check your credentials"
        })

    result = Response(data, status=200, mimetype='application/json')
    return result