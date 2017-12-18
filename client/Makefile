TGZ = pubsub_client.tgz

all:
	tar hczvf $(TGZ) publisher.py command_subscriber.py run_command_subscriber.sh send_value.sh service_account.json one_time_setup.sh gcloud_env.bash pubsub_env/
	@echo "Now copy the $(TGZ) file to your BBB and run the setup."

clean:
	rm -fr *.pyc $(TGZ) pubsub_env/ __pycache__/
