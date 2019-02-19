# Required packages to be manually installed on Ubuntu, OSX, etc.  (Note these are already installed in the BBB Debian 9.3 image we flash devices with).
```bash
sudo apt-get install -y git
sudo apt-get install -y python3
sudo apt-get install -y python-pip
sudo apt-get install -y python3-pip
sudo apt-get install -y curl
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs
```

# Install steps
```bash
sudo vi /etc/hosts  (Add: food.computer.com after localhost)
./one_time_setup_for_local_development.sh
```

# First, run Flask in one terminal
```bash
./run_local_flask_API.sh
```

# Second, run React in a different terminal
```bash
./run_local_react_UI.sh
```
