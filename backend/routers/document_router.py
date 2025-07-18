from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.dependency import get_db
from schemas.document_schema import DocumentCreate, DocumentUpdate, DocumentResponse
from models.document import Document as DocumentModel
from models.user import User
from models.membership import Membership
from utils.auth import get_current_user
from crud.document_crud import (
    create_document,
    get_document_by_id,
    get_documents_by_owner,
    update_document,
    delete_document
)
from crud.membership_crud import get_memberships_by_user

from uuid import UUID

router = APIRouter(prefix="/documents", tags=["Documents"])


def get_user_membership(db: Session, user_id: UUID, workspace_id: UUID) -> Membership:
    memberships = get_memberships_by_user(db, user_id)
    for m in memberships:
        if m.workspace_id == workspace_id:
            return m
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Not a member of this workspace."
    )


@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document_endpoint(
    workspace_id: UUID,
    document_in: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    membership = get_user_membership(db, current_user.id, workspace_id)
    db_document = create_document(db, owner_id=current_user.id, document=document_in, membership=membership)
    return db_document


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document_endpoint(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_document = db.query(DocumentModel).filter(DocumentModel.id == document_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
    membership = get_user_membership(db, current_user.id, db_document.workspace_id)
    return get_document_by_id(db, document_id, membership)


@router.get("/user/me/", response_model=list[DocumentResponse])
def get_my_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    memberships = get_memberships_by_user(db, current_user.id)
    all_documents = []
    for membership in memberships:
        documents = get_documents_by_owner(db, current_user.id, membership)
        all_documents.extend(documents)
    return all_documents


@router.patch("/{document_id}", response_model=DocumentResponse)
def update_document_endpoint(
    document_id: UUID,
    updates: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_document = db.query(DocumentModel).filter(DocumentModel.id == document_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
    membership = get_user_membership(db, current_user.id, db_document.workspace_id)
    return update_document(db, db_document, updates, membership)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document_endpoint(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_document = db.query(DocumentModel).filter(DocumentModel.id == document_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
    membership = get_user_membership(db, current_user.id, db_document.workspace_id)
    delete_document(db, db_document, membership)
    return None
