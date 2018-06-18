import ast

from flask import Response
from flask import request
from google.cloud import bigquery
from queries import queries
from flask import Blueprint
from .utils.env_variables import *
from .utils.response import success_response, error_response

get_led_panel_bp = Blueprint('get_led_panel_bp',__name__)

# ------------------------------------------------------------------------------
@get_led_panel_bp.route('/api/get_led_panel/', methods=['GET', 'POST'])
def get_led_panel():
    received_form_response = json.loads(request.data.decode('utf-8'))
    device_uuid = received_form_response.get("selected_device_uuid", None)

    if device_uuid is None:
        device_uuid = 'None'

    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = False

    query_str = queries.formatQuery(
        queries.fetch_led_panel_history, device_uuid)

    query_job = bigquery_client.query(query_str, job_config=job_config)
    query_result = query_job.result()
    result_json = []
    for row in list(query_result):
        values_json = (ast.literal_eval(row[1]))
        if "values" in values_json:
            values = values_json["values"]
            if len(values) > 0:
                result_json.append({'cool_white': int(values[0]['value'].split(',')[0], 16),
                                    'warm_white': int(values[0]['value'].split(',')[1], 16),
                                    'blue': int(values[0]['value'].split(',')[2], 16),
                                    'green': int(values[0]['value'].split(',')[3], 16),
                                    'red': int(values[0]['value'].split(',')[4], 16),
                                    'far_red': int(values[0]['value'].split(',')[5], 16),
                                    'time': row.eastern_time})

    return success_response(
        results=result_json
    )
