from flask import Blueprint, jsonify, request, abort
from flask_login import login_required, current_user
from src.models.user import db, Transaction # Transaction model
from datetime import datetime, timedelta
from sqlalchemy import func

transaction_bp = Blueprint("transaction", __name__)

@transaction_bp.route("/transactions", methods=["POST"])
@login_required
def create_transaction():
    data = request.json
    if not data or not data.get("description") or not data.get("amount") or not data.get("type"):
        return jsonify({"message": "Missing description, amount, or type"}), 400

    try:
        amount = float(data["amount"])
    except ValueError:
        return jsonify({"message": "Invalid amount format"}), 400

    if data["type"] not in ["receita", "despesa"]:
        return jsonify({"message": "Invalid transaction type. Must be 'receita' or 'despesa'"}), 400

    date_str = data.get("date")
    transaction_date = datetime.utcnow()
    if date_str:
        try:
            transaction_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
        except ValueError:
            return jsonify({"message": "Invalid date format. Use ISO format."}), 400

    new_transaction = Transaction(
        description=data["description"],
        amount=amount,
        type=data["type"],
        category=data.get("category"),
        user_id=current_user.id,
        date=transaction_date
    )
    db.session.add(new_transaction)
    db.session.commit()
    return jsonify(new_transaction.to_dict()), 201

@transaction_bp.route("/transactions", methods=["GET"])
@login_required
def get_transactions():
    query = Transaction.query.filter_by(user_id=current_user.id)

    period = request.args.get("period")
    start_date_str = request.args.get("start_date")
    end_date_str = request.args.get("end_date")

    if period:
        today = datetime.utcnow().date()
        if period == "day":
            query = query.filter(func.date(Transaction.date) == today)
        elif period == "week":
            start_of_week = today - timedelta(days=today.weekday())
            end_of_week = start_of_week + timedelta(days=6)
            query = query.filter(func.date(Transaction.date) >= start_of_week, func.date(Transaction.date) <= end_of_week)
        elif period == "month":
            start_of_month = today.replace(day=1)
            # Calculate end of month correctly
            next_month = start_of_month.replace(month=start_of_month.month % 12 + 1, day=1)
            if start_of_month.month == 12: # Handle December case for next year
                 next_month = start_of_month.replace(year=start_of_month.year + 1, month=1, day=1)
            end_of_month = next_month - timedelta(days=1)
            query = query.filter(func.date(Transaction.date) >= start_of_month, func.date(Transaction.date) <= end_of_month)
        elif period == "year":
            start_of_year = today.replace(month=1, day=1)
            end_of_year = today.replace(month=12, day=31)
            query = query.filter(func.date(Transaction.date) >= start_of_year, func.date(Transaction.date) <= end_of_year)
    elif start_date_str and end_date_str:
        try:
            start_date = datetime.fromisoformat(start_date_str.replace("Z", "+00:00")).date()
            end_date = datetime.fromisoformat(end_date_str.replace("Z", "+00:00")).date()
            query = query.filter(func.date(Transaction.date) >= start_date, func.date(Transaction.date) <= end_date)
        except ValueError:
            return jsonify({"message": "Invalid date format for start_date or end_date. Use ISO format."}), 400
    
    transactions = query.order_by(Transaction.date.desc()).all()
    return jsonify([transaction.to_dict() for transaction in transactions])

@transaction_bp.route("/transactions/summary", methods=["GET"])
@login_required
def get_transactions_summary():
    query = Transaction.query.filter_by(user_id=current_user.id)

    period = request.args.get("period")
    start_date_str = request.args.get("start_date")
    end_date_str = request.args.get("end_date")

    if period:
        today = datetime.utcnow().date()
        if period == "day":
            query = query.filter(func.date(Transaction.date) == today)
        elif period == "week":
            start_of_week = today - timedelta(days=today.weekday())
            end_of_week = start_of_week + timedelta(days=6)
            query = query.filter(func.date(Transaction.date) >= start_of_week, func.date(Transaction.date) <= end_of_week)
        elif period == "month":
            start_of_month = today.replace(day=1)
            next_month = start_of_month.replace(month=start_of_month.month % 12 + 1, day=1)
            if start_of_month.month == 12:
                 next_month = start_of_month.replace(year=start_of_month.year + 1, month=1, day=1)
            end_of_month = next_month - timedelta(days=1)
            query = query.filter(func.date(Transaction.date) >= start_of_month, func.date(Transaction.date) <= end_of_month)
        elif period == "year":
            start_of_year = today.replace(month=1, day=1)
            end_of_year = today.replace(month=12, day=31)
            query = query.filter(func.date(Transaction.date) >= start_of_year, func.date(Transaction.date) <= end_of_year)
    elif start_date_str and end_date_str:
        try:
            start_date = datetime.fromisoformat(start_date_str.replace("Z", "+00:00")).date()
            end_date = datetime.fromisoformat(end_date_str.replace("Z", "+00:00")).date()
            query = query.filter(func.date(Transaction.date) >= start_date, func.date(Transaction.date) <= end_date)
        except ValueError:
            return jsonify({"message": "Invalid date format for start_date or end_date. Use ISO format."}), 400

    total_receitas = db.session.query(func.sum(Transaction.amount)).filter(Transaction.user_id == current_user.id, Transaction.type == "receita").scalar() or 0
    total_despesas = db.session.query(func.sum(Transaction.amount)).filter(Transaction.user_id == current_user.id, Transaction.type == "despesa").scalar() or 0
    
    # Apply filters to summary calculation as well
    filtered_receitas = query.filter(Transaction.type == "receita").with_entities(func.sum(Transaction.amount)).scalar() or 0
    filtered_despesas = query.filter(Transaction.type == "despesa").with_entities(func.sum(Transaction.amount)).scalar() or 0

    saldo = filtered_receitas - filtered_despesas

    return jsonify({
        "total_receitas": filtered_receitas,
        "total_despesas": filtered_despesas,
        "saldo": saldo
    })

