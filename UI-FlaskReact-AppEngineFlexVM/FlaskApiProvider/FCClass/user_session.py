from google.cloud import datastore
from datetime import datetime,timedelta
import uuid

class UserSession:
    def __init__(self, user_uuid):
        self.user_uuid = user_uuid
        self.session_token = str(uuid.uuid4())
        self.created_date = datetime.now()
        self.expiration_date = self.created_date + timedelta(hours=24)


    def insert_into_db(self,client):
        key = client.key('UserSession')
        session_insert_task = datastore.Entity(key, exclude_from_indexes=[])
        session_insert_task.update({
            'user_uuid': self.user_uuid,
            'session_token': self.session_token,
            'created_date': self.created_date,
            'expiration_date': self.expiration_date
        })

        client.put(session_insert_task)

        if session_insert_task.key:
            return self.session_token


