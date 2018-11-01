from flask import Blueprint
from flask import request
import pytz
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
    query = datastore_client.query(kind='DeviceHistory',
                                   order=['-date_applied'])
    query.add_filter('device_uuid', '=', device_uuid)
    query_result = list(query.fetch(1))
    if len(query_result) == 0:
        return success_response(
            expired=True
        )

    current_recipe = query_result[0]
    days,runtime = get_runtime_description(current_recipe['date_applied'])

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
        result_json["runtime"] = runtime
        result_json["age_in_days"] = days

    return success_response(
        results=result_json
    )

def get_runtime_description(date_applied):
    """Returns recipe runtime in human readable form"""
    time_passed = datetime.now(pytz.utc) - date_applied
    description = []
    days_passed = time_passed.days
    # if days_passed > 30:
    #     phrase = number_noun_agreement(int(days_passed / 30), 'month')
    #     description.append(phrase)
    #     days_passed %= 30
    # if time_passed.days > 7:
    #     phrase = number_noun_agreement(int(days_passed / 7), 'week')
    #     description.append(phrase)
    #     days_passed %= 7
    if days_passed > 0:
        phrase = number_noun_agreement(days_passed, 'day')
        description.append(phrase)

    if description:
        return ', '.join(description),days_passed

    # No description (recipe has been running for less than a day)
    # A day has 86400 seconds, an hour as 3600 seconds
    seconds_passed = time_passed.seconds - time_passed.days * 86400
    hours_passed = int(seconds_passed / 3600)
    if hours_passed > 0:
        return number_noun_agreement(hours_passed, 'hour'),days_passed

    # Running for less than an hour
    minutes_passed = int(seconds_passed / 60)
    return number_noun_agreement(minutes_passed, 'minute'),days_passed

def number_noun_agreement(number, word):
    """Make phrase with a plural or singular noun based on the number

    number_noun_agreement(5, 'day') returns '5 days'
    """
    if number > 1 or number == 0:
        return f'{number} {word}s'
    elif number == 1:
        return f'{number} {word}'
    return ''
