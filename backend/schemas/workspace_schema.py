from pydantic import BaseModel, ConfigDict, Field, field_validator
from uuid import UUID
from datetime import datetime


class WorkspaceBase(BaseModel):
    name: str = Field(..., max_length=50)

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Workspace name must not be blank.")
        return value


class WorkspaceCreate(WorkspaceBase):
    pass


class WorkspaceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=3, max_length=50)

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, value: str | None) -> str | None:
        if value is not None and not value.strip():
            raise ValueError("Workspace name must not be blank.")
        return value

    model_config = ConfigDict(from_attributes=True)   # ✅ Add this to avoid schema warnings


class WorkspaceInDBBase(WorkspaceBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    owner_id: UUID
    created_at: datetime
    updated_at: datetime


class Workspace(WorkspaceInDBBase):
    pass

class WorkspaceOut(WorkspaceInDBBase):
    pass

