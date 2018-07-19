import json
from flask import Blueprint, request
from datetime import datetime
import pytz
from .utils.env_variables import datastore_client
from .utils.response import success_response, error_response
from .utils.auth import get_user_uuid_from_token

get_current_recipe_info_bp = Blueprint('get_current_recipe_info_bp', __name__)

@get_current_recipe_info_bp.route('/api/get_current_recipe_info/',
                            methods=['POST'])
def get_current_recipe_info():
    data = request.get_json()
    user_token = data.get('user_token')
    device_uuid = data.get('device_uuid')

    if user_token is None or device_uuid is None:
        return error_response(
            message='Please make sure you have filled out all the fields.'
        )

    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return error_response(
            message='Invalid token. Unauthorized.'
        )

    query = datastore_client.query(kind='DeviceHistory',
                                   order=['-date_applied'])
    query.add_filter('device_uuid', '=', device_uuid)
    query_result = list(query.fetch(1))
    if len(query_result) == 0:
        return success_response(
            expired=True
        )

    current_recipe = query_result[0]
    expired = current_recipe['date_expires'] < datetime.now(pytz.utc)
    runtime = get_runtime_description(current_recipe['date_applied'])
    plant_type = get_recipe_plant_type(current_recipe['recipe_uuid'])

    if plant_type is None:
        return error_response(
            message='Error. Server data corruped. Queried recipe doesn\'t'
                    ' exist.'
        )

    return success_response(
        expired=expired,
        runtime=runtime,
        plant_type=plant_type,
        recipe_uuid=current_recipe['recipe_uuid']
    )

def get_runtime_description(date_applied):
    """Returns recipe runtime in human readable form"""
    time_passed = datetime.now(pytz.utc) - date_applied

    description = []
    days_passed = time_passed.days
    if days_passed > 30:
        phrase = number_noun_agreement(int(days_passed / 30), 'month')
        description.append(phrase)
        days_passed %= 30
    if time_passed.days > 7:
        phrase = number_noun_agreement(int(days_passed / 7), 'week')
        description.append(phrase)
        days_passed %= 7
    if days_passed > 0:
        phrase = number_noun_agreement(days_passed, 'day')
        description.append(phrase)

    if description:
        return ', '.join(description)

    # No description (recipe has been running for less than a day)
    # A day has 86400 seconds, an hour as 3600 seconds
    seconds_passed = time_passed.seconds - time_passed.days * 86400
    hours_passed = int(seconds_passed / 3600)
    if hours_passed > 0:
        return number_noun_agreement(hours_passed, 'hour')

    # Running for less than an hour
    minutes_passed = int(seconds_passed / 60)
    return number_noun_agreement(minutes_passed, 'minute')

def number_noun_agreement(number, word):
    """Make phrase with a plural or singular noun based on the number

    number_noun_agreement(5, 'day') returns '5 days'
    """
    if number > 1 or number == 0:
        return f'{number} {word}s'
    elif number == 1:
        return f'{number} {word}'
    return ''

def get_recipe_plant_type(recipe_uuid):
    recipe_query = datastore_client.query(kind='Recipes')
    recipe_query.add_filter('recipe_uuid', '=', recipe_uuid)
    result = list(recipe_query.fetch(1))
    if not result:
        return None

    recipe_state = json.loads(result[0]['recipe'])
    plant_type = recipe_state['cultivars'][0]['name']

    # Usually the name is in the format 'name/variety'
    if '/' in plant_type:
        plant_type = plant_type.split('/', maxsplit=1)[0]
    return plant_type
