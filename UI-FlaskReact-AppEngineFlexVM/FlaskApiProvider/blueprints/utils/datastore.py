from .env_variables import datastore_client

def get_one(kind, key, value):
    query = datastore_client.query(kind=kind)
    query.add_filter(key, '=', value)
    result = list(query.fetch(1))

    if not result:
        return None

    return result[0]


def get_by_key( kind, key ):
    _key = datastore_client.key( kind, key )
    _ent = datastore_client.get( _key ) 
    if not _ent: 
        return None
    return _ent
