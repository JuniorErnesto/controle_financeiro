"""
src/models/order.py

Este módulo define o modelo de dados para ordens de serviço no sistema de gestão de ordens.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from main import db

class OrderStatus(enum.Enum):
    """Enum para os possíveis status de uma ordem."""
    QUOTE = "quote"
    APPROVED = "approved"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    RETURNED = "returned"
    WARRANTY = "warranty"
    CLOSED = "closed"

class Order(db.Model):
    """Modelo para armazenar informações de ordens de serviço."""
    
    __tablename__ = 'orders'
    
    id = Column(Integer, primary_key=True)
    order_number = Column(String(20), unique=True, nullable=False)
    customer_id = Column(Integer, ForeignKey('customers.id'), nullable=False)
    equipment = Column(String(100), nullable=False)
    problem_description = Column(Text)
    status = Column(String(20), default=OrderStatus.QUOTE.value)
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime)
    completed_at = Column(DateTime)
    returned_at = Column(DateTime)
    closed_at = Column(DateTime)
    total_days = Column(Integer)
    notes = Column(Text)
    
    # Relacionamentos
    customer = relationship("Customer", back_populates="orders")
    quote = relationship("Quote", back_populates="order", uselist=False, cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="order", cascade="all, delete-orphan")
    status_history = relationship("StatusHistory", back_populates="order", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Order {self.order_number}>"
    
    def to_dict(self):
        """Converte o objeto em um dicionário."""
        return {
            'id': self.id,
            'order_number': self.order_number,
            'customer_id': self.customer_id,
            'equipment': self.equipment,
            'problem_description': self.problem_description,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'approved_at': self.approved_at.isoformat() if self.approved_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'returned_at': self.returned_at.isoformat() if self.returned_at else None,
            'closed_at': self.closed_at.isoformat() if self.closed_at else None,
            'total_days': self.total_days,
            'notes': self.notes,
            'customer': self.customer.to_dict() if self.customer else None,
            'quote': self.quote.to_dict() if self.quote else None
        }
    
    def update_status(self, new_status, user="system"):
        """Atualiza o status da ordem e registra no histórico."""
        if new_status not in [status.value for status in OrderStatus]:
            raise ValueError(f"Status inválido: {new_status}")
        
        old_status = self.status
        self.status = new_status
        
        # Atualizar timestamps baseados no novo status
        now = datetime.utcnow()
        if new_status == OrderStatus.APPROVED.value:
            self.approved_at = now
        elif new_status == OrderStatus.COMPLETED.value:
            self.completed_at = now
            if self.approved_at:
                self.total_days = (now - self.approved_at).days
        elif new_status == OrderStatus.RETURNED.value:
            self.returned_at = now
        elif new_status == OrderStatus.CLOSED.value:
            self.closed_at = now
        
        # Registrar mudança no histórico
        history = StatusHistory(
            order_id=self.id,
            status=new_status,
            changed_at=now,
            changed_by=user,
            notes=f"Status alterado de {old_status} para {new_status}"
        )
        db.session.add(history)
        
        return history
