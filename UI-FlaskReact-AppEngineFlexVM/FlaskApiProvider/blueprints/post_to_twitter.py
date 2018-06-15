
from flask import Blueprint
from flask import Response
from flask import request

from .env_variables import *

posttwitter_bp = Blueprint('posttwitter_bp',__name__)

@posttwitter_bp.route('/api/posttwitter/', methods=['GET', 'POST'])
def posttwitter():
    received_form_response = json.loads(request.data.decode('utf-8'))
    current_date = datetime.utcnow()
    user_uuid = received_form_response.get("user_uuid", "Error")
    api.update_status('Food computer status for %s on %s' % (user_uuid, str(current_date)))
    data = {
        "message": "success"
    }
    result = Response(json.dumps(data), status=500, mimetype='application/json')
    return result