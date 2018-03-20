# [START dockerfile]

#debugrob, delete below?
#FROM google/python
FROM gcr.io/google_appengine/python

RUN pip install --upgrade pip
RUN pip install --upgrade google-api-python-client
RUN pip install python-dateutil

# add copies files to the docker filesystem image at the specified path
ADD mqtt-auth.py /mqtt-auth.py
# utils library 
ADD utils.py /utils.py

# run our application
CMD python /mqtt-auth.py 

# [END dockerfile]
