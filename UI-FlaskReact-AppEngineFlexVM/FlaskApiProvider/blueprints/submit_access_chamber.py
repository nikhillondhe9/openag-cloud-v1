from flask import Blueprint, request
import json

from .utils.env_variables import datastore_client
from .utils.response import (success_response, error_response)
from .utils.auth import get_user_uuid_from_token
from . import utils
from google.cloud import datastore
from datetime import datetime

submit_access_chamber_bp = Blueprint('submit_access_chamber', __name__)

@submit_access_chamber_bp.route('/api/submit_access_chamber/', methods=['POST'])
def submit_access_chamber():
    received_form_response = json.loads(request.data.decode('utf-8'))
    user_token = received_form_response.get('user_token')
    device_uuid = received_form_response.get('device_uuid')

    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return error_response(
            message='Invalid User: Unauthorized.'
        )


    # Add the user to the users kind of entity
    key = datastore_client.key('ChamberAccess')
    # Indexes every other column except the description
    chamber_access_reg = datastore.Entity(key, exclude_from_indexes=[])

    chamber_access_reg.update({
        'device_uuid': device_uuid,
        "modified_at":datetime.now()
    })

    datastore_client.put(chamber_access_reg)

    return success_response(
        message="Chamberlog access submitted"
    )


