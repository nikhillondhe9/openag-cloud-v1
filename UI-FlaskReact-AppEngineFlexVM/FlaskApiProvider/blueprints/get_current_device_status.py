from flask import Blueprint
from flask import request

from .utils.database import get_device_data_from_DS
from .utils.env_variables import *
from .utils.response import success_response
from datetime import timezone

get_current_device_status_bp = Blueprint('get_current_device_status_bp',__name__)

def convert_timedelta(duration):
    days, seconds = duration.days, duration.seconds
    hours = days * 24 + seconds // 3600
    minutes = (seconds % 3600) // 60
    seconds = (seconds % 60)
    return hours, minutes, seconds

#------------------------------------------------------------------------------
@get_current_device_status_bp.route('/api/get_current_device_status/', methods=['GET', 'POST'])
def get_current_device_status():
    received_form_response = json.loads(request.data.decode('utf-8'))
    device_uuid = received_form_response.get("device_uuid", None)

    if device_uuid is None:
        device_uuid = 'None'

    device_data = get_device_data_from_DS(device_uuid)

    result_json = {
        "progress":0.0,
        "age_in_days":0,
        "wifi_status":"N/A for this device",
        "current_temp":"N/A for this device"
    }
    if device_data is not None:
        timestamp = device_data.get("timestamp").decode()
        timenow = str(datetime.now())
        fmt1 = '%Y-%m-%d %H:%M:%S.%f'
        fmt2 = '%Y-%m-%dT%H:%M:%SZ'

        t1 = datetime.strptime(timenow, fmt1)
        t2 = datetime.strptime(timestamp, fmt2)

        _,time_minutes,_ = convert_timedelta(t1-t2)
        if time_minutes > 5:
            wifi_status = "Disconnected"
        else:
            wifi_status = "Connected"

        if device_data.get("air_temp"):
            result_json["current_temp"] = \
                "%s C" %((device_data["air_temp"]).decode())

        result_json["progress"] = int(round(float(device_data.get("percent_complete") if device_data.get("percent_complete") else "0.0"))*100.0)

        result_json["wifi_status"] = wifi_status
        result_json["age_in_days"] = device_data.get("time_elapsed","")

    return success_response(
        results=result_json
    )


