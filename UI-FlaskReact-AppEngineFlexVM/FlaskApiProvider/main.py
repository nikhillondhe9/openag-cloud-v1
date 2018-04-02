
from flask import Flask, render_template, request
from flask import Response
import json
from calendar import timegm
from flask_cors import CORS
from datetime import datetime
from google.cloud import bigquery
app = Flask(__name__)
import uuid

import os
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = './authenticate.json'
# Remove this later - Only use it for testing purposes. Not safe to leave it here
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})
CORS(app)

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
    client = bigquery.Client()
    received_form_response = json.loads(request.data)

    username = received_form_response.get("username",None)
    email_address = received_form_response.get("email_address",None)
    password = received_form_response.get("password",None)
    time_stamp = datetime.now()
    job_config = bigquery.QueryJobConfig()

    # Set use_legacy_sql to False to use standard SQL syntax.
    # Note that queries are treated as standard SQL by default.
    job_config.use_legacy_sql = False

    if username is None or email_address is None or password is None:
        result = Response({"message":"Please make sure you have added values for all the fields"}, status=500, mimetype='application/json')
        return result

    insert_user_query = """INSERT INTO test.users (username, email_address, password,date_added) VALUES (@username, @email_address, @password,@date_added)"""
    query_params = [
        bigquery.ScalarQueryParameter('username', 'STRING', username),
        bigquery.ScalarQueryParameter('email_address', 'STRING', email_address),
        bigquery.ScalarQueryParameter('password', 'STRING', password),
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


@app.route('/login/',methods=['GET', 'POST'])
def login():

    received_form_response = json.loads(request.data)
    client = bigquery.Client()
    username = received_form_response.get("username", None)
    password = received_form_response.get("password", None)
    job_config = bigquery.QueryJobConfig()

    # Set use_legacy_sql to False to use standard SQL syntax.
    # Note that queries are treated as standard SQL by default.
    job_config.use_legacy_sql = False

    if username is None or password is None:
        result = Response({"message": "Please make sure you have added values for all the fields"}, status=500,
                          mimetype='application/json')
        return result

    insert_user_query = """SELECT * FROM test.users WHERE username=@username AND password=@password"""
    query_params = [
        bigquery.ScalarQueryParameter('username', 'STRING', username),
        bigquery.ScalarQueryParameter('password', 'STRING', password)
    ]
    job_config.query_parameters = query_params

    query_job = client.query(insert_user_query, job_config=job_config)
    query_result = query_job.result()
    print("Results")
    print(query_result)
    if len(list(query_result)) > 0:
        print("User found and login successful")
        data = json.dumps({
             "response_code": 200
        })

    else:
        data = json.dumps({
            "response_code":200,
            "message":"Login failed. Please check your credentials"
        })

    result = Response(data, status=200, mimetype='application/json')
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