TGZ = pubsub_client.tgz

all:
	tar Lczvf $(TGZ) publisher.py subscriber.py send_value.sh service_account.json one_time_setup.sh gcloud_env.bash
	@echo "Now copy the $(TGZ) file to your BBB and run the setup."

clean:
	rm -fr *.pyc $(TGZ) pubsub_env/ __pycache__/
