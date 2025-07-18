from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.document import Document
from schemas.document_schema import DocumentCreate, DocumentUpdate
from utils.permissions import check_permission


def create_document(db: Session, owner_id, document: DocumentCreate, membership):
    check_permission(membership, "create_document")

    db_document = Document(
        title=document.title,
        content=document.content,
        owner_id=owner_id
    )
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document


def get_document_by_id(db: Session, document_id, membership):
    check_permission(membership, "view_document")

    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    return document


def get_documents_by_owner(db: Session, owner_id, membership):
    check_permission(membership, "view_document")

    documents = db.query(Document).filter(Document.owner_id == owner_id).all()
    if not documents:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No documents found for this user"
        )
    return documents


def update_document(db: Session, db_document: Document, updates: DocumentUpdate, membership):
    check_permission(membership, "edit_document")

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


def delete_document(db: Session, db_document: Document, membership):
    check_permission(membership, "delete_document")

    if db_document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    db.delete(db_document)
    db.commit()
    return {"detail": "Document deleted successfully"}
