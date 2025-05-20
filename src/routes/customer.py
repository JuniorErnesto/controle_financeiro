"""
src/routes/customer.py

Este módulo define as rotas para gerenciamento de clientes no sistema de gestão de ordens.
"""

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from main import db
from models.customer import Customer

customer_bp = Blueprint('customer', __name__)

@customer_bp.route('/api/customers', methods=['GET'])
@login_required
def get_customers():
    """Retorna a lista de todos os clientes."""
    customers = Customer.query.all()
    return jsonify([customer.to_dict() for customer in customers])

@customer_bp.route('/api/customers/<int:customer_id>', methods=['GET'])
@login_required
def get_customer(customer_id):
    """Retorna os detalhes de um cliente específico."""
    customer = Customer.query.get_or_404(customer_id)
    return jsonify(customer.to_dict())

@customer_bp.route('/api/customers', methods=['POST'])
@login_required
def create_customer():
    """Cria um novo cliente."""
    data = request.json
    
    # Validação básica
    if not data.get('name'):
        return jsonify({'message': 'Nome do cliente é obrigatório'}), 400
    
    # Verificar se o email já existe
    if data.get('email') and Customer.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email já cadastrado'}), 400
    
    customer = Customer(
        name=data.get('name'),
        email=data.get('email'),
        phone=data.get('phone'),
        address=data.get('address')
    )
    
    db.session.add(customer)
    db.session.commit()
    
    return jsonify({
        'message': 'Cliente criado com sucesso',
        'customer': customer.to_dict()
    }), 201

@customer_bp.route('/api/customers/<int:customer_id>', methods=['PUT'])
@login_required
def update_customer(customer_id):
    """Atualiza os dados de um cliente existente."""
    customer = Customer.query.get_or_404(customer_id)
    data = request.json
    
    # Validação básica
    if not data.get('name'):
        return jsonify({'message': 'Nome do cliente é obrigatório'}), 400
    
    # Verificar se o email já existe (se foi alterado)
    if data.get('email') and data['email'] != customer.email and \
       Customer.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email já cadastrado'}), 400
    
    customer.name = data.get('name')
    customer.email = data.get('email', customer.email)
    customer.phone = data.get('phone', customer.phone)
    customer.address = data.get('address', customer.address)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Cliente atualizado com sucesso',
        'customer': customer.to_dict()
    })

@customer_bp.route('/api/customers/<int:customer_id>', methods=['DELETE'])
@login_required
def delete_customer(customer_id):
    """Remove um cliente do sistema."""
    customer = Customer.query.get_or_404(customer_id)
    
    # Verificar se o cliente possui ordens associadas
    if customer.orders:
        return jsonify({
            'message': 'Não é possível excluir o cliente pois existem ordens associadas'
        }), 400
    
    db.session.delete(customer)
    db.session.commit()
    
    return jsonify({'message': 'Cliente excluído com sucesso'})

@customer_bp.route('/api/customers/search', methods=['GET'])
@login_required
def search_customers():
    """Pesquisa clientes por nome, email ou telefone."""
    query = request.args.get('q', '')
    if not query or len(query) < 3:
        return jsonify({'message': 'Termo de pesquisa deve ter pelo menos 3 caracteres'}), 400
    
    customers = Customer.query.filter(
        (Customer.name.ilike(f'%{query}%')) |
        (Customer.email.ilike(f'%{query}%')) |
        (Customer.phone.ilike(f'%{query}%'))
    ).all()
    
    return jsonify([customer.to_dict() for customer in customers])
