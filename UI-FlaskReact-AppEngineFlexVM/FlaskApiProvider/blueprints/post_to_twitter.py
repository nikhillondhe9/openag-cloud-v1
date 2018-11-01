from flask import Blueprint
from flask import Response
from flask import request
import requests
from .utils.env_variables import *
from .utils.response import success_response, error_response

from .utils.auth import get_user_uuid_from_token
import os
posttwitter_bp = Blueprint('posttwitter_bp', __name__)


@posttwitter_bp.route('/api/posttwitter/', methods=['GET', 'POST'])
def posttwitter():
    received_form_response = json.loads(request.data.decode('utf-8'))
    current_date = datetime.utcnow()
    user_token = received_form_response.get("user_token", None)
    if user_token is None:
        print("get_user_devices: No user token in form response")
        return error_response(
            message="Please make sure you have added values for all the fields"
        )

    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        print("get_user_devices: No user uuid")
        return error_response(
            message="Invalid User: Unauthorized"
        )

    message = received_form_response.get("message","Failed")
    image_src = received_form_response.get("image_url","")
    filename = "temp.png"
    try:
        request_url = requests.get(image_src, stream=True)
    except:
        request_url = None
    if request_url and request_url.status_code == 200:
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
        query = datastore_client.query(kind='Users')
        query.add_filter('user_uuid', '=', user_uuid)
        user = list(query.fetch(1))[0]
        if message != "":
            api.update_status('{} from #{}'.format(message, user.get('organization')))
        return success_response(message="Image could not be retrieved but posted message")

