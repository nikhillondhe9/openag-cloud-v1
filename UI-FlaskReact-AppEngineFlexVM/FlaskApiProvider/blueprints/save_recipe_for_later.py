from flask import Blueprint, request

from .utils.response import (unauthorized_response, success_response,
                             error_response)
from .utils.auth import get_user_uuid_from_token
from .utils.env_variables import datastore_client
from . import utils

save_for_later_bp = Blueprint('save_for_later_bp', __name__)

def recipe_exists(recipe_uuid):
    return utils.datastore.get_one(
        kind='Recipes', key='recipe_uuid', value=recipe_uuid
    ) is not None

def check_recipe_uuid(recipe_uuid):
    if recipe_uuid is None:
        return error_response(
            message='Please make sure recipe_uuid is submitted.'
        )

    if not recipe_exists(recipe_uuid):
        return error_response(
            message='The submitted recipe_uuid doesn\'t belong to any recipe.'
        )

@save_for_later_bp.route('/api/save_for_later/', methods=['POST'])
def save_recipe():
    data = request.get_json()
    user_token = data.get('user_token')
    recipe_uuid = data.get('recipe_uuid')

    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return unauthorized_response
    response = check_recipe_uuid(recipe_uuid)
    if response is not None:
        return response

    user = utils.datastore.get_one(
        kind='Users', key='user_uuid', value=user_uuid
    )
    saved_recipes = user.get('saved_recipes')
    if saved_recipes is None:
        user['saved_recipes'] = [recipe_uuid]
    else:
        if recipe_uuid not in saved_recipes:
            saved_recipes.append(recipe_uuid)

    datastore_client.put(user)
    return success_response(
        message='Successfully saved recipe {}'.format(recipe_uuid)
    )

@save_for_later_bp.route('/api/unsave_for_later/', methods=['POST'])
def unsave_recipe():
    data = request.get_json()
    user_token = data.get('user_token')
    recipe_uuid = data.get('recipe_uuid')

    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return unauthorized_response

    response = check_recipe_uuid(recipe_uuid)
    if response is not None:
        return response

    user = utils.datastore.get_one(
        kind='Users', key='user_uuid', value=user_uuid
    )
    saved_recipes = user.get('saved_recipes')
    if not saved_recipes or recipe_uuid not in saved_recipes:
        return error_response(
            message='User did not save this recipe.'
        )

    saved_recipes.remove(recipe_uuid)
    datastore_client.put(user)
    return success_response(
        message='Successfully unsaved recipe {}'.format(recipe_uuid)
    )
