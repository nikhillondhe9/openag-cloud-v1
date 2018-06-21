from datetime import timedelta

from flask import Blueprint
from flask import Response
from flask import request
from google.cloud import datastore

from .utils.env_variables import *
from .utils.response import success_response, error_response
from .utils.auth import get_user_uuid_from_token
from . import utils

create_new_code_bp = Blueprint('create_new_code_bp',__name__)

@create_new_code_bp.route('/api/create_new_code/', methods=['GET', 'POST'])
def create_new_code():
    received_form_response = json.loads(request.data.decode('utf-8'))
    user_token = received_form_response.get("user_token", None)

    user_entity = utils.datastore.get_one(
        kind='Users', key='user_token', value=user_token
    )
    if user_entity is None:
        return error_response(
            message="Invalid User: Unauthorized"
        )

    permissions = received_form_response.get('permissions', '[]')
    if not authorize_user_for_permissions(user_entity, permissions):
        return error_response(
            message='User not allowed to create code with given permissions.'
        )

    generated_code = id_generator()
    # Add the user to the users kind of entity
    key = datastore_client.key('UserAccessCodes')
    # Indexes every other column except the description
    access_code_reg = datastore.Entity(key, exclude_from_indexes=[])

    access_code_reg.update({
        'user_uuid': user_uuid,
        'created_date': datetime.now(),
        'expiration_date': datetime.now() + timedelta(hours=24),
        'code': generated_code,
        'code_permissions': permissions
    })

    datastore_client.put(access_code_reg)

    if access_code_reg.key:
        return success_response(
            code=generated_code
        )

    else:
        return error_response(
            message="Sorry something failed. Womp womp!"
        )

def authorize_user_for_permissions(user_entity, permissions):
    """Check if user is allowed to grant the given permissions"""
    permissions = json.loads(permissions)
    for permission in permissions:
        device_entity = utils.datastore.get_one(
            kind='Devices', key='device_uuid', value=permission['device_uuid']
        )
        if device_entity['user_uuid'] != user_entity['user_uuid']:
            return False
    return True
