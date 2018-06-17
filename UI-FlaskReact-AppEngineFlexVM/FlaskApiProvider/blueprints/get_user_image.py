from flask import Blueprint, request
import json

from .utils.env_variables import datastore_client
from .utils.response import success_response, error_response
from .utils.auth import get_user_uuid_from_token

get_user_image_bp = Blueprint('get_user_image_bp', __name__)

@get_user_image_bp.route('/api/get_user_image/', methods=['POST'])
def get_user_image():
    print("Fetching user image")
    received_form_response = json.loads(request.data.decode('utf-8'))

    user_token = received_form_response.get("user_token")
    if user_token is None:
        return error_response(
            message="Please make sure you have added values for all the fields"
        )

    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return error_response(
            message="Invalid User: Unauthorized"
        )

    query = datastore_client.query(kind='Users')
    query.add_filter('user_uuid', '=', user_uuid)
    user = list(query.fetch(1))[0]

    image_url = user.get('profile_image')
    if image_url is None:
        return error_response(
            message='No profile picture found.'
        )

    return success_response(
        url=image_url
    )
