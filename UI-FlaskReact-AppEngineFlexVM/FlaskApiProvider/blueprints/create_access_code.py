from datetime import timedelta

from flask import Blueprint
from flask import Response
from flask import request
from google.cloud import datastore

from .utils.env_variables import *
from .utils.response import success_response, error_response

create_new_code_bp = Blueprint('create_new_code_bp',__name__)

@create_new_code_bp.route('/api/create_new_code/', methods=['GET', 'POST'])
def create_new_code():
    received_form_response = json.loads(request.data.decode('utf-8'))
    user_token = received_form_response.get("user_token", None)
    query_session = datastore_client.query(kind="UserSession")
    query_session.add_filter('session_token', '=', user_token)
    query_session_result = list(query_session.fetch())

    user_uuid = None
    if len(query_session_result) > 0:
        user_uuid = query_session_result[0].get("user_uuid", None)

    if user_uuid is None:
        return error_response(
            message="Invalid User: Unauthorized"
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
        'code': generated_code
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
