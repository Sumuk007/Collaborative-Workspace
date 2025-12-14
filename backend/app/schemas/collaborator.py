from pydantic import BaseModel, Field, field_validator
from typing import Literal, Optional
from datetime import datetime

class CollaboratorAdd(BaseModel):
    user_id: int = Field(..., gt=0)
    role: Literal["editor", "reader"]
    
    @field_validator('role')
    @classmethod
    def validate_role(cls, v):
        if v not in ["editor", "reader"]:
            raise ValueError('Role must be either "editor" or "reader"')
        return v

class CollaboratorOut(BaseModel):
    id: int
    document_id: int
    user_id: int
    role: str
    username: Optional[str] = None
    email: Optional[str] = None
    
    class Config:
        from_attributes = True

class CollaboratorRemove(BaseModel):
    user_id: int = Field(..., gt=0)

class CollaboratorUpdateRole(BaseModel):
    role: Literal["editor", "reader"]

class ShareLinkCreate(BaseModel):
    role: Literal["editor", "reader"] = "reader"
    expires_in_hours: Optional[int] = Field(None, ge=1, le=720)  # Max 30 days

class ShareLinkOut(BaseModel):
    token: str
    role: str
    expires_at: Optional[datetime]
    share_url: str
    
    class Config:
        from_attributes = True
