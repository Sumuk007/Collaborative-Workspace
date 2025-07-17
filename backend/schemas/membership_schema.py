from enum import Enum
from pydantic import BaseModel, ConfigDict, Field
from uuid import UUID
from datetime import datetime


class RoleEnum(str, Enum):
    OWNER = "owner"
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class MembershipBase(BaseModel):
    role: RoleEnum = Field(default=RoleEnum.MEMBER)


class MembershipCreate(MembershipBase):
    user_id: UUID


class MembershipUpdate(BaseModel):
    role: RoleEnum | None = None


class MembershipInDBBase(MembershipBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    workspace_id: UUID
    created_at: datetime
    updated_at: datetime


class Membership(MembershipInDBBase):
    pass