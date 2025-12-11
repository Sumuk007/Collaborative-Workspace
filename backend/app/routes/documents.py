from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentOut
from app.schemas.collaborator import CollaboratorAdd, CollaboratorOut, CollaboratorRemove
from app.services.document_service import (
    create_document,
    get_document_by_id,
    get_user_documents,
    get_all_documents,
    update_document,
    delete_document,
    search_documents,
    get_user_role_for_document,
    add_collaborator,
    remove_collaborator,
    get_document_collaborators
)
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def create_new_document(
    document: DocumentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new document - requires authentication"""
    try:
        new_document = create_document(db, document, current_user.id)
        return new_document
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create document"
        )


@router.get("/", response_model=List[DocumentOut])
def list_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all documents for the current user"""
    documents = get_user_documents(db, current_user.id, skip, limit)
    return documents


@router.get("/all", response_model=List[DocumentOut])
def list_all_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get all documents (public endpoint for browsing)"""
    documents = get_all_documents(db, skip, limit)
    return documents


@router.get("/search", response_model=List[DocumentOut])
def search_user_documents(
    q: str = Query(..., min_length=1, max_length=100),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search in current user's documents"""
    # Sanitize search query
    query = q.strip()
    if not query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Search query cannot be empty"
        )
    
    documents = search_documents(db, query, current_user.id, skip, limit)
    return documents


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific document by ID"""
    document = get_document_by_id(db, document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check if user has access to the document (owner, editor, or reader)
    user_role = get_user_role_for_document(db, document_id, current_user.id)
    if not user_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this document"
        )
    
    return document


@router.put("/{document_id}", response_model=DocumentOut)
def update_existing_document(
    document_id: int,
    document_data: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a document - owner and editor can update"""
    document = get_document_by_id(db, document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check user's role for this document
    user_role = get_user_role_for_document(db, document_id, current_user.id)
    
    if not user_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this document"
        )
    
    # Only owner and editor can update
    if user_role not in ["owner", "editor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner and editor can update this document"
        )
    
    # Validate that at least one field is being updated
    if not any(document_data.model_dump(exclude_unset=True).values()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    try:
        updated_document = update_document(db, document_id, document_data)
        return updated_document
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update document"
        )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a document - only owner can delete"""
    document = get_document_by_id(db, document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check user's role for this document
    user_role = get_user_role_for_document(db, document_id, current_user.id)
    
    if not user_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this document"
        )
    
    # Only owner can delete
    if user_role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can delete this document"
        )
    
    delete_document(db, document_id)
    return None


@router.get("/{document_id}/collaborators", response_model=List[CollaboratorOut])
def list_document_collaborators(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all collaborators for a document - any collaborator can view"""
    document = get_document_by_id(db, document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check if current user has access to the document
    user_role = get_user_role_for_document(db, document_id, current_user.id)
    
    if not user_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this document"
        )
    
    collaborators = get_document_collaborators(db, document_id)
    return collaborators


@router.post("/{document_id}/collaborators", response_model=CollaboratorOut, status_code=status.HTTP_201_CREATED)
def add_document_collaborator(
    document_id: int,
    collaborator_data: CollaboratorAdd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a collaborator to a document - only owner can add collaborators"""
    document = get_document_by_id(db, document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check if current user is the owner
    user_role = get_user_role_for_document(db, document_id, current_user.id)
    
    if user_role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can add collaborators"
        )
    
    # Check if the user to be added exists
    from app.models.user import User as UserModel
    user_to_add = db.query(UserModel).filter(UserModel.id == collaborator_data.user_id).first()
    if not user_to_add:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Cannot add owner as collaborator (they're already the owner)
    if collaborator_data.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add yourself as collaborator"
        )
    
    try:
        collaborator = add_collaborator(db, document_id, collaborator_data.user_id, collaborator_data.role)
        return collaborator
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add collaborator"
        )


@router.delete("/{document_id}/collaborators/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_document_collaborator(
    document_id: int,
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a collaborator from a document - only owner can remove collaborators"""
    document = get_document_by_id(db, document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Check if current user is the owner
    user_role = get_user_role_for_document(db, document_id, current_user.id)
    
    if user_role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can remove collaborators"
        )
    
    # Cannot remove owner
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove owner from document"
        )
    
    success = remove_collaborator(db, document_id, user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaborator not found"
        )
    
    return None
