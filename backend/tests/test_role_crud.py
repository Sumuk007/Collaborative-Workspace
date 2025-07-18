import uuid
import pytest
from sqlalchemy.orm import Session
from schemas.role_schema import RoleCreate, RoleUpdate
from crud.role_crud import (
    create_role, get_role_by_id,
    get_roles_by_workspace, update_role, delete_role
)


def test_create_role(db_session: Session):
    workspace_id = uuid.uuid4()
    role_in = RoleCreate(name="Admin", workspace_id=workspace_id)
    role = create_role(db_session, role_in)
    assert role.name == "Admin"
    assert role.workspace_id == workspace_id


def test_get_role_by_id(db_session: Session):
    workspace_id = uuid.uuid4()
    role = create_role(db_session, RoleCreate(name="Editor", workspace_id=workspace_id))
    found_role = get_role_by_id(db_session, role.id)
    assert found_role.id == role.id


def test_get_roles_by_workspace(db_session: Session):
    workspace_id = uuid.uuid4()
    create_role(db_session, RoleCreate(name="Viewer", workspace_id=workspace_id))
    roles = get_roles_by_workspace(db_session, workspace_id)
    assert len(roles) > 0


def test_update_role(db_session: Session):
    workspace_id = uuid.uuid4()
    role = create_role(db_session, RoleCreate(name="Contributor", workspace_id=workspace_id))
    updated = update_role(db_session, role, RoleUpdate(name="Manager", is_default=True))
    assert updated.name == "Manager"
    assert updated.is_default is True


def test_delete_role(db_session: Session):
    workspace_id = uuid.uuid4()
    role = create_role(db_session, RoleCreate(name="Temporary", workspace_id=workspace_id))
    response = delete_role(db_session, role)
    assert response["detail"] == "Role deleted successfully"
