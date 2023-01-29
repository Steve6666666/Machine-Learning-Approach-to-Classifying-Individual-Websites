sudo curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.2/install.sh | sudo bash

sudo chmod 775 ~/.nvm
. ~/.bashrc
nvm install 17 -y

sudo apt-get update -y
sudo apt-get install -y man-db
sudo apt-get install -y chromium-browser
sudo apt install python3-pip
pip3 install dpkt

~/.nvm/versions/node/v17.9.1/bin/npm i puppeteer

if [ -f "config.json.example" ]; then
    mv config.json.example config.json
    echo "Changed config.json.example to config.json"
fi
