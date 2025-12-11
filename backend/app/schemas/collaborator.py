from pydantic import BaseModel, Field, field_validator
from typing import Literal

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
    
    class Config:
        from_attributes = True

class CollaboratorRemove(BaseModel):
    user_id: int = Field(..., gt=0)
