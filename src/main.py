import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_login import LoginManager
from src.models.user import db, User # User adicionado
from src.routes.user import user_bp
from src.routes.transaction import transaction_bp
from src.routes.report import report_bp # Adicionado report_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), "static"))
app.config["SECRET_KEY"] = "asdf#FGSgvasgf$5$WGT"

# Configuração do Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "user.login"  # Rota para redirecionar se não estiver logado

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

app.register_blueprint(user_bp, url_prefix="/api")
app.register_blueprint(transaction_bp, url_prefix="/api")
app.register_blueprint(report_bp, url_prefix="/api") # Registrado report_bp

# ESTA SEÇÃO SERÁ ATUALIZADA NA PRÓXIMA ETAPA COM AS CREDENCIAIS DA HOSTINGER
app.config["SQLALCHEMY_DATABASE_URI"] = "mysql+pymysql://u709041968_focoXDB:|OoZ0:5p4@srv1883.hstgr.io:3306/u709041968_focoXDB"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)

with app.app_context():
    db.create_all()
    # Criar usuário administrador padrão se não existir
    if not User.query.filter_by(username="admin").first():
        admin_user = User(username="admin", email="admin@example.com", role="admin")
        admin_user.set_password("password")
        db.session.add(admin_user)
        db.session.commit()
        print("Usuário administrador 'admin' criado com senha 'password'.")

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, "index.html")
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, "index.html")
        else:
            return "index.html not found in static folder. Please build your frontend.", 404

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)

