import uuid
import pytest
from sqlalchemy.orm import Session
from models.workspace import Workspace
from models.role import Role
from crud.workspace_crud import create_workspace
from schemas.workspace_schema import WorkspaceCreate
from schemas.membership_schema import MembershipCreate, MembershipUpdate
from crud.membership_crud import (
    create_membership,
    get_membership_by_id,
    get_memberships_by_user,
    update_membership,
    delete_membership,
)


@pytest.fixture
def workspace_and_role(db_session: Session):
    owner_id = uuid.uuid4()
    workspace = create_workspace(db_session, owner_id, WorkspaceCreate(name="WSa", description="desc"))
    role = Role(
        name="Member",
        workspace_id=workspace.id,
        permissions=[],
        is_default=True,
    )
    db_session.add(role)
    db_session.commit()
    db_session.refresh(role)
    return workspace, role


def test_create_membership(db_session: Session, workspace_and_role):
    workspace, role = workspace_and_role

    user_id = uuid.uuid4()
    membership_in = MembershipCreate(user_id=user_id, role_id=role.id)
    membership = create_membership(db_session, workspace.id, membership_in)

    assert membership.user_id == user_id
    assert membership.workspace_id == workspace.id
    assert membership.role_id == role.id


def test_get_membership_by_id(db_session: Session, workspace_and_role):
    workspace, role = workspace_and_role

    user_id = uuid.uuid4()
    membership = create_membership(db_session, workspace.id, MembershipCreate(user_id=user_id, role_id=role.id))

    found = get_membership_by_id(db_session, membership.id)
    assert found.id == membership.id


def test_get_memberships_by_user(db_session: Session, workspace_and_role):
    workspace1, role1 = workspace_and_role
    workspace2 = create_workspace(db_session, uuid.uuid4(), WorkspaceCreate(name="WS2", description="desc"))

    role2 = Role(
        name="Admin",
        workspace_id=workspace2.id,
        permissions=[],
        is_default=False,
    )
    db_session.add(role2)
    db_session.commit()
    db_session.refresh(role2)

    user_id = uuid.uuid4()
    create_membership(db_session, workspace1.id, MembershipCreate(user_id=user_id, role_id=role1.id))
    create_membership(db_session, workspace2.id, MembershipCreate(user_id=user_id, role_id=role2.id))

    memberships = get_memberships_by_user(db_session, user_id)
    assert len(memberships) == 2


def test_update_membership(db_session: Session, workspace_and_role):
    workspace, role1 = workspace_and_role

    role2 = Role(
        name="Admin",
        workspace_id=workspace.id,
        permissions=[],
        is_default=False,
    )
    db_session.add(role2)
    db_session.commit()
    db_session.refresh(role2)

    user_id = uuid.uuid4()
    membership = create_membership(db_session, workspace.id, MembershipCreate(user_id=user_id, role_id=role1.id))

    updated = update_membership(db_session, membership, MembershipUpdate(role_id=role2.id))
    assert updated.role_id == role2.id


def test_delete_membership(db_session: Session, workspace_and_role):
    workspace, role = workspace_and_role

    user_id = uuid.uuid4()
    membership = create_membership(db_session, workspace.id, MembershipCreate(user_id=user_id, role_id=role.id))

    result = delete_membership(db_session, membership)
    assert result["detail"] == "Membership deleted successfully"
