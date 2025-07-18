from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.workspace import Workspace
from schemas.workspace_schema import WorkspaceCreate, WorkspaceUpdate
from utils.seeder import seed_roles


def create_workspace(db: Session, owner_id, workspace: WorkspaceCreate):
    db_workspace = Workspace(
        name=workspace.name,
        owner_id=owner_id
    )
    db.add(db_workspace)
    db.commit()
    db.refresh(db_workspace)
    seed_roles(db, workspace_id=db_workspace.id)
    return db_workspace


def get_workspace_by_id(db: Session, workspace_id):
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    if not workspace:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace not found"
        )
    return workspace


def get_workspaces_by_owner(db: Session, owner_id):
    return db.query(Workspace).filter(Workspace.owner_id == owner_id).all()


def update_workspace(db: Session, db_workspace: Workspace, updates: WorkspaceUpdate):
    if updates.name is not None:
        db_workspace.name = updates.name
    db.commit()
    db.refresh(db_workspace)
    return db_workspace


def delete_workspace(db: Session, db_workspace: Workspace):
    db.delete(db_workspace)
    db.commit()
    return {"detail": "Workspace deleted successfully"}
