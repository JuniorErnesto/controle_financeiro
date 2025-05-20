"""
src/routes/status_history.py

Este módulo define as rotas para gerenciamento do histórico de status no sistema de gestão de ordens.
"""

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from main import db
from models.status_history import StatusHistory
from models.order import Order, OrderStatus

status_history_bp = Blueprint('status_history', __name__)

@status_history_bp.route('/api/orders/<int:order_id>/status-history', methods=['GET'])
@login_required
def get_status_history(order_id):
    """Retorna o histórico completo de status de uma ordem."""
    # Verificar se a ordem existe
    order = Order.query.get_or_404(order_id)
    
    # Obter histórico ordenado por data (mais recente primeiro)
    history = StatusHistory.query.filter_by(order_id=order_id).order_by(StatusHistory.changed_at.desc()).all()
    
    return jsonify([entry.to_dict() for entry in history])

@status_history_bp.route('/api/orders/<int:order_id>/status-history', methods=['POST'])
@login_required
def add_status_history(order_id):
    """Adiciona uma entrada manual ao histórico de status."""
    # Verificar se a ordem existe
    order = Order.query.get_or_404(order_id)
    data = request.json
    
    # Validação básica
    if not data.get('status'):
        return jsonify({'message': 'Status é obrigatório'}), 400
    
    if data.get('status') not in [status.value for status in OrderStatus]:
        return jsonify({'message': 'Status inválido'}), 400
    
    # Atualizar o status da ordem
    try:
        history = order.update_status(data['status'], current_user.username)
        if data.get('notes'):
            history.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'message': 'Status atualizado com sucesso',
            'history': history.to_dict()
        }), 201
    except ValueError as e:
        return jsonify({'message': str(e)}), 400

@status_history_bp.route('/api/status-history/<int:history_id>', methods=['PUT'])
@login_required
def update_status_history(history_id):
    """Atualiza as notas de uma entrada do histórico de status."""
    history = StatusHistory.query.get_or_404(history_id)
    data = request.json
    
    # Apenas as notas podem ser atualizadas
    if 'notes' in data:
        history.notes = data['notes']
        db.session.commit()
        
        return jsonify({
            'message': 'Notas do histórico atualizadas com sucesso',
            'history': history.to_dict()
        })
    
    return jsonify({'message': 'Nenhuma alteração realizada'}), 400

@status_history_bp.route('/api/orders/timeline/<int:order_id>', methods=['GET'])
@login_required
def get_order_timeline(order_id):
    """Retorna uma linha do tempo completa da ordem, incluindo status e métricas de tempo."""
    # Verificar se a ordem existe
    order = Order.query.get_or_404(order_id)
    
    # Obter histórico ordenado por data (mais antigo primeiro)
    history = StatusHistory.query.filter_by(order_id=order_id).order_by(StatusHistory.changed_at.asc()).all()
    
    # Calcular duração entre etapas
    timeline = []
    prev_date = None
    
    for i, entry in enumerate(history):
        item = entry.to_dict()
        
        # Adicionar duração desde a etapa anterior
        if prev_date:
            duration_days = (entry.changed_at - prev_date).days
            item['duration_days'] = duration_days
        else:
            item['duration_days'] = 0
        
        prev_date = entry.changed_at
        timeline.append(item)
    
    # Adicionar métricas gerais
    metrics = {
        'total_days': order.total_days,
        'quote_to_approval': None,
        'approval_to_completion': None,
        'completion_to_return': None
    }
    
    if order.approved_at and order.created_at:
        metrics['quote_to_approval'] = (order.approved_at - order.created_at).days
    
    if order.completed_at and order.approved_at:
        metrics['approval_to_completion'] = (order.completed_at - order.approved_at).days
    
    if order.returned_at and order.completed_at:
        metrics['completion_to_return'] = (order.returned_at - order.completed_at).days
    
    return jsonify({
        'timeline': timeline,
        'metrics': metrics
    })
