from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from db.dependency import get_db
from utils.auth import get_current_user
from models.user import User
from schemas.role_schema import RoleOut
from crud.role_crud import get_roles_by_workspace
from uuid import UUID

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("/", response_model=list[RoleOut])
def list_roles(
    workspace_id: UUID = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    roles = get_roles_by_workspace(db, workspace_id)
    if not roles:
        raise HTTPException(status_code=404, detail="No roles found for this workspace.")
    return roles

@router.get("/{workspace_id}", response_model=list[RoleOut])
def get_roles(workspace_id: UUID, db: Session = Depends(get_db)):
    roles = get_roles_by_workspace(db, workspace_id)
    return roles
