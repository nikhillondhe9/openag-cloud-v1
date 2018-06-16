from flask import Blueprint, request
from werkzeug.utils import secure_filename
import json

from .utils.env_variables import storage_client, datastore_client
from .utils.response import success_response, error_response

ALLOWED_EXTENSIONS = set(['jpg', 'jpeg', 'png'])
def is_allowed(filename):
    if not '.' in filename:
        return False
    else:
        extension = filename.rsplit('.', 1)[1].lower()

    return extension in EXTENSIONS

upload_images_bp = Blueprint('upload_images_bp', __name__)

@upload_images_bp.route('/api/upload_images/', methods=['POST'])
def upload_images():
    if 'file' not in request.files:
        return error_response(
            message='No file uploaded.'
        )

    image = request.files['file']

    if not is_allowed(image.filename):
        return error_response(
            message='File type not allowed.'
        )

    filename = secure_filename(image.filename)
    upload_file(image.read(), filename, image.content_type)

    return success_response(
        message='File saved.'
    )

def upload_file(file_stream, filename, content_type):
    bucket = storage_client.bucket('openag-user-images')
    blob = bucket.blob(filename)
    blob.upload_from_string(file_stream, content_type=content_type)
    return blob.public_url
