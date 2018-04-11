from google.cloud import datastore
from datetime import datetime
import uuid

class Device:
    def __init__(self, device_name,device_reg_no,user_uuid,device_type,device_notes=None):
        self.device_uuid = str(uuid.uuid4())
        self.device_name = device_name
        self.device_reg_no = device_reg_no
        self.device_notes = device_notes
        self.user_uuid = user_uuid
        self.device_type = device_type
        self.registration_date = datetime.now()


    def insert_into_db(self,client):
        key = client.key('Device')
        device_reg_task = datastore.Entity(key, exclude_from_indexes=[])
        device_reg_task.update({
            'device_uuid': self.device_uuid,
            'device_name': self.device_name,
            'device_reg_no': self.device_reg_no,
            'device_notes': self.device_notes,
            'user_uuid': self.user_uuid,
            'device_type':self.device_type,
            'registration_date': self.registration_date
        })

        client.put(device_reg_task)
        if device_reg_task.key:
            return self.device_uuid

    def get_all_devices(self,client):
        query = client.query(kind='Users')
        query.add_filter('username', '=', self.username)
        query_result = list(query.fetch())

        #The above query should return only one user row back and
        # if the user exists then veriify password and return the uuid of the user
        if len(query_result) == 1:
            if pbkdf2_sha256.verify(self.password, query_result[0]['password']):
                return query_result[0]['user_uuid']


