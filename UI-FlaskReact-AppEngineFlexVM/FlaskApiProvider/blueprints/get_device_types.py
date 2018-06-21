from flask import Blueprint

from .utils.env_variables import *
from .utils.response import success_response

get_device_types_bp = Blueprint('get_device_types_bp', __name__)


@get_device_types_bp.route('/api/get_device_types/', methods=['GET', 'POST'])
def get_device_types():
    query = datastore_client.query(kind='DeviceType')
    query_result = list(query.fetch())
    results = list(query_result)

    results_array = []
    for result in results:
        device_type_json = {
            'peripherals':result['peripherals'],
            'device_type_id':result['id'],
            'name':result['name']
        }
        results_array.append(device_type_json)

    return success_response(
        results=results_array
    )
