from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from app.database import Base

class ShareLink(Base):
    __tablename__ = "share_links"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(64), unique=True, index=True, nullable=False)
    role = Column(String(20), nullable=False)  # 'editor' or 'reader'
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    expires_at = Column(DateTime, nullable=True)  # NULL = never expires
    is_active = Column(Integer, default=1)  # 0 = disabled, 1 = active
