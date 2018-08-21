
from flask import Blueprint
from flask import Response
from flask import request

from .utils.env_variables import *
from .utils.response import success_response, error_response
from .utils.env_variables import datastore_client
from google.cloud import datastore

postdiscourse_bp = Blueprint('postdiscourse_bp',__name__)

@postdiscourse_bp.route('/api/postdiscourse/', methods=['GET', 'POST'])
def postdiscourse():
    received_form_response = json.loads(request.data.decode('utf-8'))
    current_date = datetime.utcnow()
    user_uuid = received_form_response.get("user_uuid", "Error")
    post_id = received_form_response.get("post_id", "Error")
    # Add the user to the users kind of entity
    key = datastore_client.key('ForumQuestions')
    # Indexes every other column except the description
    device_reg_task = datastore.Entity(key, exclude_from_indexes=[])

    device_reg_task.update({
        'user_uuid': user_uuid,
        'post_id': post_id,
        'current_date': current_date
    })

    datastore_client.put(device_reg_task)

    return success_response(
        message="success"
    )

@postdiscourse_bp.route('/api/get_user_discourse_posts/', methods=['GET', 'POST'])
def get_user_discourse_posts():
    received_form_response = json.loads(request.data.decode('utf-8'))
    current_date = datetime.utcnow()
    user_uuid = received_form_response.get("user_uuid", "Error")
    query = datastore_client.query(kind='ForumQuestions')
    # query.add_filter('user_uuid', '=', user_uuid)
    query_results = list(query.fetch())

    devices = []
    for device in query_results:
        devices.append(
            {
                "post_id":device["post_id"],
                "current_date":str(device["current_date"])
            }
        )

    return success_response(
        message="success",
        results=devices
    )