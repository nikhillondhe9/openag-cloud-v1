from flask import Flask
from flask import Flask, render_template, request

app = Flask(__name__)

@app.route('/')
def hell_world():
    return 'Hello, World!'