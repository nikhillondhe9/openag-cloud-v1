from flask import Response
import json

def error_response(**kwargs):
    kwargs["response_code"] = 500
    return json_response(**kwargs)

def success_response(**kwargs):
    kwargs["response_code"] = 200
    return json_response(**kwargs)

def json_response(**kwargs):
    data = json.dumps(kwargs)
    return Response(data, kwargs["response_code"], mimetype='application/json')

def pre_serialize_device(device_entity):
    """Prepares a device entity for JSON serialization"""

    registration_date = device_entity.get("registration_date", "")
    return {
        'device_uuid': device_entity.get("device_uuid", ""),
        'device_notes': device_entity.get("device_notes", ""),
        'device_type': device_entity.get("device_type", ""),
        'device_reg_no': device_entity.get("device_reg_no", ""),
        'registration_date': registration_date.strftime("%Y-%m-%d %H:%M:%S"),
        'user_uuid': device_entity.get("user_uuid", ""),
        'permissions': device_entity.get("permission", ""),
        'device_name': device_entity.get("device_name", "")
    }
