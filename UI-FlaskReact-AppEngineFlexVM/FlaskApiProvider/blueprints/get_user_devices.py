from flask import Blueprint
from flask import Response
from flask import request

from .utils.env_variables import *
from .utils.response import (success_response, error_response,
                             pre_serialize_device)
from .utils.auth import get_user_uuid_from_token
from .utils.common import is_expired
from . import utils

get_user_devices_bp = Blueprint('get_user_devices_bp',__name__)

@get_user_devices_bp.route('/api/get_user_devices/', methods=['GET', 'POST'])
def get_user_devices():
    print("Fetching all the user devices")

    received_form_response = json.loads(request.data.decode('utf-8'))
    user_token = received_form_response.get("user_token", None)
    if user_token is None:
        return error_response(
            message="Please make sure you have added values for all the fields"
        )

    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return error_response(
            message="Invalid User: Unauthorized"
        )

    devices = get_devices_for_user(user_uuid)

    if not devices:
        return error_response(
            message="No devices associated with user."
        )

    return success_response(
        results=devices
    )

def get_devices_for_user(user_uuid):
    query = datastore_client.query(kind='Devices')
    query.add_filter('user_uuid', '=', user_uuid)
    query_results = list(query.fetch())

    devices = []
    for device in query_results:
        device['permission'] = 'control'
        device['peripherals'] = get_device_type_peripherals(device['device_type'])
        device_json = pre_serialize_device(device)
        print('    {}, {}, {}'.format(
            device_json['device_uuid'],
            device_json['device_reg_no'],
            device_json['device_name']
        ))
        devices.append(device_json)

    devices_from_access_codes = get_access_code_devices_for_user(user_uuid)
    devices.extend(devices_from_access_codes)
    return devices

def get_access_code_devices_for_user(user_uuid):
    """Returns a set of devices associated with the user's access codes"""
    access_codes = get_acccess_codes(user_uuid)

    devices = []
    for code in access_codes:
        code_entity = utils.datastore.get_one(
            kind="UserAccessCodes", key='code', value=code
        )

        if is_expired(code_entity['expiration_date']):
            continue

        devices.extend(get_devices_from_code_entity(code_entity))

    return devices

def get_acccess_codes(user_uuid):
    user = utils.datastore.get_one(
        kind='Users', key='user_uuid', value=user_uuid
    )

    access_codes = user.get('access_codes', [])
    return access_codes

def get_devices_from_code_entity(code_entity):
    devices = []

    # In case the entity doesn't have the property 'code_permissions',
    # set it to an empty array
    permissions = json.loads(code_entity.get('code_permissions', '[]'))
    for entry in permissions:
        device = utils.datastore.get_one(
            kind='Devices', key='device_uuid', value=entry['device_uuid']
        )
        if not device:
            continue

        device['permission'] = entry['permission']
        devices.append(pre_serialize_device(device))

    return devices


def get_device_type_peripherals(device_type):
    peripherals = ""
    device_type_query = datastore_client.query(kind="DeviceType")
    device_type_query.add_filter("name","=",device_type)
    device_type_results = list(device_type_query.fetch())
    if len(device_type_results) > 0:
        peripherals = device_type_results[0]["peripherals"]

    return peripherals
