from fastapi import HTTPException, status


def check_permission(membership, permission: str):
    if not membership or not membership.role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No membership or role found."
        )

    permissions = membership.role.permissions or []

    if permission not in permissions:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission '{permission}' denied."
        )
