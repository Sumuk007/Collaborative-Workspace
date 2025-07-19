from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.document import Document
from schemas.document_schema import DocumentCreate, DocumentUpdate
from utils.permissions import check_permission
from models.membership import Membership
from uuid import UUID
from typing import List


def create_document(db: Session, owner_id: UUID, workspace_id: UUID, document: DocumentCreate):
    db_document = Document(
        title=document.title,
        content=document.content,
        owner_id=owner_id,
        workspace_id=workspace_id  # Assuming you have workspace_id on Document
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document


def get_document_by_id(db: Session, document_id: UUID):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return document


def get_documents_by_owner(db: Session, owner_id: UUID, membership: Membership) -> List[Document]:
    check_permission(membership, "view_document")
    return db.query(Document).filter(Document.owner_id == owner_id, Document.workspace_id == membership.workspace_id).all()


def update_document(db: Session, db_document: Document, updates: DocumentUpdate):
    if updates.title is None and updates.content is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided for update"
        )

    if updates.title is not None:
        db_document.title = updates.title
    if updates.content is not None:
        db_document.content = updates.content

    db.commit()
    db.refresh(db_document)
    return db_document


def delete_document(db: Session, db_document: Document):
    db.delete(db_document)
    db.commit()
    # 204 No Content expects no return.
