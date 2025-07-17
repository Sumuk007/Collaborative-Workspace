from pydantic import BaseModel, UUID4
from typing import Optional, Dict, Any
from datetime import datetime


class DocumentBase(BaseModel):
    title: str
    content: Dict[str, Any]  # JSON structure for rich text


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[Dict[str, Any]] = None


class DocumentResponse(DocumentBase):
    id: UUID4
    owner_id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
