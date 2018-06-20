from flask import Blueprint, request
import json

from .utils.env_variables import datastore_client
from .utils.response import (success_response, error_response)
from .utils.auth import get_user_uuid_from_token
from .utils.common import is_expired
from . import utils

submit_access_code_bp = Blueprint('submit_access_code_bp', __name__)

@submit_access_code_bp.route('/api/submit_access_code/', methods=['POST'])
def submit_access_code():
    received_form_response = json.loads(request.data.decode('utf-8'))
    user_token = received_form_response.get('user_token')
    access_code = received_form_response.get('access_code')

    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return error_response(
            message='Invalid User: Unauthorized.'
        )

    if access_code is None:
        return error_response(
            message='No access code received.'
        )

    code_entity = utils.datastore.get_one(
        kind='UserAccessCodes', key='code', value=access_code
    )
    if not code_entity:
        return error_response(
            message='The given access code does not exist.'
        )

    if is_expired(code_entity['expiration_date']):
        return error_response(
            message='The given access code has already expired.'
        )

    if code_entity['user_uuid'] == user_uuid:
        return error_response(
            message='You are the one who created this access code.'
        )

    associate_code_with_user(access_code, user_uuid)

    return success_response(
        message="The given access code is now associated with your account."
    )

def associate_code_with_user(access_code, user_uuid):
    user = utils.datastore.get_one(
        kind='Users', key='user_uuid', value=user_uuid
    )

    access_codes = user.get('access_codes', [])
    if access_code not in access_codes:
        access_codes.append(access_code)

    user['access_codes'] = access_codes
    datastore_client.put(user)
