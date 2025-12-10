from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
from app.core.security import hash_password, create_reset_token
from app.config import settings
from datetime import datetime, timedelta, timezone
from typing import Optional


def create_user(db: Session, user_create: UserCreate) -> User:
    existing_user = db.query(User).filter(User.email == user_create.email).first()
    if existing_user:
        raise ValueError("User with this email already exists.")
    
    if user_create.username:
        existing_username = db.query(User).filter(User.username == user_create.username).first()
        if existing_username:
            raise ValueError("Username already taken.")
    
    hashed_pw = hash_password(user_create.password)
    db_user = User(
        email=user_create.email,
        username=user_create.username,
        hashed_password=hashed_pw,
    )
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        db.rollback()
        raise e

def store_refresh_token(db: Session, user: User, refresh_token: str):
    """Store refresh token in database"""
    user.refresh_token = refresh_token
    db.commit()

def create_password_reset_token(db: Session, email: str) -> Optional[str]:
    """Generate and store password reset token"""
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    
    reset_token = create_reset_token()
    user.reset_token = reset_token
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(minutes=settings.reset_token_expire_minutes)
    db.commit()
    
    return reset_token

def reset_password(db: Session, token: str, new_password: str) -> bool:
    """Reset password using token"""
    user = db.query(User).filter(User.reset_token == token).first()
    
    if not user:
        return False
    
    # Check if token expired - make sure both are timezone-aware
    expires_utc = user.reset_token_expires.replace(tzinfo=timezone.utc)
    if expires_utc < datetime.now(timezone.utc):
        return False
    
    # Update password
    user.hashed_password = hash_password(new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()
    
    return True