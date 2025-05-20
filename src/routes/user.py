from flask import Blueprint, jsonify, request, abort
from flask_login import login_user, logout_user, login_required, current_user
from functools import wraps
from src.models.user import User, db

user_bp = Blueprint("user", __name__)

# Decorator for admin-only routes
def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role != "admin":
            abort(403)  # Forbidden
        return f(*args, **kwargs)
    return decorated_function

@user_bp.route("/register", methods=["POST"])
@login_required
@admin_required
def register_user():
    data = request.json
    if not data or not data.get("username") or not data.get("email") or not data.get("password"):
        return jsonify({"message": "Missing username, email, or password"}), 400
    
    if User.query.filter_by(username=data["username"]).first() or User.query.filter_by(email=data["email"]).first():
        return jsonify({"message": "User already exists"}), 400

    user = User(username=data["username"], email=data["email"], role=data.get("role", "funcionario"))
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

@user_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    if not data or not data.get("username") or not data.get("password"):
        return jsonify({"message": "Missing username or password"}), 400

    user = User.query.filter_by(username=data["username"]).first()

    if user and user.check_password(data["password"]):
        login_user(user)
        return jsonify({"message": "Logged in successfully", "user": user.to_dict()}), 200
    
    return jsonify({"message": "Invalid username or password"}), 401

@user_bp.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"message": "Logged out successfully"}), 200

@user_bp.route("/users", methods=["GET"])
@login_required
@admin_required
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@user_bp.route("/users/<int:user_id>", methods=["GET"])
@login_required
@admin_required
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())

@user_bp.route("/users/<int:user_id>", methods=["PUT"])
@login_required
@admin_required
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.json
    
    if "username" in data:
        user.username = data["username"]
    if "email" in data:
        user.email = data["email"]
    if "role" in data:
        user.role = data["role"]
    if "password" in data and data["password"]:
        user.set_password(data["password"])
        
    db.session.commit()
    return jsonify(user.to_dict())

@user_bp.route("/users/<int:user_id>", methods=["DELETE"])
@login_required
@admin_required
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    # Prevent admin from deleting themselves if they are the only admin or a specific logic is needed
    # For now, we allow deletion if requested by an admin
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted successfully"}), 200

@user_bp.route("/profile", methods=["GET"])
@login_required
def get_profile():
    return jsonify(current_user.to_dict())

