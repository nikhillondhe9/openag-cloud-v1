from flask import Blueprint
from flask import Response
from flask import request

from .utils.env_variables import *
from .utils.response import success_response, error_response

posttwitter_bp = Blueprint('posttwitter_bp', __name__)


@posttwitter_bp.route('/api/posttwitter/', methods=['GET', 'POST'])
def posttwitter():
    received_form_response = json.loads(request.data.decode('utf-8'))
    current_date = datetime.utcnow()
    user_uuid = received_form_response.get("user_uuid", "Error")
    message = received_form_response.get("message","Failed")
    image_src = "/Users/manvithaponnapati/Downloads/1.png"
    api.update_with_media(image_src, '%s from #OpenAgTestComputer' % (message))

    return success_response(
        message="success"
    )
