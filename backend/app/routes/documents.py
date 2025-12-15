from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.document import DocumentCreate, DocumentUpdate, DocumentOut
from app.schemas.collaborator import CollaboratorAdd, CollaboratorOut, CollaboratorRemove, CollaboratorUpdateRole, ShareLinkCreate, ShareLinkOut
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
    get_document_collaborators,
    update_collaborator_role,
    create_share_link,
    accept_share_link,
    revoke_share_link,
    get_document_share_links,
    export_document_to_pdf,
    export_document_to_docx
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
    
    # CRITICAL: Check user's role for this document
    user_role = get_user_role_for_document(db, document_id, current_user.id)
    
    if not user_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You are not a collaborator on this document."
        )
    
    # Only owner and editor can update
    if user_role == "reader":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Readers cannot edit documents. Required role: owner or editor."
        )
    
    if user_role not in ["owner", "editor"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Your role '{user_role}' cannot edit documents. Required role: owner or editor."
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
    """Delete a document - ONLY owner can delete"""
    document = get_document_by_id(db, document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # CRITICAL: Check user's role for this document
    user_role = get_user_role_for_document(db, document_id, current_user.id)
    
    if not user_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You are not a collaborator on this document."
        )
    
    # ONLY owner can delete - very strict check
    if user_role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Only the document owner can delete documents. Your role: {user_role}"
        )
    
    # Double-check ownership via owner_id
    if document.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You are not the owner of this document."
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
    
    # Add user information to each collaborator
    result = []
    for collab in collaborators:
        collab_dict = {
            "id": collab.id,
            "document_id": collab.document_id,
            "user_id": collab.user_id,
            "role": collab.role,
            "username": collab.user.username if collab.user else None,
            "email": collab.user.email if collab.user else None
        }
        result.append(collab_dict)
    
    return result


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
            detail=f"Access denied. Only the document owner can add collaborators. Your role: {user_role or 'none'}"
        )
    
    # Check if the user to be added exists
    from app.models.user import User as UserModel
    user_to_add = db.query(UserModel).filter(UserModel.id == collaborator_data.user_id).first()
    if not user_to_add:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {collaborator_data.user_id} not found"
        )
    
    # Cannot add owner as collaborator (they're already the owner)
    if collaborator_data.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add yourself as a collaborator. You are already the owner."
        )
    
    # Check if user is already owner
    if collaborator_data.user_id == document.owner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot add the document owner as a collaborator."
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
            detail=f"Failed to add collaborator: {str(e)}"
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
            detail=f"Access denied. Only the document owner can remove collaborators. Your role: {user_role or 'none'}"
        )
    
    # Cannot remove owner
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove yourself (owner) from the document."
        )
    
    # Check if user to remove is the owner
    if user_id == document.owner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove the document owner."
        )
    
    success = remove_collaborator(db, document_id, user_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} is not a collaborator on this document."
        )
    
    return None


@router.put("/{document_id}/collaborators/{user_id}", response_model=CollaboratorOut)
def update_document_collaborator_role(
    document_id: int,
    user_id: int,
    role_data: CollaboratorUpdateRole,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a collaborator's role - only owner can update roles"""
    document = get_document_by_id(db, document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Only owner can update roles
    user_role = get_user_role_for_document(db, document_id, current_user.id)
    
    if user_role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied. Only the document owner can update collaborator roles. Your role: {user_role or 'none'}"
        )
    
    # Cannot update owner's role
    if user_id == document.owner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change the document owner's role."
        )
    
    try:
        updated_collaborator = update_collaborator_role(db, document_id, user_id, role_data.role)
        if not updated_collaborator:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User with ID {user_id} is not a collaborator on this document."
            )
        return updated_collaborator
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update collaborator role: {str(e)}"
        )


@router.post("/{document_id}/share", response_model=ShareLinkOut, status_code=status.HTTP_201_CREATED)
def create_document_share_link(
    document_id: int,
    share_data: ShareLinkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a shareable link for document - only owner can create share links"""
    document = get_document_by_id(db, document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Only owner can create share links
    user_role = get_user_role_for_document(db, document_id, current_user.id)
    if user_role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can create share links"
        )
    
    try:
        share_link = create_share_link(
            db,
            document_id,
            share_data.role,
            current_user.id,
            share_data.expires_in_hours
        )
        
        # Construct share URL (adjust base_url for production)
        base_url = "http://localhost:3000"  # Frontend URL
        share_url = f"{base_url}/share/{share_link.token}"
        
        return {
            "token": share_link.token,
            "role": share_link.role,
            "expires_at": share_link.expires_at,
            "share_url": share_url
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create share link"
        )


@router.post("/share/{token}/accept", response_model=CollaboratorOut)
def accept_document_share_link(
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Accept a share link and become a collaborator"""
    try:
        collaborator = accept_share_link(db, token, current_user.id)
        if not collaborator:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid or expired share link"
            )
        return collaborator
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to accept share link"
        )


@router.get("/{document_id}/share", response_model=List[ShareLinkOut])
def list_document_share_links(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all active share links for a document - only owner can view"""
    document = get_document_by_id(db, document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Only owner can view share links
    user_role = get_user_role_for_document(db, document_id, current_user.id)
    if user_role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can view share links"
        )
    
    share_links = get_document_share_links(db, document_id)
    
    base_url = "http://localhost:3000"
    return [
        {
            "token": link.token,
            "role": link.role,
            "expires_at": link.expires_at,
            "share_url": f"{base_url}/share/{link.token}"
        }
        for link in share_links
    ]


@router.delete("/{document_id}/share/{token}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_document_share_link(
    document_id: int,
    token: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke a share link - only owner can revoke"""
    document = get_document_by_id(db, document_id)
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    # Only owner can revoke share links
    user_role = get_user_role_for_document(db, document_id, current_user.id)
    if user_role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only owner can revoke share links"
        )
    
    success = revoke_share_link(db, document_id, token)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Share link not found"
        )
    
    return None


@router.get("/{document_id}/export/pdf")
def export_document_pdf(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export document as PDF
    
    Returns:
        PDF file download
        
    Raises:
        404: Document not found or no access
        500: Export failed
    """
    try:
        # Get document to get the title
        document = get_document_by_id(db, document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Check user access
        user_role = get_user_role_for_document(db, document_id, current_user.id)
        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Generate PDF
        pdf_buffer = export_document_to_pdf(db, document_id, current_user.id)
        
        # Create filename
        filename = f"{document.title.replace(' ', '_')}.pdf"
        
        # Return as streaming response
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export document to PDF: {str(e)}"
        )


@router.get("/{document_id}/export/docx")
def export_document_word(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Export document as Word (DOCX)
    
    Returns:
        DOCX file download
        
    Raises:
        404: Document not found or no access
        500: Export failed
    """
    try:
        # Get document to get the title
        document = get_document_by_id(db, document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Check user access
        user_role = get_user_role_for_document(db, document_id, current_user.id)
        if not user_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        # Generate DOCX
        docx_buffer = export_document_to_docx(db, document_id, current_user.id)
        
        # Create filename
        filename = f"{document.title.replace(' ', '_')}.docx"
        
        # Return as streaming response
        return StreamingResponse(
            docx_buffer,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export document to DOCX: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export document to Word: {str(e)}"
        )
