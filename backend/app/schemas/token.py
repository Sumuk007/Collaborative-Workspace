from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    refresh_token: str  # Add this
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

class TokenRefresh(BaseModel):
    refresh_token: str

class PasswordResetRequest(BaseModel):
    email: str

class PasswordReset(BaseModel):
    token: str
    new_password: str