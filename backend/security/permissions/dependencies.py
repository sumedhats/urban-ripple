from fastapi import Depends, HTTPException, status
from security.auth import get_current_user
from security.roles import normalize_role, has_permission

def require_roles(*allowed_roles):
    allowed = {normalize_role(role) for role in allowed_roles}

    def role_checker(current_user=Depends(get_current_user)):
        role = normalize_role(current_user.get("role") if isinstance(current_user, dict) else getattr(current_user, "role", None))
        if role not in allowed and role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource."
            )
        return current_user

    return role_checker

def require_permission(permission):
    def permission_checker(current_user=Depends(get_current_user)):
        role = current_user.get("role") if isinstance(current_user, dict) else getattr(current_user, "role", None)
        if not has_permission(role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission required: " + permission
            )
        return current_user

    return permission_checker
