import uuid
from sqlalchemy.orm import Session
from models.workspace import Workspace
from models.role import Role
from utils.seeder import seed_roles


def test_seed_roles(db_session: Session):
    # Create a workspace
    owner_id=uuid.uuid4()
    workspace = Workspace(id=uuid.uuid4(), name="Test Workspace", owner_id=owner_id)
    db_session.add(workspace)
    db_session.commit()
    db_session.refresh(workspace)

    # Seed roles for the workspace
    seed_roles(db_session, workspace_id=workspace.id)

    # Verify roles are seeded
    roles = db_session.query(Role).filter(Role.workspace_id == workspace.id).all()
    assert len(roles) == 4

    role_names = {role.name for role in roles}
    assert "Owner" in role_names
    assert "Admin" in role_names
    assert "Editor" in role_names
    assert "Viewer" in role_names


def test_seed_roles_idempotent(db_session: Session):
    # Create a workspace
    owner_id=uuid.uuid4()
    workspace = Workspace(id=uuid.uuid4(), name="Another Workspace", owner_id=owner_id)
    db_session.add(workspace)
    db_session.commit()
    db_session.refresh(workspace)

    # Seed roles twice
    seed_roles(db_session, workspace_id=workspace.id)
    seed_roles(db_session, workspace_id=workspace.id)

    # Verify no duplicates created
    roles = db_session.query(Role).filter(Role.workspace_id == workspace.id).all()
    assert len(roles) == 4
