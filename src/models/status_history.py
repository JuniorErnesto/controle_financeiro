"""
src/models/status_history.py

Este módulo define o modelo de dados para histórico de status no sistema de gestão de ordens.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from main import db

class StatusHistory(db.Model):
    """Modelo para armazenar o histórico de mudanças de status das ordens."""
    
    __tablename__ = 'status_history'
    
    id = Column(Integer, primary_key=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    status = Column(String(20), nullable=False)
    changed_at = Column(DateTime, default=datetime.utcnow)
    changed_by = Column(String(50), default="system")
    notes = Column(Text)
    
    # Relacionamentos
    order = relationship("Order", back_populates="status_history")
    
    def __repr__(self):
        return f"<StatusHistory {self.id} for Order {self.order_id}>"
    
    def to_dict(self):
        """Converte o objeto em um dicionário."""
        return {
            'id': self.id,
            'order_id': self.order_id,
            'status': self.status,
            'changed_at': self.changed_at.isoformat() if self.changed_at else None,
            'changed_by': self.changed_by,
            'notes': self.notes
        }
