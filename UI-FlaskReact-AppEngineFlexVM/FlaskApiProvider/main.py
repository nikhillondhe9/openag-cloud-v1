from flask import Flask, render_template, request
from flask_cors import CORS
from flask import Response
import json
from google.cloud import bigquery
from calendar import timegm
from datetime import datetime


app = Flask(__name__)

# Remove this later - Only use it for testing purposes. Not safe to leave it here
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})
CORS(app)

@app.route('/')
def hell_world():
    return 'Hello, World!'

@app.route('/signup/',methods=['GET', 'POST'])
def signup():
    received_form_response = json.loads(request.data)
    client = bigquery.Client()
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