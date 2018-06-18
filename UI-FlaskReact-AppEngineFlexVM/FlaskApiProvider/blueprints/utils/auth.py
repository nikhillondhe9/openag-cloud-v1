from .env_variables import *

def get_user_uuid_from_token(user_token):
    """Verifies session and returns user uuid"""

    query_session = datastore_client.query(kind="UserSession")
    query_session.add_filter('session_token', '=', user_token)
    query_session_result = list(query_session.fetch())

    if not query_session_result:
        return None

    uuid = query_session_result[0].get("user_uuid", None)
    return uuid
