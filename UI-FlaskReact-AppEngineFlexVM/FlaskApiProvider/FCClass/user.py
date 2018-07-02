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
        query_result = list(query.fetch())

        #The above query should return only one user row back and
        # if the user exists then veriify password and return the uuid of the user
        if len(query_result) == 1:
            if pbkdf2_sha256.verify(self.password, query_result[0]['password']):
                return query_result[0]['user_uuid'],query_result[0]['is_admin']


