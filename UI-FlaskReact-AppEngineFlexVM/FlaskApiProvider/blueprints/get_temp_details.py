import ast

from flask import Blueprint
from flask import Response
from flask import request
from google.cloud import bigquery
from queries import queries

from .utils.env_variables import *
from .utils.response import success_response, error_response

get_temp_details_bp = Blueprint('get_temp_details_bp',__name__)

# ------------------------------------------------------------------------------
@get_temp_details_bp.route('/api/get_temp_details/', methods=['GET', 'POST'])
def get_temp_details():
    received_form_response = json.loads(request.data.decode('utf-8'))
    device_uuid = received_form_response.get("selected_device_uuid", None)

    if device_uuid is None:
        device_uuid = 'None'

    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = False

    query_str = queries.formatQuery(
        queries.fetch_temp_results_history, device_uuid)

    query_job = bigquery_client.query(query_str, job_config=job_config)

    query_result = query_job.result()
    humidity_array = []
    temp_array = []
    result_json = {
        'RH': humidity_array,
        'temp': temp_array
    }
    for row in list(query_result):
        values_json = (ast.literal_eval(row[1]))
        if "values" in values_json:
            values = values_json["values"]
            if len(values) > 0:
                result_json["temp"].append(
                    {'value': values[0]['value'], 'time': row.eastern_time})
                if len(values) > 1:
                    result_json["RH"].append(
                        {'value': values[1]['value'], 'time': row.eastern_time})

    return success_response(
        results=result_json
    )

