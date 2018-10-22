from flask import Response
from flask import request
from flask import Blueprint, request
from datetime import datetime
from .utils.env_variables import datastore_client

from .utils.env_variables import *
import json
from .utils.response import success_response

get_horticulture_daily_logs_bp = Blueprint('get_horticulture_daily_logs_bp',__name__)

#------------------------------------------------------------------------------
@get_horticulture_daily_logs_bp.route('/api/get_horticulture_daily_logs/', methods=['GET', 'POST'])
def get_horticulture_daily_logs():
    received_form_response = json.loads(request.data.decode('utf-8'))
    device_uuid = received_form_response.get("device_uuid", None)

    if device_uuid is None:
        device_uuid = 'None'

    query = datastore_client.query(kind='DailyHorticultureLog')
    query.add_filter('device_uuid', '=', device_uuid)
    query_result = list(query.fetch())
    if len(query_result) == 0:
        return success_response(
            expired=True
        )
    leaf_count_results = []
    plant_height_results = []
    for result in query_result:

        leaf_count_results.append({"value":result["leaf_count"],"time":str(result["submitted_at"])})
        plant_height_results.append({"value": result["plant_height"], "time": str(result["submitted_at"])})
    return success_response(
        leaf_count_results=leaf_count_results,
        plant_height_results=plant_height_results
    )
