# Install steps
```bash
sudo vi /etc/hosts  (Add: food.computer.com after localhost)
cd openag-cloud-v1/UI-FlaskReact-AppEngineFlexVM/
virtualenv --python python3 pyenv
source pyenv/bin/activate
cd FlaskApiProvider/
pip install -t lib -r requirements.txt
```

# Run Flask in one terminal
```bash
cd openag-cloud-v1/UI-FlaskReact-AppEngineFlexVM/
source pyenv/bin/activate
cd FlaskApiProvider/
export PYTHONPATH=./lib
export FLASK_APP=main.py
export GOOGLE_APPLICATION_CREDENTIALS=./authenticate.json
python3 -m flask run
```

# Run React in a different terminal
```bash
cd openag-cloud-v1/UI-FlaskReact-AppEngineFlexVM/ReactFrontEnd/
npm install --save-dev
npm start
```
