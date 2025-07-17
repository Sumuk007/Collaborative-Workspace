# tests/test_user_crud.py
import pytest
from schemas.user_schema import UserCreate
from crud.user_crud import create_user, get_user_by_email, authenticate_user
from fastapi import HTTPException


def test_create_user_success(db_session):
    user_in = UserCreate(name="Alice", email="alice@example.com", password="secret123")
    user = create_user(db_session, user_in)
    assert user.email == "alice@example.com"
    assert user.name == "Alice"


def test_create_duplicate_user(db_session):
    user_in = UserCreate(name="Alice", email="alice@example.com", password="secret123")
    create_user(db_session, user_in)

    with pytest.raises(HTTPException) as exc_info:
        create_user(db_session, user_in)

    assert exc_info.value.status_code == 400


def test_get_user_by_email_success(db_session):
    user_in = UserCreate(name="Alice", email="alice@example.com", password="secret123")
    create_user(db_session, user_in)

    user = get_user_by_email(db_session, "alice@example.com")
    assert user.email == "alice@example.com"


def test_authenticate_user_success(db_session):
    user_in = UserCreate(name="Alice", email="alice@example.com", password="secret123")
    create_user(db_session, user_in)

    user = authenticate_user(db_session, "alice@example.com", "secret123")
    assert user.email == "alice@example.com"


def test_authenticate_user_fail(db_session):
    user_in = UserCreate(name="Alice", email="alice@example.com", password="secret123")
    create_user(db_session, user_in)

    with pytest.raises(HTTPException) as exc_info:
        authenticate_user(db_session, "alice@example.com", "wrongpassword")

    assert exc_info.value.status_code == 401
