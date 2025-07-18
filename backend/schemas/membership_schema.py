from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime


class MembershipBase(BaseModel):
    role_id: UUID  # ✅ FK to Role.id


class MembershipCreate(MembershipBase):
    user_id: UUID


class MembershipUpdate(BaseModel):
    role_id: UUID | None = None


class MembershipInDBBase(MembershipBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    workspace_id: UUID
    created_at: datetime
    updated_at: datetime


class Membership_all(MembershipInDBBase):
    pass
