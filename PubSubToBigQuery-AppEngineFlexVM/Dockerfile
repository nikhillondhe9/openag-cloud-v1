# [START dockerfile]

#debugrob, delete below?
#FROM google/python
FROM gcr.io/google_appengine/python

#debugrob: how to specify python 3 by default?  is it being done by app.yaml?

RUN pip install --upgrade pip
RUN pip install --upgrade google-api-python-client
RUN pip install python-dateutil

#debugrob: not needed, delete later
#ADD twitter-to-pubsub.py /twitter-to-pubsub.py
#ADD controller.py /controller.py

# add copies files to the docker filesystem image at the specified path
ADD pubsub-to-bigquery.py /pubsub-to-bigquery.py
# utils library 
ADD utils.py /utils.py

#CMD python controller.py
# run our application
CMD python pubsub-to-bigquery.py 

# [END dockerfile]
