from pydantic import BaseModel, Field, constr, ConfigDict
from uuid import UUID
from typing import Optional
from datetime import datetime


class RoleBase(BaseModel):
    name: constr(min_length=1)
    is_default: Optional[bool] = False


class RoleCreate(RoleBase):
    workspace_id: UUID


class RoleUpdate(BaseModel):
    name: Optional[constr(min_length=1)] = None
    is_default: Optional[bool] = None


class RoleOut(RoleBase):
    id: UUID
    workspace_id: UUID
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        model_config = ConfigDict(from_attributes=True)
