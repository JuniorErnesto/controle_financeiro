"""
src/routes/order.py

Este módulo define as rotas para gerenciamento de ordens no sistema de gestão de ordens.
"""

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime
from main import db
from models.order import Order, OrderStatus
from models.quote import Quote
from models.status_history import StatusHistory
from models.customer import Customer

order_bp = Blueprint('order', __name__)

@order_bp.route('/api/orders', methods=['GET'])
@login_required
def get_orders():
    """Retorna a lista de todas as ordens, com opção de filtro por status."""
    status = request.args.get('status')
    customer_id = request.args.get('customer_id')
    
    query = Order.query
    
    if status:
        query = query.filter(Order.status == status)
    
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)
    
    # Ordenar por data de criação (mais recente primeiro)
    orders = query.order_by(Order.created_at.desc()).all()
    
    return jsonify([order.to_dict() for order in orders])

@order_bp.route('/api/orders/<int:order_id>', methods=['GET'])
@login_required
def get_order(order_id):
    """Retorna os detalhes de uma ordem específica."""
    order = Order.query.get_or_404(order_id)
    return jsonify(order.to_dict())

@order_bp.route('/api/orders', methods=['POST'])
@login_required
def create_order():
    """Cria uma nova ordem com orçamento inicial."""
    data = request.json
    
    # Validação básica
    if not data.get('customer_id'):
        return jsonify({'message': 'ID do cliente é obrigatório'}), 400
    
    if not data.get('equipment'):
        return jsonify({'message': 'Descrição do equipamento é obrigatória'}), 400
    
    # Verificar se o cliente existe
    customer = Customer.query.get(data.get('customer_id'))
    if not customer:
        return jsonify({'message': 'Cliente não encontrado'}), 404
    
    # Gerar número único para a ordem
    timestamp = datetime.utcnow().strftime('%Y%m%d%H%M')
    order_number = f"ORD-{timestamp}"
    
    # Criar a ordem
    order = Order(
        order_number=order_number,
        customer_id=data.get('customer_id'),
        equipment=data.get('equipment'),
        problem_description=data.get('problem_description', ''),
        status=OrderStatus.QUOTE.value,
        notes=data.get('notes', '')
    )
    
    db.session.add(order)
    db.session.flush()  # Para obter o ID da ordem
    
    # Criar o orçamento inicial
    quote = Quote(
        order_id=order.id,
        labor_cost=data.get('labor_cost', 0.0),
        parts_cost=data.get('parts_cost', 0.0),
        third_party_cost=data.get('third_party_cost', 0.0),
        estimated_days=data.get('estimated_days', 1),
        notes=data.get('quote_notes', '')
    )
    
    # Calcular o total do orçamento
    quote.calculate_total()
    
    db.session.add(quote)
    
    # Registrar o status inicial no histórico
    history = StatusHistory(
        order_id=order.id,
        status=OrderStatus.QUOTE.value,
        changed_by=current_user.username,
        notes="Ordem criada com orçamento inicial"
    )
    
    db.session.add(history)
    db.session.commit()
    
    return jsonify({
        'message': 'Ordem criada com sucesso',
        'order': order.to_dict()
    }), 201

@order_bp.route('/api/orders/<int:order_id>', methods=['PUT'])
@login_required
def update_order(order_id):
    """Atualiza os dados de uma ordem existente."""
    order = Order.query.get_or_404(order_id)
    data = request.json
    
    # Atualizar campos básicos da ordem
    if 'equipment' in data:
        order.equipment = data['equipment']
    
    if 'problem_description' in data:
        order.problem_description = data['problem_description']
    
    if 'notes' in data:
        order.notes = data['notes']
    
    # Atualizar o orçamento se fornecido
    if order.quote and any(key in data for key in ['labor_cost', 'parts_cost', 'third_party_cost', 'estimated_days']):
        if 'labor_cost' in data:
            order.quote.labor_cost = data['labor_cost']
        
        if 'parts_cost' in data:
            order.quote.parts_cost = data['parts_cost']
        
        if 'third_party_cost' in data:
            order.quote.third_party_cost = data['third_party_cost']
        
        if 'estimated_days' in data:
            order.quote.estimated_days = data['estimated_days']
        
        if 'quote_notes' in data:
            order.quote.notes = data['quote_notes']
        
        # Recalcular o total
        order.quote.calculate_total()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Ordem atualizada com sucesso',
        'order': order.to_dict()
    })

@order_bp.route('/api/orders/<int:order_id>/status', methods=['PUT'])
@login_required
def update_order_status(order_id):
    """Atualiza o status de uma ordem."""
    order = Order.query.get_or_404(order_id)
    data = request.json
    
    if not data.get('status'):
        return jsonify({'message': 'Novo status é obrigatório'}), 400
    
    try:
        # Usar o método do modelo para atualizar o status e registrar no histórico
        history = order.update_status(data['status'], current_user.username)
        db.session.commit()
        
        return jsonify({
            'message': 'Status da ordem atualizado com sucesso',
            'order': order.to_dict(),
            'history': history.to_dict()
        })
    except ValueError as e:
        return jsonify({'message': str(e)}), 400

@order_bp.route('/api/orders/<int:order_id>', methods=['DELETE'])
@login_required
def delete_order(order_id):
    """Remove uma ordem do sistema."""
    order = Order.query.get_or_404(order_id)
    
    # Verificar se a ordem pode ser excluída (apenas orçamentos não aprovados)
    if order.status != OrderStatus.QUOTE.value:
        return jsonify({
            'message': 'Apenas ordens em status de orçamento podem ser excluídas'
        }), 400
    
    db.session.delete(order)
    db.session.commit()
    
    return jsonify({'message': 'Ordem excluída com sucesso'})

@order_bp.route('/api/orders/dashboard', methods=['GET'])
@login_required
def get_dashboard_data():
    """Retorna dados para o dashboard de ordens."""
    # Contagem de ordens por status
    status_counts = {}
    for status in OrderStatus:
        count = Order.query.filter(Order.status == status.value).count()
        status_counts[status.value] = count
    
    # Ordens recentes (últimas 5)
    recent_orders = Order.query.order_by(Order.created_at.desc()).limit(5).all()
    
    # Ordens em andamento há mais tempo
    in_progress_orders = Order.query.filter(
        Order.status == OrderStatus.IN_PROGRESS.value
    ).order_by(Order.approved_at.asc()).limit(5).all()
    
    return jsonify({
        'status_counts': status_counts,
        'recent_orders': [order.to_dict() for order in recent_orders],
        'in_progress_orders': [order.to_dict() for order in in_progress_orders]
    })
