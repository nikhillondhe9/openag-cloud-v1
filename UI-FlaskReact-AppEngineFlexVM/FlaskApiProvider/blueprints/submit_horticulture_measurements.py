from flask import Blueprint, request
import json

from .utils.env_variables import datastore_client
from .utils.response import (success_response, error_response)
from .utils.auth import get_user_uuid_from_token
from . import utils
from google.cloud import datastore
from datetime import datetime
submit_horticulture_measurements_bp = Blueprint('submit_horticulture_measurements', __name__)

@submit_horticulture_measurements_bp.route('/api/submit_horticulture_measurements/', methods=['POST'])
def submit_access_code():
    received_form_response = json.loads(request.data.decode('utf-8'))
    user_token = received_form_response.get('user_token')
    device_uuid = received_form_response.get('device_uuid')

    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return error_response(
            message='Invalid User: Unauthorized.'
        )



    leaves_count = received_form_response.get("leaves_count","")
    plant_height = received_form_response.get("plant_height","")

    # Add the user to the users kind of entity
    key = datastore_client.key('HorticultureMeasurements')
    # Indexes every other column except the description
    horitculture_reg_task = datastore.Entity(key, exclude_from_indexes=[])

    horitculture_reg_task.update({
        'device_uuid': device_uuid,
        'measurement': json.dumps({
            "leaves_count":leaves_count,
            "plant_height":plant_height
        }),
        "modified_at":datetime.now()
    })

    datastore_client.put(horitculture_reg_task)

    return success_response(
        message="The given access code is now associated with your account."
    )


