from sqlalchemy.orm import Session, joinedload
from app.models.document import Document
from app.models.user import User
from app.models.document_collaborator import DocumentCollaborator
from app.models.share_link import ShareLink
from app.schemas.document import DocumentCreate, DocumentUpdate
from typing import List, Optional, Literal
from datetime import datetime, timedelta
import secrets


def create_document(db: Session, document_data: DocumentCreate, owner_id: int) -> Document:
    """Create a new document"""
    # Sanitize title
    title = document_data.title.strip()
    
    if not title:
        raise ValueError("Title cannot be empty")
    
    # Check for duplicate title for this user
    existing = db.query(Document).filter(
        Document.owner_id == owner_id,
        Document.title == title
    ).first()
    
    if existing:
        raise ValueError(f"Document with title '{title}' already exists")
    
    db_document = Document(
        title=title,
        content=document_data.content or "",
        content_type=document_data.content_type or "plain",
        content_blocks=document_data.content_blocks,
        styles=document_data.styles,
        owner_id=owner_id
    )
    db.add(db_document)
    db.flush()  # Get the document ID before creating collaborator
    
    # Add owner as collaborator with 'owner' role
    owner_collab = DocumentCollaborator(
        document_id=db_document.id,
        user_id=owner_id,
        role="owner"
    )
    db.add(owner_collab)
    db.commit()
    db.refresh(db_document)
    return db_document


def get_document_by_id(db: Session, document_id: int) -> Optional[Document]:
    """Get a single document by ID"""
    return db.query(Document).filter(Document.id == document_id).first()


def get_user_documents(db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Document]:
    """Get all documents accessible to a user (owned or shared)"""
    return db.query(Document).join(DocumentCollaborator).filter(
        DocumentCollaborator.user_id == user_id
    ).order_by(Document.updated_at.desc()).offset(skip).limit(limit).all()


def get_all_documents(db: Session, skip: int = 0, limit: int = 100) -> List[Document]:
    """Get all documents (for admin or public view)"""
    return db.query(Document).offset(skip).limit(limit).all()


def update_document(db: Session, document_id: int, document_data: DocumentUpdate) -> Optional[Document]:
    """Update a document"""
    db_document = db.query(Document).filter(Document.id == document_id).first()
    
    if not db_document:
        return None
    
    # Update only provided fields
    update_data = document_data.model_dump(exclude_unset=True)
    
    # Validate title if being updated
    if 'title' in update_data:
        title = update_data['title'].strip() if update_data['title'] else None
        
        if not title:
            raise ValueError("Title cannot be empty")
        
        # Check for duplicate title for this user (excluding current document)
        existing = db.query(Document).filter(
            Document.owner_id == db_document.owner_id,
            Document.title == title,
            Document.id != document_id
        ).first()
        
        if existing:
            raise ValueError(f"Document with title '{title}' already exists")
        
        update_data['title'] = title
    
    for field, value in update_data.items():
        setattr(db_document, field, value)
    
    db.commit()
    db.refresh(db_document)
    return db_document


def delete_document(db: Session, document_id: int) -> bool:
    """Delete a document"""
    db_document = db.query(Document).filter(Document.id == document_id).first()
    
    if not db_document:
        return False
    
    db.delete(db_document)
    db.commit()
    return True


def search_documents(db: Session, query: str, user_id: Optional[int] = None, skip: int = 0, limit: int = 100) -> List[Document]:
    """Search documents by title or content"""
    search_query = db.query(Document).filter(
        (Document.title.ilike(f"%{query}%")) | (Document.content.ilike(f"%{query}%"))
    )
    
    if user_id:
        search_query = search_query.filter(Document.owner_id == user_id)
    
    return search_query.offset(skip).limit(limit).all()


def get_user_role_for_document(db: Session, document_id: int, user_id: int) -> Optional[str]:
    """Get user's role for a specific document"""
    collaborator = db.query(DocumentCollaborator).filter(
        DocumentCollaborator.document_id == document_id,
        DocumentCollaborator.user_id == user_id
    ).first()
    
    return collaborator.role if collaborator else None


def add_collaborator(db: Session, document_id: int, user_id: int, role: Literal["editor", "reader"]) -> DocumentCollaborator:
    """Add a collaborator to a document"""
    # Check if collaborator already exists
    existing = db.query(DocumentCollaborator).filter(
        DocumentCollaborator.document_id == document_id,
        DocumentCollaborator.user_id == user_id
    ).first()
    
    if existing:
        raise ValueError(f"User already has '{existing.role}' role on this document")
    
    # Validate role
    if role not in ["editor", "reader"]:
        raise ValueError("Role must be 'editor' or 'reader'")
    
    collaborator = DocumentCollaborator(
        document_id=document_id,
        user_id=user_id,
        role=role
    )
    db.add(collaborator)
    db.commit()
    db.refresh(collaborator)
    return collaborator


