
from flask import Blueprint
from flask import Response
from flask import request

from .utils.env_variables import *
from .utils.response import success_response, error_response
from .utils.auth import get_user_uuid_from_token

posttwitter_bp = Blueprint('posttwitter_bp',__name__)

@posttwitter_bp.route('/api/posttwitter/', methods=['GET', 'POST'])
def posttwitter():
    received_form_response = json.loads(request.data.decode('utf-8'))
    current_date = datetime.utcnow()
    user_token = received_form_response.get("user_token")

    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return error_response(
            message="Invalid token. Unauthorized."
        )

    api.update_status(
        'Food computer status for {} on {}'.format(user_uuid, current_date)
    )

    return success_response(
        message="success"
    )
