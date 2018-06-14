from flask import Blueprint
from flask import Response
from flask import request

from .env_variables import *

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
        datenow = datetime.now()
        if session_expiration > datenow:
            is_expired = False

    data = json.dumps({
        "response_code": 200,
        "message": "Successful",
        "is_expired": is_expired
    })
    return Response(data, status=200, mimetype='application/json')


