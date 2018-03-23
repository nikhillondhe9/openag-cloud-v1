import sys
from flask import Flask
from flask import Flask, render_template, request
from flask_cors import CORS
from flask import Response
import json

app = Flask(__name__)
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})

CORS(app)

@app.route('/')
def hell_world():
    return 'Hello, World!'

@app.route('/signup/',methods=['GET', 'POST'])
def signup():
    data = json.dumps({
        "response_code":200
    })
    result = Response(data, status=200, mimetype='application/json')
    return result


@app.route('/login/',methods=['GET', 'POST'])
def login():
    data = json.dumps({
        "response_code":200
    })
    result = Response(data, status=200, mimetype='application/json')
    return result