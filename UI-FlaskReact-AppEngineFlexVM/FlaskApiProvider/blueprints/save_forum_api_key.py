from flask import Blueprint, request
import json

from .utils.env_variables import datastore_client
from .utils.response import (success_response, error_response)
from .utils.auth import get_user_uuid_from_token
from .utils.common import is_expired
from . import utils
from google.cloud import datastore

save_forum_api_key_bp = Blueprint('save_forum_api_key_bp', __name__)

@save_forum_api_key_bp.route('/api/save_forum_api_key/', methods=['POST'])
def save_forum_api_key():
    received_form_response = json.loads(request.data.decode('utf-8'))
    user_token = received_form_response.get('user_token')
    discourse_key = received_form_response.get('discourse_key')

    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return error_response(
            message='Invalid User: Unauthorized.'
        )

    # Add the user to the users kind of entity
    key = datastore_client.key('DiscourseKeys')
    # Indexes every other column except the description
    discourse_key_task = datastore.Entity(key, exclude_from_indexes=[])

    discourse_key_task.update({
            'user_uuid': user_uuid,
            'discourse_key': discourse_key
        })

    datastore_client.put(discourse_key_task)

    if discourse_key_task.key:
        return success_response(message="The given key now associated with your account.")

    else:
        return error_response(
            message="Sorry something failed. Womp womp!"
        )

