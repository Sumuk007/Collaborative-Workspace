from pydantic import BaseModel, EmailStr, UUID4, Field, constr
from typing import Optional
from datetime import datetime


class UserBase(BaseModel):
    name: Optional[constr(strip_whitespace=True, min_length=2, max_length=50)]
    email: EmailStr


class UserCreate(UserBase):
    password: Optional[constr(strip_whitespace=True, min_length=8, max_length=128)]


class UserResponse(UserBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
