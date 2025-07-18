import uuid
import pytest
from sqlalchemy.orm import Session
from crud.document_crud import (
    create_document,
    get_document_by_id,
    get_documents_by_owner,
    update_document,
    delete_document,
)
from schemas.document_schema import DocumentCreate, DocumentUpdate
from models.document import Document


class FakeMembership:
    def __init__(self, permissions):
        self.role = type("Role", (), {"permissions": permissions})


def test_create_document(db_session: Session):
    membership = FakeMembership(["create_document"])
    owner_id = uuid.uuid4()
    document_in = DocumentCreate(title="Test Title", content={"key": "value"})
    document = create_document(db_session, owner_id, document_in, membership)

    assert document.title == "Test Title"
    assert document.content == {"key": "value"}
    assert document.owner_id == owner_id


def test_get_document_by_id_success(db_session: Session):
    membership = FakeMembership(["view_document"])
    owner_id = uuid.uuid4()
    document = Document(title="Title", content={"a": 1}, owner_id=owner_id)
    db_session.add(document)
    db_session.commit()
    db_session.refresh(document)

    found = get_document_by_id(db_session, document.id, membership)
    assert found.id == document.id


def test_get_documents_by_owner_success(db_session: Session):
    membership = FakeMembership(["view_document"])
    owner_id = uuid.uuid4()
    document = Document(title="Title", content={"b": 2}, owner_id=owner_id)
    db_session.add(document)
    db_session.commit()
    db_session.refresh(document)

    documents = get_documents_by_owner(db_session, owner_id, membership)
    assert len(documents) >= 1
    assert documents[0].owner_id == owner_id


def test_update_document_success(db_session: Session):
    membership = FakeMembership(["edit_document"])
    owner_id = uuid.uuid4()
    document = Document(title="Old Title", content={"old": True}, owner_id=owner_id)
    db_session.add(document)
    db_session.commit()
    db_session.refresh(document)

    updates = DocumentUpdate(title="New Title", content={"new": True})
    updated = update_document(db_session, document, updates, membership)

    assert updated.title == "New Title"
    assert updated.content == {"new": True}


def test_update_document_no_fields(db_session: Session):
    membership = FakeMembership(["edit_document"])
    owner_id = uuid.uuid4()
    document = Document(title="Unchanged", content={"c": 3}, owner_id=owner_id)
    db_session.add(document)
    db_session.commit()
    db_session.refresh(document)

    with pytest.raises(Exception) as exc:
        update_document(db_session, document, DocumentUpdate(), membership)
    assert "No fields provided for update" in str(exc.value)


def test_delete_document_success(db_session: Session):
    membership = FakeMembership(["delete_document"])
    owner_id = uuid.uuid4()
    document = Document(title="To Delete", content={"d": 4}, owner_id=owner_id)
    db_session.add(document)
    db_session.commit()
    db_session.refresh(document)

    result = delete_document(db_session, document, membership)
    assert result["detail"] == "Document deleted successfully"
