from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app.schemas.user import UserCreate, UserOut
from app.schemas.token import Token, TokenRefresh, PasswordResetRequest, PasswordReset
from app.services.auth_service import (
    create_user, 
    store_refresh_token, 
    create_password_reset_token, 
    reset_password
)
from app.core.security import (
    create_access_token, 
    create_refresh_token, 
    verify_password, 
    verify_refresh_token, 
    get_current_user
)
from app.models.user import User
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(get_db)):
    try:
        new_user = create_user(db, user)
        return new_user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    Login endpoint - OAuth2 compatible
    Use username field for email and password field for password
    """
    # Find user by email (OAuth2PasswordRequestForm uses 'username' field)
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Verify password
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account"
        )
    
    # Create tokens
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=access_token_expires
    )
    
    refresh_token = create_refresh_token(data={"sub": user.email})
    store_refresh_token(db, user, refresh_token)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token)
def refresh_token(token_data: TokenRefresh, db: Session = Depends(get_db)):
    """Get new access token using refresh token"""
    user_email = verify_refresh_token(token_data.refresh_token)
    
    if not user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Verify token matches database
    user = db.query(User).filter(User.email == user_email).first()
    if not user or user.refresh_token != token_data.refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Create new tokens
    access_token = create_access_token(data={"sub": user.email})
    new_refresh_token = create_refresh_token(data={"sub": user.email})
    store_refresh_token(db, user, new_refresh_token)
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.post("/password-reset-request")
def request_password_reset(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """Request password reset - sends token (in production, send via email)"""
    token = create_password_reset_token(db, request.email)
    
    if not token:
        # Don't reveal if email exists (security best practice)
        return {"message": "If the email exists, a reset link has been sent"}
    
    # In production: Send email with link like: https://yourapp.com/reset?token={token}
    # For now, return token (ONLY FOR DEVELOPMENT!)
    return {
        "message": "Password reset token generated",
        "token": token  # Remove this in production!
    }

@router.post("/password-reset")
def reset_user_password(reset_data: PasswordReset, db: Session = Depends(get_db)):
    """Reset password using token"""
    success = reset_password(db, reset_data.token, reset_data.new_password)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    return {"message": "Password reset successful"}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Logout - invalidate refresh token"""
    current_user.refresh_token = None
    db.commit()
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Get current user profile - requires authentication
    """
    return current_user

@router.get("/protected")
def protected_route(current_user: User = Depends(get_current_user)):
    """
    Example protected endpoint - requires authentication
    """
    return {
        "message": f"Hello {current_user.username or current_user.email}!",
        "user_id": current_user.id,
        "email": current_user.email
    }