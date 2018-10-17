import uuid

from flask import Blueprint
from flask import Response
from flask import request
from google.cloud import datastore

from .utils.env_variables import *
from .utils.response import success_response, error_response
from .utils.auth import get_user_uuid_from_token

daily_horticulture_measurements_bp = Blueprint('daily_horticulture_measurements_bp', __name__)


@daily_horticulture_measurements_bp.route('/api/daily_horticulture_measurements/', methods=['GET', 'POST'])
def save_recipe():
    received_form_json = json.loads(request.data.decode('utf-8'))
    device_uuid = received_form_json.get("device_uuid", None)
    plant_height = received_form_json.get("plant_height", "")
    leaf_count = received_form_json.get("leaf_count", "")
    leaf_colors = received_form_json.get("leaf_colors", "")
    leaf_withering = received_form_json.get("leaf_withering", "")
    flavors = received_form_json.get("flavors", "")
    root_colors = received_form_json.get("root_colors", "")
    horticulture_notes = received_form_json.get("horticulture_notes", "")
    submission_name = received_form_json.get("submission_name", "")
    print(received_form_json)
    if device_uuid is None:
        return error_response(
            message="Please make sure you have added values for all the fields"
        )

    # Add the user to the users kind of entity
    key = datastore_client.key('DailyHorticultureLog')
    # Indexes every other column except the description
    horticulture_task = datastore.Entity(key, exclude_from_indexes=[])

    horticulture_task.update({
        "device_uuid": device_uuid,
        "plant_height":str(plant_height),
        "leaf_count": str(leaf_count),
        "leaf_colors": ",".join(x for x in leaf_colors),
        "leaf_withering":  ",".join(x for x in leaf_withering),
        "flavors": ",".join(x for x in flavors),
        "root_colors": ",".join(x for x in root_colors),
        "horticulture_notes": str(horticulture_notes),
        "submission_name": str(submission_name),
        "submitted_at": datetime.now(),
    })

    datastore_client.put(horticulture_task)

    if horticulture_task.key:
        return success_response()

    else:
        return error_response(
            message="Sorry something failed. Womp womp!"
        )
