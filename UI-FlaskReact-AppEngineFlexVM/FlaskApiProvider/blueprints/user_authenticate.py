from FCClass.user import User
from FCClass.user_session import UserSession
from flask import Response
from flask import request
from flask import Blueprint
from .env_variables import *

user_authenticate = Blueprint('user_authenticate', __name__)


@user_authenticate.route('/api/signup/', methods=['GET', 'POST'])
def signup():
    received_form_response = json.loads(request.data.decode('utf-8'))
    username = received_form_response.get("username", None)
    email_address = received_form_response.get("email_address", None)
    password = received_form_response.get("password", None)
    organization = received_form_response.get("organization", None)

    if username is None or email_address is None or password is None:
        result = Response({"message": "Please make sure you have added values for all the fields"}, status=500,
                          mimetype='application/json')
        return result

    user_uuid = User(username=username, password=password, email_address=email_address,
                     organization=organization).insert_into_db(datastore_client)

    if user_uuid:
        data = json.dumps({
            "response_code": 200
        })

        result = Response(data, status=200, mimetype='application/json')

    else:
        data = json.dumps({
            "message": "Sorry something failed. Womp womp!"
        })
        result = Response(data, status=500, mimetype='application/json')

    return result


@user_authenticate.route('/login/', methods=['GET', 'POST'])
def login():
    received_form_response = json.loads(request.data.decode('utf-8'))

    username = received_form_response.get("username", None)
    password = received_form_response.get("password", None)

    if username is None or password is None:
        result = Response({"message": "Please make sure you have added values for all the fields"}, status=500,
                          mimetype='application/json')
        return result

    user_uuid = User(username=username, password=password).login_user(client=datastore_client)
    if user_uuid:
        session_token = UserSession(user_uuid=user_uuid).insert_into_db(client=datastore_client)
        data = json.dumps({
            "response_code": 200,
            "user_uuid": user_uuid,
            "user_token": session_token,
            "message": "Login Successful"
        })
        result = Response(data, status=200, mimetype='application/json')
    else:
        data = json.dumps({
            "response_code": 500,
            "message": "Login failed. Please check your credentials"
        })
        result = Response(data, status=500, mimetype='application/json')
    return result
