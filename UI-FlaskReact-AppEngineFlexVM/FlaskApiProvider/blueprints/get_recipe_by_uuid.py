from flask import Blueprint
from flask import request
from .utils.auth import get_user_uuid_from_token
from .utils.env_variables import *
from .utils.response import success_response, error_response

get_recipe_by_uuid_bp = Blueprint('get_recipe_by_uuid_bp', __name__)


@get_recipe_by_uuid_bp.route('/api/get_recipe_by_uuid/', methods=['GET', 'POST'])
def get_recipe_by_uuid():

    received_form_response = json.loads(request.data.decode('utf-8'))
    user_token = received_form_response.get("user_token", None)
    if user_token is None:
        return error_response(
            message="Please make sure you have added values for all the fields"
        )

    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return error_response(
            message="Invalid User: Unauthorized"
        )

    # Get all user devices
    query = datastore_client.query(kind='Devices')
    query.add_filter('user_uuid', '=', user_uuid)
    query_result = list(query.fetch())
    results = list(query_result)
    devices_array = []
    if len(results) > 0:
        for result_row in results:
            device_id = result_row.get("device_uuid", "")
            device_reg_no = result_row.get("device_reg_no", "")
            device_name = result_row.get("device_name", "")
            print('  {}, {}, {}'.format(
                device_id, device_reg_no, device_name))
            result_json = {
                'device_uuid': device_id,
                'device_notes': result_row.get("device_notes", ""),
                'device_type': result_row.get("device_type", ""),
                'device_reg_no': device_reg_no,
                'registration_date': result_row.get("registration_date", "").strftime("%Y-%m-%d %H:%M:%S"),
                'user_uuid': result_row.get("user_uuid", ""),
                'device_name': device_name
            }
            devices_array.append(result_json)

    recipe_uuid = received_form_response.get("recipe_uuid",None)
    if recipe_uuid is None:
        return error_response(
            message="Invalid Recipe: Unauthorized"
        )



    query = datastore_client.query(kind='Recipes')
    query.add_filter("recipe_uuid","=",recipe_uuid)
    results = list(query.fetch())
    results_array = []
    for result in results:
        recipe_details_json = json.loads(result["recipe"])
        device_type = result['device_type']
        peripherals = []
        # Get Peripherals needed for this device type
        device_type_query = datastore_client.query(kind='DeviceType')
        device_type_results = list(device_type_query.fetch())
        device_type_results_array = []
        for device_type_result in device_type_results:
            device_type_json = {
                'peripherals': device_type_result['peripherals'],
                'device_type_id': device_type_result['id'],
                'name': device_type_result['name']
            }

            device_type_results_array.append(device_type_json)
            peripherals_string = device_type_result['peripherals']
            peripherals_array = peripherals_string.split(",")
            for peripheral in peripherals_array:

                peripherals_query = datastore_client.query(kind='Peripherals')
                peripherals_query.add_filter('uuid', '=', str(peripheral))
                peripheraldetails = list(peripherals_query.fetch())

                if len(peripheraldetails) > 0:
                    peripheral_detail_json = {
                        "name": peripheraldetails[0]["name"],
                        "sensor_name": peripheraldetails[0]["sensor_name"],
                        "type": peripheraldetails[0]["type"],
                        "color": "#" + peripheraldetails[0]["color"],
                        "inputs": peripheraldetails[0]["inputs"]
                    }
                    peripherals.append(peripheral_detail_json)



        recipe_json = {
            'name':recipe_details_json['name'],
            'description':recipe_details_json['description']['verbose'],
            'device_type':device_type,
            'plant_type':recipe_details_json['cultivars'][0]['name'],
            'peripherals':peripherals,
            'recipe_json':recipe_details_json
        }

        results_array.append(recipe_json)

    return success_response(
        results=results_array,
        devices=devices_array
    )
