from flask import Blueprint
from flask import request
from flask import Response
import json
from flask import request
from google.cloud import bigquery
from queries import queries
from .utils.auth import get_user_uuid_from_token
from .utils.env_variables import *
from .utils.response import success_response, error_response
from . import utils
import ast
get_all_recipes_bp = Blueprint('get_all_recipes', __name__)

@get_all_recipes_bp.route('/api/alexa', methods=['GET', 'POST'])
def alexa():
    device_uuid = "EDU-184DFDB6-50-65-83-d3-38-eb"

    if device_uuid is None:
        device_uuid = 'None'

    # NOTE: you must use a NEW QueryJobConfig for each query, or you will get
    # this error: google.api_core.exceptions.BadRequest: 400 Cannot explicitly modify anonymous table
    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = False
    query_str = queries.formatQuery(
        queries.fetch_current_co2_value, device_uuid)
    query_job = bigquery_client.query(query_str, job_config=job_config)
    query_result = query_job.result()
    result_json = {}
    for row in list(query_result):
        values_json = (ast.literal_eval(row[1]))
        if "values" in values_json:
            values = values_json["values"]
            result_json["current_co2"] = \
                "{0:.2f}".format(float(values[0]['value']))

    # use a NEW QueryJobConfig for each query!
    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = False
    query_str = queries.formatQuery(
        queries.fetch_current_temperature_value, device_uuid)
    query_job = bigquery_client.query(query_str, job_config=job_config)
    query_result = query_job.result()
    for row in list(query_result):
        values_json = (ast.literal_eval(row[1]))
        # This depends on getting results in order, RH first, then temp.
        if "values" in values_json:
            values = values_json["values"]
            result_json["current_temp"] = \
                "{0:.2f}".format(float(values[0]['value']))

    # use a NEW QueryJobConfig for each query!
    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = False
    query_str = queries.formatQuery(
        queries.fetch_current_RH_value, device_uuid)
    query_job = bigquery_client.query(query_str, job_config=job_config)
    query_result = query_job.result()
    for row in list(query_result):
        values_json = (ast.literal_eval(row[1]))
        # This depends on getting results in order, RH first, then temp.
        if "values" in values_json:
            values = values_json["values"]
            result_json["current_rh"] = \
                "{0:.2f}".format(float(values[0]['value']))

    print(result_json)
    data = json.dumps({
        "test":"test"
    })
    return Response("Your current temperature is",200)



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

    user = utils.datastore.get_one(
        kind='Users', key='user_uuid', value=user_uuid
    )
    saved_recipes = user.get('saved_recipes', [])

    results_array = []
    for result in results:
        recipe_json = json.loads(result["recipe"])
        results_array.append({
            'name': recipe_json['name'],
            'description': recipe_json['description']['brief'],
            'recipe_uuid': result["recipe_uuid"],
            "recipe_json": recipe_json,
            "user_uuid": result['user_uuid'],
            "image_url": result["image_url"],
            'saved': result['recipe_uuid'] in saved_recipes
        })

    return success_response(
        results=results_array,
        devices=devices_array,
        user_uuid=user_uuid
    )
