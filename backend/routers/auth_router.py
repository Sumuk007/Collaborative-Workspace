from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from db.dependency import get_db
from schemas.user_schema import UserCreate, UserLogin, UserOut, PasswordResetRequest, ResetPasswordRequest
from models.document import Document
from models.user import User
from models.workspace import Workspace
from models.membership import Membership
from models.role import Role
from utils.email import send_password_reset_email
from utils.token import verify_reset_token, generate_reset_token
from utils.password import hash_password, verify_password
from utils.auth import create_access_token, get_current_user
from uuid import uuid4

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserOut)
def signup(user_in: UserCreate, db: Session = Depends(get_db)):
    print("received:", user_in)
    existing_user = db.query(User).filter(User.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed_password = hash_password(user_in.password)
    db_user = User(
        id=uuid4(),
        email=user_in.email,
        name=user_in.name,
        password_hash=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/login")
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user_in.email).first()
    if not db_user or not verify_password(user_in.password, db_user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    access_token = create_access_token(data={"sub": str(db_user.id)})
    print("access token:",access_token)

    response = JSONResponse(content={"message": "Login successful"})
    response.set_cookie(
    key="access_token",
    value=access_token,
    httponly=True,
    secure=False,
    samesite="Lax",
    path="/",
    max_age=3600  # <---- Cookie expires in 1 hour
)
    return response

@router.post("/logout")
def logout():
    response = JSONResponse(content={"message": "Logged out"})
    response.delete_cookie("access_token")
    return response


@router.post("/forgot-password")
def forgot_password(request: PasswordResetRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User with this email not found")

    # Here you would typically generate a secure token and store it with expiry.
    reset_token = generate_reset_token(request.email)  #  Generate real token
    
    # Send email with reset link
    send_password_reset_email(request.email, reset_token)
    return {"msg": "Password reset link sent to your email."}

@router.post("/reset-password")
def reset_password(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = verify_reset_token(request.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(request.new_password)
    db.commit()
    return {"msg": "Password reset successful."}

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
