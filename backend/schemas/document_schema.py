from pydantic import BaseModel, ConfigDict
from uuid import UUID
from typing import Optional, Dict, Any
from datetime import datetime


class DocumentBase(BaseModel):
    title: str
    content: Dict  # JSON structure for rich text


class DocumentCreate(DocumentBase):
    pass


class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[Dict] = None


class DocumentResponse(DocumentBase):
    id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime

class DocumentOut(BaseModel):
    id: UUID
    title: str
    workspace_id: UUID
    content: dict  # Return JSON to frontend
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True,
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }