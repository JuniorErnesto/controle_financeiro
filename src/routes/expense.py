"""
src/routes/expense.py

Este módulo define as rotas para gerenciamento de despesas no sistema de gestão de ordens.
"""

from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from datetime import datetime
from main import db
from models.expense import Expense, ExpenseCategory
from models.order import Order

expense_bp = Blueprint('expense', __name__)

@expense_bp.route('/api/orders/<int:order_id>/expenses', methods=['GET'])
@login_required
def get_expenses(order_id):
    """Retorna a lista de todas as despesas de uma ordem."""
    # Verificar se a ordem existe
    order = Order.query.get_or_404(order_id)
    
    # Filtrar por categoria se especificado
    category = request.args.get('category')
    is_warranty = request.args.get('is_warranty')
    
    query = Expense.query.filter_by(order_id=order_id)
    
    if category:
        query = query.filter_by(category=category)
    
    if is_warranty is not None:
        is_warranty_bool = is_warranty.lower() == 'true'
        query = query.filter_by(is_warranty=is_warranty_bool)
    
    # Ordenar por data
    expenses = query.order_by(Expense.date.desc()).all()
    
    return jsonify([expense.to_dict() for expense in expenses])

@expense_bp.route('/api/orders/<int:order_id>/expenses', methods=['POST'])
@login_required
def create_expense(order_id):
    """Adiciona uma nova despesa a uma ordem."""
    # Verificar se a ordem existe
    order = Order.query.get_or_404(order_id)
    data = request.json
    
    # Validação básica
    if not data.get('description'):
        return jsonify({'message': 'Descrição da despesa é obrigatória'}), 400
    
    if not data.get('amount'):
        return jsonify({'message': 'Valor da despesa é obrigatório'}), 400
    
    if not data.get('category') or data.get('category') not in [cat.value for cat in ExpenseCategory]:
        return jsonify({'message': 'Categoria inválida'}), 400
    
    # Criar a despesa
    expense = Expense(
        order_id=order_id,
        category=data.get('category'),
        description=data.get('description'),
        amount=data.get('amount'),
        is_warranty=data.get('is_warranty', False),
        date=datetime.fromisoformat(data.get('date')).date() if data.get('date') else datetime.utcnow().date()
    )
    
    db.session.add(expense)
    db.session.commit()
    
    return jsonify({
        'message': 'Despesa adicionada com sucesso',
        'expense': expense.to_dict()
    }), 201

@expense_bp.route('/api/expenses/<int:expense_id>', methods=['PUT'])
@login_required
def update_expense(expense_id):
    """Atualiza os dados de uma despesa existente."""
    expense = Expense.query.get_or_404(expense_id)
    data = request.json
    
    # Validação básica
    if 'description' in data and not data['description']:
        return jsonify({'message': 'Descrição da despesa é obrigatória'}), 400
    
    if 'amount' in data and not data['amount']:
        return jsonify({'message': 'Valor da despesa é obrigatório'}), 400
    
    if 'category' in data and data['category'] not in [cat.value for cat in ExpenseCategory]:
        return jsonify({'message': 'Categoria inválida'}), 400
    
    # Atualizar campos
    if 'description' in data:
        expense.description = data['description']
    
    if 'amount' in data:
        expense.amount = data['amount']
    
    if 'category' in data:
        expense.category = data['category']
    
    if 'is_warranty' in data:
        expense.is_warranty = data['is_warranty']
    
    if 'date' in data:
        expense.date = datetime.fromisoformat(data['date']).date()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Despesa atualizada com sucesso',
        'expense': expense.to_dict()
    })

@expense_bp.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
@login_required
def delete_expense(expense_id):
    """Remove uma despesa do sistema."""
    expense = Expense.query.get_or_404(expense_id)
    
    db.session.delete(expense)
    db.session.commit()
    
    return jsonify({'message': 'Despesa excluída com sucesso'})

@expense_bp.route('/api/orders/<int:order_id>/expenses/summary', methods=['GET'])
@login_required
def get_expenses_summary(order_id):
    """Retorna um resumo das despesas de uma ordem, agrupadas por categoria."""
    # Verificar se a ordem existe
    order = Order.query.get_or_404(order_id)
    
    # Obter todas as despesas da ordem
    expenses = Expense.query.filter_by(order_id=order_id).all()
    
    # Calcular totais por categoria
    summary = {
        'parts': 0.0,
        'labor': 0.0,
        'third_party': 0.0,
        'total': 0.0,
        'warranty_total': 0.0
    }
    
    for expense in expenses:
        amount = float(expense.amount)
        category = expense.category
        
        if category in summary:
            summary[category] += amount
        
        summary['total'] += amount
        
        if expense.is_warranty:
            summary['warranty_total'] += amount
    
    # Adicionar o orçamento para comparação
    if order.quote:
        summary['quote'] = {
            'parts_cost': float(order.quote.parts_cost),
            'labor_cost': float(order.quote.labor_cost),
            'third_party_cost': float(order.quote.third_party_cost),
            'total_amount': float(order.quote.total_amount)
        }
    
    return jsonify(summary)