def remove_collaborator(db: Session, document_id: int, user_id: int) -> bool:
    """Remove a collaborator from a document"""
    collaborator = db.query(DocumentCollaborator).filter(
        DocumentCollaborator.document_id == document_id,
        DocumentCollaborator.user_id == user_id,
        DocumentCollaborator.role != "owner"  # Cannot remove owner
    ).first()
    
    if not collaborator:
        return False
    
    db.delete(collaborator)
    db.commit()
    return True


def get_document_collaborators(db: Session, document_id: int) -> List[DocumentCollaborator]:
    """Get all collaborators for a document with user information"""
    return db.query(DocumentCollaborator).options(
        joinedload(DocumentCollaborator.user)
    ).filter(
        DocumentCollaborator.document_id == document_id
    ).all()


def create_share_link(db: Session, document_id: int, role: str, created_by: int, expires_in_hours: Optional[int] = None) -> ShareLink:
    """Create a shareable link for a document"""
    token = secrets.token_urlsafe(32)
    
    expires_at = None
    if expires_in_hours:
        expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)
    
    share_link = ShareLink(
        document_id=document_id,
        token=token,
        role=role,
        created_by=created_by,
        expires_at=expires_at
    )
    db.add(share_link)
    db.commit()
    db.refresh(share_link)
    return share_link


def get_share_link_by_token(db: Session, token: str) -> Optional[ShareLink]:
    """Get a share link by token"""
    share_link = db.query(ShareLink).filter(
        ShareLink.token == token,
        ShareLink.is_active == 1
    ).first()
    
    if not share_link:
        return None
    
    # Check if expired
    if share_link.expires_at and share_link.expires_at < datetime.utcnow():
        return None
    
    return share_link


def accept_share_link(db: Session, token: str, user_id: int) -> Optional[DocumentCollaborator]:
    """Accept a share link and add user as collaborator or update their role"""
    share_link = get_share_link_by_token(db, token)
    
    if not share_link:
        return None
    
    # Check if user is already a collaborator
    existing = db.query(DocumentCollaborator).filter(
        DocumentCollaborator.document_id == share_link.document_id,
        DocumentCollaborator.user_id == user_id
    ).first()
    
    if existing:
        # Don't allow changing owner role
        if existing.role == "owner":
            raise ValueError("You are already the owner of this document")
        
        # If the new role is different, update it
        if existing.role != share_link.role:
            existing.role = share_link.role
            db.commit()
            db.refresh(existing)
            return existing
        else:
            # Same role, just return the existing collaborator
            raise ValueError(f"You are already a {existing.role} on this document")
    
    # Add user as collaborator
    collaborator = DocumentCollaborator(
        document_id=share_link.document_id,
        user_id=user_id,
        role=share_link.role
    )
    db.add(collaborator)
    db.commit()
    db.refresh(collaborator)
    return collaborator


def revoke_share_link(db: Session, document_id: int, token: str) -> bool:
    """Revoke/disable a share link"""
    share_link = db.query(ShareLink).filter(
        ShareLink.document_id == document_id,
        ShareLink.token == token
    ).first()
    
    if not share_link:
        return False
    
    share_link.is_active = 0
    db.commit()
    return True


def update_collaborator_role(db: Session, document_id: int, user_id: int, new_role: Literal["editor", "reader"]) -> Optional[DocumentCollaborator]:
    """Update a collaborator's role - cannot change owner role"""
    collaborator = db.query(DocumentCollaborator).filter(
        DocumentCollaborator.document_id == document_id,
        DocumentCollaborator.user_id == user_id
    ).first()
    
    if not collaborator:
        return None
    
    # Cannot change owner role
    if collaborator.role == "owner":
        raise ValueError("Cannot change owner's role")
    
    # Validate new role
    if new_role not in ["editor", "reader"]:
        raise ValueError("Role must be 'editor' or 'reader'")
    
    collaborator.role = new_role
    db.commit()
    db.refresh(collaborator)
    return collaborator


def get_document_share_links(db: Session, document_id: int) -> List[ShareLink]:
    """Get all share links for a document"""
    return db.query(ShareLink).filter(
        ShareLink.document_id == document_id,
        ShareLink.is_active == 1
    ).all()
