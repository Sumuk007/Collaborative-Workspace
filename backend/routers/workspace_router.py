from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from db.dependency import get_db
from schemas.workspace_schema import WorkspaceCreate, Workspace, WorkspaceUpdate, WorkspaceOut
from models.workspace import Workspace as WorkspaceModel
from models.membership import Membership
from utils.auth import get_current_user
from crud.workspace_crud import get_workspace_by_id, update_workspace
from utils.seeder import seed_roles
from models.user import User
from models.role import Role
from uuid import uuid4, UUID

router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.post("/", response_model=Workspace, status_code=status.HTTP_201_CREATED)
def create_workspace(
    workspace_in: WorkspaceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ✅ Ensure workspace name is unique per user
    existing_workspace = db.query(WorkspaceModel).filter(
        WorkspaceModel.owner_id == current_user.id,
        WorkspaceModel.name == workspace_in.name
    ).first()
    if existing_workspace:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have a workspace with this name."
        )

    # 1️⃣ Create the workspace
    workspace = WorkspaceModel(
        id=uuid4(),
        name=workspace_in.name,
        owner_id=current_user.id,
    )
    db.add(workspace)
    db.commit()
    db.refresh(workspace)

    # 2️⃣ Seed all roles for this workspace
    seed_roles(db, workspace.id)

    # 3️⃣ Fetch the Owner role for this workspace
    owner_role = db.query(Role).filter(
        Role.workspace_id == workspace.id,
        Role.name == "Owner"
    ).first()

    # 4️⃣ Create membership for the current user with "Owner" role
    membership = Membership(
        id=uuid4(),
        user_id=current_user.id,
        workspace_id=workspace.id,
        role_id=owner_role.id
    )
    db.add(membership)
    db.commit()

    return workspace


@router.patch("/{workspace_id}", response_model=WorkspaceOut)
def update_workspace_endpoint(
    workspace_id: UUID,
    workspace_in: WorkspaceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_workspace = get_workspace_by_id(db, workspace_id)

    # Ensure the current user is the owner of the workspace
    if db_workspace.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to update this workspace.")
    
    # ✅ Check for existing workspace with the same name under the same owner (excluding current workspace)
    if workspace_in.name:
        existing_workspace = (
            db.query(WorkspaceModel)
            .filter(
                WorkspaceModel.owner_id == current_user.id,
                WorkspaceModel.name == workspace_in.name,
                WorkspaceModel.id != workspace_id
            )
            .first()
        )
        if existing_workspace:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have a workspace with this name."
            )

    updated_workspace = update_workspace(db, db_workspace, workspace_in)
    return updated_workspace



@router.get("/", response_model=list[Workspace])
def list_workspaces(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    memberships = db.query(Membership).filter(Membership.user_id == current_user.id).all()
    workspaces = [membership.workspace for membership in memberships]
    return workspaces


@router.get("/{workspace_id}", response_model=Workspace)
def get_workspace(workspace_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workspace = db.query(WorkspaceModel).filter(WorkspaceModel.id == workspace_id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")
    return workspace


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_workspace(workspace_id: UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    workspace = db.query(WorkspaceModel).filter(WorkspaceModel.id == workspace_id, WorkspaceModel.owner_id == current_user.id).first()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found or permission denied")

    db.delete(workspace)
    db.commit()
    return None
