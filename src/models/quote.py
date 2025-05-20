"""
src/models/quote.py

Este módulo define o modelo de dados para orçamentos no sistema de gestão de ordens.
"""

from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from main import db

class Quote(db.Model):
    """Modelo para armazenar informações de orçamentos."""
    
    __tablename__ = 'quotes'
    
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False, unique=True)
    labor_cost = Column(Numeric(10, 2), default=0.0)
    parts_cost = Column(Numeric(10, 2), default=0.0)
    third_party_cost = Column(Numeric(10, 2), default=0.0)
    estimated_days = Column(Integer, default=1)
    total_amount = Column(Numeric(10, 2), default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    valid_until = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=30))
    notes = Column(Text)
    
    # Relacionamentos
    order = relationship("Order", back_populates="quote")
    
    def __repr__(self):
        return f"<Quote {self.id} for Order {self.order_id}>"
    
    def to_dict(self):
        """Converte o objeto em um dicionário."""
        return {
            'id': self.id,
            'order_id': self.order_id,
            'labor_cost': float(self.labor_cost) if self.labor_cost else 0.0,
            'parts_cost': float(self.parts_cost) if self.parts_cost else 0.0,
            'third_party_cost': float(self.third_party_cost) if self.third_party_cost else 0.0,
            'estimated_days': self.estimated_days,
            'total_amount': float(self.total_amount) if self.total_amount else 0.0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'valid_until': self.valid_until.isoformat() if self.valid_until else None,
            'notes': self.notes
        }
    
    def calculate_total(self):
        """Calcula o valor total do orçamento."""
        labor = float(self.labor_cost) if self.labor_cost else 0.0
        parts = float(self.parts_cost) if self.parts_cost else 0.0
        third_party = float(self.third_party_cost) if self.third_party_cost else 0.0
        
        self.total_amount = labor + parts + third_party
        return self.total_amount
