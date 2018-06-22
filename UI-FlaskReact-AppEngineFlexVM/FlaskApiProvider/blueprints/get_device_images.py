from flask import Blueprint, request

from . import utils
from .utils.env_variables import datastore_client
from .utils.auth import get_user_uuid_from_token
from .utils.response import success_response, error_response

get_device_images_bp = Blueprint('get_device_images_bp', __name__)

@get_device_images_bp.route('/api/get_device_images/', methods=['POST'])
def get_device_images():
    """Returns all images associated with device.

    Params:
    - user_token
    - device_uuid
    """
    parameters = request.get_json()

    user_token = parameters.get('user_token')
    user_uuid = get_user_uuid_from_token(user_token)
    if user_uuid is None:
        return error_response(
            message='Invalid token. Unauthorized.'
        )

    device_uuid = parameters.get('device_uuid')
    if device_uuid is None:
        return error_response(
            message='No device_uuid submitted.'
        )

    # Sort by date descending and take the first 50
    # This is equivalent to taking the most recent 50 images
    # Then, reverse the order so it's chronological
    image_query = datastore_client.query(kind="Images",
                                         order=['-creation_date'])
    image_query.add_filter('device_uuid', '=', device_uuid)
    images = list(image_query.fetch(100))[::-1]

    if not images:
        return error_response(
            message='No images associated with device.'
        )

    image_urls = list(map(decode_url, images))

    return success_response(
        image_urls=image_urls
    )

def decode_url(image_entity):
    url = image_entity['URL']

    # In case the url is stored as a blob (represented in python by a
    # bytes object), decode it into a string.
    try:
        url = url.decode('utf-8')
    except AttributeError:
        pass

    return url
