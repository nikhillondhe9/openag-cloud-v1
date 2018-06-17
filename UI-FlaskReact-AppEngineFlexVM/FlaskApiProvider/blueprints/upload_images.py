from flask import Blueprint, request
import json
import time

from .utils.env_variables import storage_client, datastore_client
from .utils.response import success_response, error_response
from .utils.auth import get_user_uuid_from_token

ALLOWED_EXTENSIONS = set(['jpg', 'jpeg', 'png'])
def is_allowed(filename):
    if not '.' in filename:
        return False
    else:
        extension = filename.rsplit('.', 1)[1].lower()

    return extension in ALLOWED_EXTENSIONS

upload_images_bp = Blueprint('upload_images_bp', __name__)

GOOGLE_CLOUD_STORAGE_BUCKETS = {
    'user': 'openag-user-images'
}
@upload_images_bp.route('/api/upload_images/', methods=['POST'])
def upload_images():
    image = request.files.get('file')
    if not image:
        return error_response(
            message='No file uploaded.'
        )

    if not is_allowed(image.filename):
        return error_response(
            message='File type not allowed.'
        )

    upload_type = request.form.get('type')
    if upload_type not in GOOGLE_CLOUD_STORAGE_BUCKETS:
        return error_response(
            message="Type must be one of {}"
                .format(list(GOOGLE_CLOUD_STORAGE_BUCKETS.keys()))
        )

    if upload_type == 'user':
        user_token = request.form.get('user_token')
        user_uuid = get_user_uuid_from_token(user_token)
        if user_uuid is None:
            return error_response(
                message='Invalid User: Unauthorized'
            )

        bucket = GOOGLE_CLOUD_STORAGE_BUCKETS[upload_type]
        filename = "{}-{}".format(user_uuid, str(int(time.time())))
        url = upload_file(image.read(), filename, image.content_type, bucket)
        set_profile_picture(user_uuid, url)

        return success_response(
            message='File saved.',
            url=url
        )

def upload_file(file_stream, filename, content_type, bucket):
    bucket = storage_client.bucket(bucket)
    blob = bucket.blob(filename)
    blob.upload_from_string(file_stream, content_type=content_type)
    blob.make_public()
    return blob.public_url

def set_profile_picture(user_uuid, picture_url):
    query = datastore_client.query(kind='Users')
    query.add_filter('user_uuid', '=', user_uuid)
    user = list(query.fetch(1))[0]

    user['profile_image'] = picture_url
    datastore_client.put(user)
