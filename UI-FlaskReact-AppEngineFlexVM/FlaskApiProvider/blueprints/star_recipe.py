from flask import Blueprint, request

from .utils.response import (unauthorized_response, success_response,
                             error_response)
from .utils.auth import get_user_uuid_from_token
from .utils.env_variables import datastore_client
from . import utils

star_recipe_bp = Blueprint('star_recipe_bp', __name__)

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

@star_recipe_bp.route('/api/star_recipe/', methods=['POST'])
def star_recipe():
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
    starred_recipes = user.get('starred_recipes')
    if starred_recipes is None:
        user['starred_recipes'] = [recipe_uuid]
    else:
        if recipe_uuid not in starred_recipes:
            starred_recipes.append(recipe_uuid)

    datastore_client.put(user)
    return success_response(
        message='Successfully starred recipe {}'.format(recipe_uuid)
    )

@star_recipe_bp.route('/api/unstar_recipe/', methods=['POST'])
def unstar_recipe():
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
    starred_recipes = user.get('starred_recipes')
    if not starred_recipes or recipe_uuid not in starred_recipes:
        return error_response(
            message='User did not star this recipe.'
        )

    starred_recipes.remove(recipe_uuid)
    datastore_client.put(user)
    return success_response(
        message='Successfully unstarred recipe {}'.format(recipe_uuid)
    )
