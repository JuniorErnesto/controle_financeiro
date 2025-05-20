from mongoengine import Document, StringField, EmailField, FloatField, DateTimeField, ReferenceField, ListField, EmbeddedDocument, EmbeddedDocumentField
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(Document):
    username = StringField(required=True, unique=True, max_length=80)
    email = EmailField(required=True, unique=True)
    password_hash = StringField(required=True)
    role = StringField(required=True, default='funcionario', choices=('admin', 'funcionario'))
    created_at = DateTimeField(default=datetime.utcnow)

    meta = {
        'indexes': [
            'username',
            'email'
        ]
    }

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.username}>'

class Transaction(Document):
    user_id = ReferenceField(User, required=True)
    description = StringField(required=True, max_length=200)
    amount = FloatField(required=True)
    type = StringField(required=True, choices=('receita', 'despesa'))
    category = StringField(max_length=100)
    date = DateTimeField(required=True, default=datetime.utcnow)

    meta = {
        'indexes': [
            'user_id',
            'date',
            'type',
            'category'
        ]
    }

    def __repr__(self):
        return f'<Transaction {self.description} {self.amount}>'

