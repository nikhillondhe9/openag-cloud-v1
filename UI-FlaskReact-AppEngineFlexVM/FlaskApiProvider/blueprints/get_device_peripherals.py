from flask import Blueprint
from flask import Response

from .utils.env_variables import *

get_device_peripherals_bp = Blueprint('get_device_peripherals_bp',__name__)

@get_device_peripherals_bp.route('/api/get_device_peripherals/',methods=['GET', 'POST'])
def get_device_peripherals():
    query = datastore_client.query(kind='DeviceType')
    query.add_filter('name', '=', 'PFC_EDU')
    device_type_details = list(query.fetch())
    peripheral_details = []

    if len(device_type_details) > 0:
        peripherals = device_type_details[0]['peripherals']


    peripherals_array = peripherals.split(",")
    for peripheral in peripherals_array:
        print(str(peripheral))
        query = datastore_client.query(kind='Peripherals')
        query.add_filter('uuid', '=', str(peripheral))
        peripheraldetails = list(query.fetch())

        if len(peripheraldetails) > 0:
            peripheral_detail_json = {
                "name":peripheraldetails[0]["name"],
                "sensor_name":peripheraldetails[0]["sensor_name"],
                "type":peripheraldetails[0]["type"],
                "color":"#"+peripheraldetails[0]["color"]
            }
            peripheral_details.append(peripheral_detail_json)

    data = json.dumps({
        "response_code": 200,
        "results": peripheral_details
    })
    result = Response(data, status=200, mimetype='application/json')
    return result


