from datetime import datetime, timezone

def is_expired(expiration_date):
    """Returns whether something has expired

    Assumes that expiration_date is an 'aware' datetime object.
    """
    datenow = datetime.now(timezone.utc)
    return datenow > expiration_date
