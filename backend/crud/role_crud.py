from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.role import Role
from schemas.role_schema import RoleCreate, RoleUpdate


def create_role(db: Session, role: RoleCreate):
    db_role = Role(**role.model_dump())
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role


def get_role_by_id(db: Session, role_id):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role not found")
    return role


def get_roles_by_workspace(db: Session, workspace_id):
    roles = db.query(Role).filter(Role.workspace_id == workspace_id).all()
    return roles


def update_role(db: Session, db_role: Role, updates: RoleUpdate):
    if updates.name is not None:
        db_role.name = updates.name
    if updates.is_default is not None:
        db_role.is_default = updates.is_default
    db.commit()
    db.refresh(db_role)
    return db_role


def delete_role(db: Session, db_role: Role):
    db.delete(db_role)
    db.commit()
    return {"detail": "Role deleted successfully"}
