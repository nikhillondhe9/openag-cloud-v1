from flask import Blueprint
from flask import Response
from flask import request
from .utils.env_variables import *
from .utils.response import success_response, error_response

get_device_peripherals_bp = Blueprint('get_device_peripherals_bp',__name__)

@get_device_peripherals_bp.route('/api/get_device_peripherals/',methods=['GET', 'POST'])
def get_device_peripherals():

    received_form_response = json.loads(request.data.decode('utf-8'))
    peripherals_string = received_form_response.get("selected_peripherals","")
    peripheral_details = []

    peripherals_array = peripherals_string.split(",")

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
                "color":"#"+peripheraldetails[0]["color"],
                "inputs": peripheraldetails[0]["inputs"]
            }
            peripheral_details.append(peripheral_detail_json)

    return success_response(
        results=peripheral_details
    )
