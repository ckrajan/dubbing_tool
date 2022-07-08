from pip import main
from flask import Flask, render_template, request, make_response
# from flask_cors import CORS


app = Flask(__name__, static_url_path='/static')
# CORS(app)

@app.route('/vfs_settings')
def vfs_settings():
    return render_template('vfs_settings.html')

@app.route('/')
def vfs():
    return render_template('vfs_process.html')

@app.route('/vfs_batch_process')
def vfs_batch_process():
    return render_template('vfs_batch_process.html') 

if __name__ == '__main__':
    app.run(port=8080, debug=True)
