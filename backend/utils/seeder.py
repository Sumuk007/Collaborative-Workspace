import uuid
from sqlalchemy.orm import Session
from models.role import Role


def seed_roles(db: Session, workspace_id):
    existing_roles = db.query(Role).filter(Role.workspace_id == workspace_id).first()
    if existing_roles:
        return  # Already seeded

    roles = [
        Role(
            id=uuid.uuid4(),
            name="Owner",
            workspace_id=workspace_id,
            is_default=True,
            permissions=[
                "create_document",
                "edit_document",
                "view_document",
                "delete_document",
                "manage_members"
            ]
        ),
        Role(
            id=uuid.uuid4(),
            name="Admin",
            workspace_id=workspace_id,
            permissions=[
                "create_document",
                "edit_document",
                "view_document",
                "delete_document"
            ]
        ),
        Role(
            id=uuid.uuid4(),
            name="Editor",
            workspace_id=workspace_id,
            permissions=[
                "create_document",
                "edit_document",
                "view_document"
            ]
        ),
        Role(
            id=uuid.uuid4(),
            name="Viewer",
            workspace_id=workspace_id,
            permissions=[
                "view_document"
            ]
        )
    ]

    db.add_all(roles)
    db.commit()
