from flask import Blueprint

from .utils.env_variables import *
from .utils.response import success_response

get_plant_types_bp = Blueprint('get_plant_types_bp', __name__)


@get_plant_types_bp.route('/api/get_plant_types/', methods=['GET', 'POST'])
def get_plant_types():
    query = datastore_client.query(kind='Plants')
    query_result = list(query.fetch())
    results = list(query_result)

    results_array = []
    for result in results:
        plant_type_json = {
            'name':result['name'],
            'variants':result['variants']
        }
        results_array.append(plant_type_json)

    return success_response(
        results=results_array
    )
