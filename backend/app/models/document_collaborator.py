from sqlalchemy import Column, Integer, String, ForeignKey, UniqueConstraint, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class DocumentCollaborator(Base):
    __tablename__ = "document_collaborators"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(20), nullable=False)  # 'owner', 'editor', 'reader'
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Ensure one user can only have one role per document
    __table_args__ = (
        UniqueConstraint('document_id', 'user_id', name='unique_document_user'),
    )
    
    # Relationships
    document = relationship("Document", back_populates="collaborators")
    user = relationship("User", back_populates="document_access")
