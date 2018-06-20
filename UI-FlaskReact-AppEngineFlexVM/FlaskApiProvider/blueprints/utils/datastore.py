from .env_variables import datastore_client

def get_one(kind, key, value):
    query = datastore_client.query(kind=kind)
    query.add_filter(key, '=', value)
    result = list(query.fetch(1))

    if not result:
        return None

    return result[0]
