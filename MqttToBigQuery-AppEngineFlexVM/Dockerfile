# [START dockerfile]

# This supports py 2 or 3 (we want 3)
FROM gcr.io/google_appengine/python

# Only use Python 3 in this VM
RUN virtualenv /env -p python3.6

# Load our google components (they require py 3)
RUN pip install --upgrade google-cloud-pubsub
RUN pip install --upgrade google-cloud-bigquery

# ADD copies files to the docker filesystem image at the specified path
ADD mqtt-to-bigquery.py /mqtt-to-bigquery.py

# utils library 
ADD utils.py /utils.py

# run our application
CMD python /mqtt-to-bigquery.py 

# [END dockerfile]
