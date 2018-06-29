from flask import Blueprint, request
import json

from .utils.env_variables import datastore_client
from .utils.response import success_response, error_response
from .utils.auth import get_user_uuid_from_token

get_user_info_bp = Blueprint('get_user_info_bp', __name__)

@get_user_info_bp.route('/api/get_user_info/', methods=['POST'])
def get_user_image():
    received_form_response = request.get_json()

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

    return success_response(
        profile_image=user.get('profile_image'),
        username=user.get('username'),
        email_address=user.get('email_address'),
        organization=user.get('organization')
    )
