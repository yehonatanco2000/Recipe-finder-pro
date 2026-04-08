from flask import Blueprint, request, jsonify
from database_manager import db
auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    return db.register_user(username, password)



@auth_bp.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    return db.login_user(username, password)

@auth_bp.route('/api/logout', methods=['POST'])
def logout():
    import logging
    data = request.json
    username = data.get('username', 'Unknown')
    logging.info(f"👤 User logged out: {username}")
    return jsonify({"message": "Logout successful"}), 200
