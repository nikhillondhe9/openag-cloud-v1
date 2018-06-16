from flask import Blueprint
from flask import Response
from flask import request
from google.cloud import datastore

from .utils.env_variables import *
from .utils.response import success_response, error_response
from .utils.auth import get_user_uuid_from_token

register_bp = Blueprint('register_bp',__name__)

# ------------------------------------------------------------------------------
# api.update_status('Test status')
@register_bp.route('/api/register/', methods=['GET', 'POST'])
def register():
    received_form_response = json.loads(request.data.decode('utf-8'))

    user_token = received_form_response.get("user_token", None)
    device_name = received_form_response.get("device_name", None)
    device_reg_no = received_form_response.get("device_reg_no", None)
    device_notes = received_form_response.get("device_notes", None)
    device_type = received_form_response.get("device_type", None)
    time_stamp = datetime.now()

    if user_token is None or device_reg_no is None:
        return error_response(
            message="Please make sure you have added values for all the fields"
        )

    if device_type is None:
        device_type = 'EDU'

    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return error_response(
            message="Invalid User: Unauthorized"
        )

    # Create a google IoT device registry entry for this device.
    # The method returns the device ID we need for IoT communications.
    device_uuid = create_iot_device_registry_entry(device_reg_no,
                                                   device_name, device_notes, device_type, user_uuid)
    if None == device_uuid:
        return error_response(
            message="Could not register this IoT device."
        )

    # Add the user to the users kind of entity
    key = datastore_client.key('Devices')
    # Indexes every other column except the description
    device_reg_task = datastore.Entity(key, exclude_from_indexes=[])

    device_reg_task.update({
        'device_uuid': device_uuid,
        'device_name': device_name,
        'device_reg_no': device_reg_no,
        'device_notes': device_notes,
        'user_uuid': user_uuid,
        'device_type': device_type,
        'registration_date': time_stamp
    })

    datastore_client.put(device_reg_task)

    if device_reg_task.key:
        return success_response()

    else:
        return error_response(
            message="Sorry something failed. Womp womp!"
        )
