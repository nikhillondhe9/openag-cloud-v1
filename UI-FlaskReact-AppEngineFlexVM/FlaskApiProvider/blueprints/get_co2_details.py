import ast
from datetime import timedelta

from flask import Blueprint
from flask import Response
from flask import request
from google.cloud import bigquery
from queries import queries

from .utils.env_variables import *

get_co2_details_bp = Blueprint('get_co2_details_bp',__name__)

# -
# ------------------------------------------------------------------------------
@get_co2_details_bp.route('/api/get_co2_details/', methods=['GET', 'POST'])
def get_co2_details():
    received_form_response = json.loads(request.data.decode('utf-8'))
    device_uuid = received_form_response.get("selected_device_uuid", None)

    if device_uuid is None:
        device_uuid = 'None'

    past_day_date = (datetime.now() - timedelta(hours=24))
    current_date = datetime.utcnow()
    job_config = bigquery.QueryJobConfig()
    job_config.use_legacy_sql = False

    query_str = queries.formatQuery(
        queries.fetch_co2_results_history, device_uuid)

    query_job = bigquery_client.query(query_str, job_config=job_config)
    query_result = query_job.result()
    results = []
    for row in list(query_result):
        values_json = (ast.literal_eval(row[1]))
        if "values" in values_json:
            values = values_json["values"]
            results.append({'value': values[0]['value'], 'time': row.eastern_time})

    data = json.dumps({
        "response_code": 200,
        "results": results
    })

    result = Response(data, status=200, mimetype='application/json')
    return result
