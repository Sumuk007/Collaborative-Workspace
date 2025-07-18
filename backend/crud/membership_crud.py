from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.membership import Membership
from schemas.membership_schema import MembershipCreate, MembershipUpdate
import uuid


def create_membership(db: Session, workspace_id, membership: MembershipCreate):
    db_membership = Membership(
        user_id=membership.user_id,
        workspace_id=workspace_id,
        role_id=membership.role_id  # ✅ role_id, not role
    )
    db.add(db_membership)
    db.commit()
    db.refresh(db_membership)
    return db_membership


def get_membership_by_id(db: Session, membership_id):
    membership = db.query(Membership).filter(Membership.id == membership_id).first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Membership not found"
        )
    return membership


def get_memberships_by_workspace(db: Session, workspace_id):
    return db.query(Membership).filter(Membership.workspace_id == workspace_id).all()


def get_memberships_by_user(db: Session, user_id: uuid.UUID):
    return db.query(Membership).filter(Membership.user_id == user_id).all()


def update_membership(db: Session, db_membership: Membership, updates: MembershipUpdate):
    if updates.role_id is not None:  # ✅ role_id
        db_membership.role_id = updates.role_id
    db.commit()
    db.refresh(db_membership)
    return db_membership


def delete_membership(db: Session, db_membership: Membership):
    db.delete(db_membership)
    db.commit()
    return {"detail": "Membership deleted successfully"}
