import pytest
from sqlalchemy.exc import IntegrityError
import uuid
from schemas.document_schema import DocumentCreate, DocumentUpdate
from crud.document_crud import (
    create_document,
    get_document_by_id,
    get_documents_by_owner,
    update_document,
    delete_document
)
from models.document import Document
from fastapi import HTTPException


def test_create_document(db_session):
    document_in = DocumentCreate(title="Doc 1", content={"key": "value"})
    id=uuid.uuid4()
    document = create_document(db_session, owner_id=id, document=document_in)

    assert document.id is not None
    assert document.title == "Doc 1"
    assert document.content == {"key": "value"}
    assert document.owner_id == id


def test_get_document_by_id_success(db_session):
    id=uuid.uuid4()
    document_in = DocumentCreate(title="Doc 2", content={"foo": "bar"})
    created = create_document(db_session, owner_id=id, document=document_in)
    fetched = get_document_by_id(db_session, created.id)

    assert fetched.id == created.id
    assert fetched.title == created.title


def test_get_document_by_id_not_found(db_session):
    id=uuid.uuid4()
    with pytest.raises(HTTPException) as exc:
        get_document_by_id(db_session, document_id=id)
    assert exc.value.status_code == 404


def test_get_documents_by_owner_success(db_session):
    id=uuid.uuid4()
    create_document(db_session, owner_id=id, document=DocumentCreate(title="Doc A", content={"x": 1}))
    create_document(db_session, owner_id=id, document=DocumentCreate(title="Doc B", content={"y": 2}))
    documents = get_documents_by_owner(db_session, owner_id=id)

    assert len(documents) == 2


def test_get_documents_by_owner_not_found(db_session):
    id=uuid.uuid4()
    with pytest.raises(HTTPException) as exc:
        get_documents_by_owner(db_session, owner_id=id)
    assert exc.value.status_code == 404


def test_update_document_success(db_session):
    id=uuid.uuid4()
    document = create_document(db_session, owner_id=id, document=DocumentCreate(title="Old Title", content={"a": 1}))
    updated = update_document(db_session, document, DocumentUpdate(title="New Title", content={"b": 2}))

    assert updated.title == "New Title"
    assert updated.content == {"b": 2}


def test_update_document_no_fields(db_session):
    id=uuid.uuid4()
    document = create_document(db_session, owner_id=id, document=DocumentCreate(title="Unchanged", content={"c": 3}))
    with pytest.raises(HTTPException) as exc:
        update_document(db_session, document, DocumentUpdate())
    assert exc.value.status_code == 400


def test_delete_document_success(db_session):
    id=uuid.uuid4()
    document = create_document(db_session, owner_id=id, document=DocumentCreate(title="To Delete", content={"del": 1}))
    response = delete_document(db_session, document)

    assert response == {"detail": "Document deleted successfully"}

    with pytest.raises(HTTPException):
        get_document_by_id(db_session, document.id)


def test_delete_document_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        delete_document(db_session, None)
    assert exc.value.status_code == 404
