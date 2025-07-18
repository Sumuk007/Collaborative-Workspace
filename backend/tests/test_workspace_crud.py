import uuid
import pytest
from sqlalchemy.orm import Session
from schemas.workspace_schema import WorkspaceCreate, WorkspaceUpdate
from crud.workspace_crud import (
    create_workspace, 
    get_workspace_by_id, 
    get_workspaces_by_owner,
    update_workspace,
    delete_workspace
)


def test_create_workspace(db_session: Session):
    owner_id = uuid.uuid4()
    workspace_in = WorkspaceCreate(name="Test Workspace")
    workspace = create_workspace(db_session, owner_id=owner_id, workspace=workspace_in)
    assert workspace.name == workspace_in.name

def test_get_workspace_by_id(db_session: Session):
    owner_id = uuid.uuid4()
    workspace = create_workspace(
        db_session,
        owner_id=owner_id,
        workspace=WorkspaceCreate(name="Fetch Workspace", description="desc")
    )
    found = get_workspace_by_id(db_session, workspace.id)
    assert found.id == workspace.id


def test_get_workspaces_by_owner(db_session: Session):
    owner_id = uuid.uuid4()
    create_workspace(db_session, owner_id=owner_id, workspace=WorkspaceCreate(name="WS 1", description="1"))
    create_workspace(db_session, owner_id=owner_id, workspace=WorkspaceCreate(name="WS 2", description="2"))
    workspaces = get_workspaces_by_owner(db_session, owner_id)
    assert len(workspaces) == 2


def test_update_workspace(db_session: Session):
    owner_id = uuid.uuid4()
    workspace = create_workspace(
        db_session,
        owner_id=owner_id,
        workspace=WorkspaceCreate(name="Original")
    )
    updated = update_workspace(
        db_session,
        db_workspace=workspace,
        updates=WorkspaceUpdate(name="Updated")
    )
    assert updated.name == "Updated"


def test_delete_workspace(db_session: Session):
    owner_id = uuid.uuid4()
    workspace = create_workspace(
        db_session,
        owner_id=owner_id,
        workspace=WorkspaceCreate(name="DeleteMe")
    )
    result = delete_workspace(db_session, db_workspace=workspace)
    assert result["detail"] == "Workspace deleted successfully"
