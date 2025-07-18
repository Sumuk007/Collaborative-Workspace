from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from db.dependency import get_db
from schemas.document_schema import DocumentCreate, DocumentUpdate, DocumentResponse
from models.document import Document as DocumentModel
from models.user import User
from models.membership import Membership
from utils.permissions import check_permission
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
        detail="You are not a member of this workspace."
    )


@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document_endpoint(
    workspace_id: UUID = Query(..., description="Workspace ID to create the document in"),
    document_in: DocumentCreate = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    membership = get_user_membership(db, current_user.id, workspace_id)
    check_permission(membership,"create_document")
    db_document = create_document(db, owner_id=current_user.id, workspace_id=workspace_id, document=document_in)
    return db_document


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document_endpoint(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_document = db.query(DocumentModel).filter(DocumentModel.id == document_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found.")
    get_user_membership(db, current_user.id, db_document.workspace_id)
    return get_document_by_id(db, document_id)


@router.get("/user/me/", response_model=list[DocumentResponse])
def get_my_documents(
    workspace_id: UUID = Query(..., description="Workspace ID to list documents from"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    membership = get_user_membership(db, current_user.id, workspace_id)
    return get_documents_by_owner(db, current_user.id, membership)


@router.patch("/{document_id}", response_model=DocumentResponse)
def update_document_endpoint(
    document_id: UUID,
    updates: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_document = db.query(DocumentModel).filter(DocumentModel.id == document_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found.")
    membership=get_user_membership(db, current_user.id, db_document.workspace_id)
    check_permission(membership,"edit_document")
    return update_document(db, db_document, updates)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document_endpoint(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_document = db.query(DocumentModel).filter(DocumentModel.id == document_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found.")
    membership=get_user_membership(db, current_user.id, db_document.workspace_id)
    check_permission(membership, "delete_document")
    delete_document(db, db_document)
    return None
