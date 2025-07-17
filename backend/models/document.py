from sqlalchemy import Column, String, TIMESTAMP, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSON
from sqlalchemy.orm import relationship
import uuid
from db.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    content = Column(JSON, nullable=False, default=dict)  # Rich text editor stores JSON structure

    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now(), server_default=func.now())
    workspace_id = Column(UUID(as_uuid=True), ForeignKey("workspaces.id"), nullable=True)

      # Relationship (Optional, helps for ORM queries)
    owner = relationship("User", back_populates="documents")
    workspace = relationship("Workspace", back_populates="documents")
