"""
src/models/expense.py

Este módulo define o modelo de dados para despesas no sistema de gestão de ordens.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric, Boolean, Date
from sqlalchemy.orm import relationship
import enum
from main import db

class ExpenseCategory(enum.Enum):
    """Enum para as categorias de despesas."""
    PARTS = "parts"
    LABOR = "labor"
    THIRD_PARTY = "third_party"

class Expense(db.Model):
    """Modelo para armazenar informações de despesas associadas a ordens."""
    
    __tablename__ = 'expenses'
    
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    category = Column(String(20), nullable=False)
    description = Column(String(100), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    is_warranty = Column(Boolean, default=False)
    date = Column(Date, default=datetime.utcnow().date)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relacionamentos
    order = relationship("Order", back_populates="expenses")
    
    def __repr__(self):
        return f"<Expense {self.id} for Order {self.order_id}>"
    
    def to_dict(self):
        """Converte o objeto em um dicionário."""
        return {
            'id': self.id,
            'order_id': self.order_id,
            'category': self.category,
            'description': self.description,
            'amount': float(self.amount) if self.amount else 0.0,
            'is_warranty': self.is_warranty,
            'date': self.date.isoformat() if self.date else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
