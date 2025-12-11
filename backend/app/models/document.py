from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, default="")  # For plain text or backwards compatibility
    content_type = Column(String(20), default="plain")  # plain, html, markdown, structured
    content_blocks = Column(JSON, nullable=True)  # Structured content with inline styles per block
    styles = Column(JSON, nullable=True)  # Global document styles
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    owner = relationship("User", back_populates="documents")
    collaborators = relationship("DocumentCollaborator", back_populates="document", cascade="all, delete-orphan")
