# [START dockerfile]

FROM gcr.io/google_appengine/python

RUN pip install --upgrade pip
RUN pip install --upgrade google-cloud-pubsub
RUN pip install --upgrade google-cloud-bigquery

# add copies files to the docker filesystem image at the specified path
ADD mqtt-to-bigquery.py /mqtt-to-bigquery.py

# utils library 
ADD utils.py /utils.py

# run our application
CMD python3 /mqtt-to-bigquery.py 

# [END dockerfile]
