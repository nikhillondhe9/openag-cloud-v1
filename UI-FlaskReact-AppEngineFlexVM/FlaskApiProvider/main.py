from flask import Flask
from flask import Flask, render_template, request,crossdomain

app = Flask(__name__)

@app.route('/')
def hell_world():
    return 'Hello, World!'

@app.route('/signup/')
@crossdomain(origin='*')
def signup():
    return 'I hit route 2'