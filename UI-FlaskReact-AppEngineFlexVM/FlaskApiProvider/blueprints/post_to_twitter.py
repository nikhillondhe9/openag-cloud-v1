from flask import Blueprint
from flask import Response
from flask import request
import requests
from .utils.env_variables import *
from .utils.response import success_response, error_response
import os
posttwitter_bp = Blueprint('posttwitter_bp', __name__)


@posttwitter_bp.route('/api/posttwitter/', methods=['GET', 'POST'])
def posttwitter():
    received_form_response = json.loads(request.data.decode('utf-8'))
    current_date = datetime.utcnow()
    user_uuid = received_form_response.get("user_uuid", "Error")
    message = received_form_response.get("message","Failed")
    image_src = received_form_response.get("image_url","")
    filename = "temp.png"
    request_url = requests.get(image_src, stream=True)
    print(image_src)
    if request_url.status_code == 200:
        with open(filename, 'wb') as image:
            for chunk in request_url:
                image.write(chunk)

        query = datastore_client.query(kind='Users')
        query.add_filter('user_uuid', '=', user_uuid)
        user = list(query.fetch(1))[0]
        api.update_with_media(filename, '{} from #{}'.format(message,user.get('organization')))
        os.remove(filename)
        return success_response(
                message="success"
            )
    else:
        return error_response(message="Image could not be retrieved")

