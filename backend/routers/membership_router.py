from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.dependency import get_db
from schemas.membership_schema import Membership_all, MembershipCreate, MembershipUpdate
from models.membership import Membership
from crud.membership_crud import (
    create_membership,
    get_membership_by_id,
    get_memberships_by_workspace,
    get_memberships_by_user,
    update_membership,
    delete_membership
)
from utils.auth import get_current_user
from models.user import User
from models.workspace import Workspace
from uuid import UUID


router = APIRouter(prefix="/memberships", tags=["Memberships"])


@router.post("/{workspace_id}", response_model=Membership_all, status_code=status.HTTP_201_CREATED)
def add_membership(
    workspace_id: UUID,
    membership_in: MembershipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 🚩 Ensure only workspace owner can invite
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found.")
    if workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only workspace owners can invite members.")

    # 🚩 Check if membership already exists
    existing_membership = db.query(Membership).filter(
        Membership.workspace_id == workspace_id,
        Membership.user_id == membership_in.user_id
    ).first()
    if existing_membership:
        raise HTTPException(
            status_code=400,
            detail="User is already a member of this workspace."
        )
    
    # 🚩 Prevent owner from being assigned a different role
    if membership_in.user_id == workspace.owner_id:
        raise HTTPException(
            status_code=400,
            detail="Workspace owner already has a membership and cannot be assigned a different role."
        )

    return create_membership(db, workspace_id, membership_in)



@router.get("/workspace/{workspace_id}", response_model=list[Membership_all])
def list_workspace_memberships(
    workspace_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 🚩 Optional: Ensure current_user is a member
    return get_memberships_by_workspace(db, workspace_id)


@router.get("/user/{user_id}", response_model=list[Membership_all])
def list_user_memberships(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 🚩 Only allow current user to fetch their memberships (or admin)
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Cannot view memberships of another user.")
    return get_memberships_by_user(db, user_id)


@router.patch("/{membership_id}", response_model=Membership_all)
def update_membership_endpoint(
    membership_id: UUID,
    membership_in: MembershipUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_membership = get_membership_by_id(db, membership_id)
    workspace = db_membership.workspace
    if workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only workspace owner can update roles.")

    updated_membership = update_membership(db, db_membership, membership_in)
    return updated_membership


@router.delete("/{membership_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_membership(
    membership_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_membership = get_membership_by_id(db, membership_id)
    workspace = db_membership.workspace
    if workspace.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only workspace owner can remove members.")

    delete_membership(db, db_membership)
    return None
