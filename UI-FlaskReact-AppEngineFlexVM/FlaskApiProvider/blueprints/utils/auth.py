from .env_variables import *
from .datastore import get_one

def get_user_uuid_from_token(user_token):
    """Verifies session and returns user uuid"""

    session = get_one(
        kind="UserSession", key="session_token", value=user_token
    )
    if not session:
        return None

    uuid = session.get("user_uuid")
    return uuid