@transaction_bp.route("/transactions/chart-data", methods=["GET"])
@login_required
def get_chart_data():
    # This endpoint will provide data formatted for charts (e.g., line chart over time, pie chart for categories)
    # For line chart (e.g., daily/monthly balance over time)
    # For pie chart (e.g., expenses by category for a period)
    
    query = Transaction.query.filter_by(user_id=current_user.id)
    period_type = request.args.get("period_type", "month") # 'day', 'month', 'year'
    chart_type = request.args.get("chart_type", "line") # 'line', 'pie'

    start_date_str = request.args.get("start_date")
    end_date_str = request.args.get("end_date")

    if start_date_str and end_date_str:
        try:
            start_date = datetime.fromisoformat(start_date_str.replace("Z", "+00:00")).date()
            end_date = datetime.fromisoformat(end_date_str.replace("Z", "+00:00")).date()
            query = query.filter(func.date(Transaction.date) >= start_date, func.date(Transaction.date) <= end_date)
        except ValueError:
            return jsonify({"message": "Invalid date format for start_date or end_date. Use ISO format."}), 400
    else: # Default to last 30 days if no specific range
        end_date = datetime.utcnow().date()
        start_date = end_date - timedelta(days=30)
        query = query.filter(func.date(Transaction.date) >= start_date, func.date(Transaction.date) <= end_date)

    if chart_type == "line":
        # Aggregate data for line chart (e.g., daily/monthly income, expense, balance)
        # Example: daily balance for the last 30 days
        data_points = []
        current_date = start_date
        while current_date <= end_date:
            daily_receitas = query.filter(func.date(Transaction.date) == current_date, Transaction.type == "receita").with_entities(func.sum(Transaction.amount)).scalar() or 0
            daily_despesas = query.filter(func.date(Transaction.date) == current_date, Transaction.type == "despesa").with_entities(func.sum(Transaction.amount)).scalar() or 0
            data_points.append({
                "date": current_date.isoformat(),
                "receitas": daily_receitas,
                "despesas": daily_despesas,
                "saldo": daily_receitas - daily_despesas
            })
            current_date += timedelta(days=1)
        return jsonify(data_points)

    elif chart_type == "pie":
        # Aggregate data for pie chart (e.g., expenses by category)
        category_data = query.filter(Transaction.type == "despesa") \
                               .group_by(Transaction.category) \
                               .with_entities(Transaction.category, func.sum(Transaction.amount)) \
                               .all()
        
        pie_data = [{
            "category": category if category else "Outros", 
            "amount": amount
            } for category, amount in category_data]
        return jsonify(pie_data)

    return jsonify({"message": "Invalid chart_type specified"}), 400


@transaction_bp.route("/transactions/<int:transaction_id>", methods=["GET"])
@login_required
def get_transaction(transaction_id):
    transaction = Transaction.query.get_or_404(transaction_id)
    if transaction.user_id != current_user.id:
        abort(403)
    return jsonify(transaction.to_dict())

@transaction_bp.route("/transactions/<int:transaction_id>", methods=["PUT"])
@login_required
def update_transaction(transaction_id):
    transaction = Transaction.query.get_or_404(transaction_id)
    if transaction.user_id != current_user.id:
        abort(403)

    data = request.json
    if not data:
        return jsonify({"message": "No data provided for update"}), 400

    if "description" in data:
        transaction.description = data["description"]
    if "amount" in data:
        try:
            transaction.amount = float(data["amount"])
        except ValueError:
            return jsonify({"message": "Invalid amount format"}), 400
    if "type" in data:
        if data["type"] not in ["receita", "despesa"]:
            return jsonify({"message": "Invalid transaction type"}), 400
        transaction.type = data["type"]
    if "category" in data:
        transaction.category = data["category"]
    if "date" in data:
        try:
            transaction.date = datetime.fromisoformat(data["date"].replace("Z", "+00:00"))
        except ValueError:
            return jsonify({"message": "Invalid date format. Use ISO format."}), 400
            
    db.session.commit()
    return jsonify(transaction.to_dict())

@transaction_bp.route("/transactions/<int:transaction_id>", methods=["DELETE"])
@login_required
def delete_transaction(transaction_id):
    transaction = Transaction.query.get_or_404(transaction_id)
    if transaction.user_id != current_user.id:
        abort(403)

    db.session.delete(transaction)
    db.session.commit()
    return jsonify({"message": "Transaction deleted successfully"}), 200

