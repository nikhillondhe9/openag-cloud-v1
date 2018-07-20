from flask import Blueprint, request
import json

from .utils.env_variables import datastore_client
from .utils.response import success_response, error_response
from .utils.auth import get_user_uuid_from_token

save_user_profile_bp = Blueprint('save_user_profile_bp', __name__)

@save_user_profile_bp.route('/api/save_user_profile_changes/', methods=['POST'])
def save_user_profile_changes():
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

    # This checks if inputs are empty strings as well.
    user['email_address'] = get_non_empty(received_form_response,
                                          'email_address',
                                          user['email_address'])
    user['username'] = get_non_empty(received_form_response,
                                     'username',
                                     user['username'])
    user['organization'] = get_non_empty(received_form_response,
                                         'organization',
                                         user['organization'])

    datastore_client.put(user)
    return success_response(
        profile_image=user.get('profile_image'),
        username=user.get('username'),
        email_address=user.get('email_address'),
        organization=user.get('organization')
    )

def get_non_empty(form_input, key, default):
    """dict.get that replaces empty strings with the default value as well"""
    value = form_input.get(key, default)
    if not value:
        value = default
    return default
