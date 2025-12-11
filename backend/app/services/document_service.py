from sqlalchemy.orm import Session
from app.models.document import Document
from app.models.user import User
from app.models.document_collaborator import DocumentCollaborator
from app.schemas.document import DocumentCreate, DocumentUpdate
from typing import List, Optional, Literal


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
    """Get all documents owned by a user"""
    return db.query(Document).filter(Document.owner_id == user_id).offset(skip).limit(limit).all()


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
        raise ValueError("User is already a collaborator")
    
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
    """Get all collaborators for a document"""
    return db.query(DocumentCollaborator).filter(
        DocumentCollaborator.document_id == document_id
    ).all()
