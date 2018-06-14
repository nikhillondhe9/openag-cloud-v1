
from flask import Blueprint
from flask import Response
from flask import request

from .env_variables import *

get_recipe_components_bp = Blueprint('get_recipe_components_bp',__name__)

@get_recipe_components_bp.route('/api/get_recipe_components/', methods=['GET', 'POST'])
def get_recipe_components():
    print("Fetching components related to a recipe")
    received_form_response = json.loads(request.data.decode('utf-8'))
    recipe_uuid = str(received_form_response.get("recipe_id", '0'))

    components_array = []
    component_ids_array = []
    recipe_json = {}

    if recipe_uuid != '0':
        recipe_query = datastore_client.query(kind='Recipes')
        recipe_query.add_filter('recipe_uuid', '=', recipe_uuid)
        recipe_query_result = list(recipe_query.fetch())
        if len(recipe_query_result) == 1:
            component_ids = recipe_query_result[0]['components']
            recipe_json = recipe_query_result[0]['recipe_json']
            recipe_json = json.dumps(
                {k: v for k, v in json.loads(recipe_json).items() if k != 'components' or k != 'user_token'})
            for component_id in component_ids:
                component_ids_array.append(str(component_id))
                query = datastore_client.query(kind='Components')
                query.add_filter('component_id', '=', int(component_id))
                query_result = list(query.fetch())
                results = list(query_result)

                if len(results) > 0:
                    for result_row in results:
                        result_json = {
                            'component_key': result_row.get("component_key", ""),
                            'component_id': result_row.get("component_id", ""),
                            'component_description': result_row.get("component_description", ""),
                            'component_label': result_row.get("component_label", ""),
                            'component_type': result_row.get("component_type", ""),
                            'field_json': json.loads(result_row.get("field_json", {})),
                            'modified_at': result_row.get("modified_at", "").strftime("%Y-%m-%d %H:%M:%S")
                        }
                        components_array.append(result_json)
    else:
        for component_id in ["1", "2", "3"]:
            recipe_json = json.dumps({})
            component_ids_array.append(str(component_id))
            query = datastore_client.query(kind='Components')
            query.add_filter('component_id', '=', int(component_id))
            query_result = list(query.fetch())
            results = list(query_result)

            if len(results) > 0:
                for result_row in results:
                    result_json = {
                        'component_key': result_row.get("component_key", ""),
                        'component_id': result_row.get("component_id", ""),
                        'component_description': result_row.get("component_description", ""),
                        'component_label': result_row.get("component_label", ""),
                        'component_type': result_row.get("component_type", ""),
                        'field_json': json.loads(result_row.get("field_json", {})),
                        'modified_at': result_row.get("modified_at", "").strftime("%Y-%m-%d %H:%M:%S")
                    }
                    components_array.append(result_json)

    data = json.dumps({
        "response_code": 200,
        "results": components_array,
        'recipe_json': recipe_json,
        "component_ids_array": component_ids_array
    })
    result = Response(data, status=200, mimetype='application/json')
    return result
