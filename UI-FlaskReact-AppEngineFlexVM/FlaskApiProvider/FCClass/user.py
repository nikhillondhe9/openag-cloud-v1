from passlib.hash import pbkdf2_sha256
from google.cloud import datastore
from datetime import datetime
import uuid

class User:
    def __init__(self, username,password, email_address=None,organization=None):
        self.username = username
        self.email_address = email_address
        self.organization = organization
        self.password = password
        self.user_uuid = str(uuid.uuid4())
        self.encrypted_password = pbkdf2_sha256.hash(password)

    def insert_into_db(self,client):
        key = client.key('Users')
        signup_task = datastore.Entity(key, exclude_from_indexes=[])
        signup_task.update({
            'username': self.username,
            'email_address': self.email_address,
            'password': self.encrypted_password,
            'date_added': datetime.now(),
            'organization': self.organization,
            'user_uuid':self.user_uuid,
            'is_verified': True
        })

        client.put(signup_task)

        if signup_task.key:
            return self.user_uuid

    def login_user(self,client):
        query = client.query(kind='Users')
        query.add_filter('username', '=', self.username)
        query_result = list(query.fetch(1))
        if not query_result:
            return None, None
        user = query_result[0]

        if not pbkdf2_sha256.verify(self.password, user.get('password', '')):
            return None, None

        user_uuid = user.get('user_uuid')
        is_admin = user.get('is_admin', False)
        return user_uuid, is_admin
