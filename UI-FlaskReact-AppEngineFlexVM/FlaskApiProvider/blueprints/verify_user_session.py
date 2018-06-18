from flask import Blueprint
from flask import Response
from flask import request
import json
from datetime import datetime, timezone

from .utils.env_variables import datastore_client
from .utils.response import success_response, error_response

verify_user_session_bp = Blueprint('verify_user_session_bp',__name__)

@verify_user_session_bp.route('/api/verify_user_session/', methods=['GET', 'POST'])
def verify_user_session():
    received_form_response = json.loads(request.data.decode('utf-8'))
    user_token = received_form_response.get("user_token", None)
    query_session = datastore_client.query(kind="UserSession")
    query_session.add_filter('session_token', '=', user_token)
    query_session_result = list(query_session.fetch())
    is_expired = True
    user_uuid = None
    if len(query_session_result) > 0:
        user_uuid = query_session_result[0].get("user_uuid", None)
        session_expiration = query_session_result[0].get("expiration_date", None)
        datenow = datetime.now(timezone.utc)
        if session_expiration > datenow:
            is_expired = False

    return success_response(
        message="Successful",
        is_expired=is_expired,
        user_uuid=user_uuid
    )
