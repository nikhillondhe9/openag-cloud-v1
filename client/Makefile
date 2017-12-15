TGZ = publish_client.tgz

all:
	tar Lczvf $(TGZ) utils.py publish.py send_value.sh
	@echo "Now copy the $(TGZ) file to your BBB and run the setup."

clean:
	rm -fr *.pyc $(TGZ) pubsub_env/ __pycache__/
