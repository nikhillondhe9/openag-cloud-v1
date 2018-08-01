from flask import Blueprint
from flask import request

from .utils.database import get_current_temp_value
from .utils.env_variables import *
from .utils.response import success_response
from datetime import timezone

get_current_device_status_bp = Blueprint('get_current_device_status_bp',__name__)

#------------------------------------------------------------------------------
@get_current_device_status_bp.route('/api/get_current_device_status/', methods=['GET', 'POST'])
def get_current_device_status():
    received_form_response = json.loads(request.data.decode('utf-8'))
    device_uuid = received_form_response.get("device_uuid", None)

    if device_uuid is None:
        device_uuid = 'None'

    query = datastore_client.query(kind='DeviceHistory',
                                   order=['-date_applied'])
    query.add_filter('device_uuid', '=', device_uuid)
    query_result = list(query.fetch(1))
    if len(query_result) == 0:
        return success_response(
            expired=True
        )

    current_recipe = query_result[0]
    date_applied = current_recipe["date_applied"]
    date_today = datetime.now(timezone.utc)
    age_in_days = (date_today - date_applied).days
    result_json = {}
    result_json["current_temp"] = "%s C" %(get_current_temp_value(device_uuid))
    result_json["progress"] = int(age_in_days/6*7)
    result_json["age_in_days"] = age_in_days
    return success_response(
        results=result_json
    )


