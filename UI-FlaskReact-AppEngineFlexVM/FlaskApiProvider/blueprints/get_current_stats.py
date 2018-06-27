import ast
import json

from flask import Blueprint
from flask import Response
from flask import request
from google.cloud import bigquery
from queries import queries

from .utils.env_variables import *
from .utils.response import success_response, error_response

get_current_stats_bp = Blueprint('get_current_stats_bp',__name__)

# ------------------------------------------------------------------------------
@get_current_stats_bp.route('/api/get_current_stats/', methods=['GET', 'POST'])
def get_current_stats():
    received_form_response = json.loads(request.data.decode('utf-8'))
    device_uuid = received_form_response.get("selected_device_uuid", None)

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
            result_json["current_co2"] = "{0:.2f}".format(float(values[0]['value']))

    # use a NEW QueryJobConfig for each query!
    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = False
    query_str = queries.formatQuery(
        queries.fetch_temp_results_history, device_uuid)

    query_job = bigquery_client.query(query_str, job_config=job_config)
    query_result = query_job.result()
    for row in list(query_result):
        values_json = (ast.literal_eval(row[1]))
        # This depends on getting results in order, RH first, then temp.
        if "values" in values_json:
            values = values_json["values"]
            if "current_rh" not in result_json:
                result_json["current_rh"] = "{0:.2f}".format(float(values[0]['value']))
                continue
            if "current_temp" not in result_json:
                result_json["current_temp"] = "{0:.2f}".format(float(values[0]['value']))
                continue

    return success_response(
        results=result_json
    )


