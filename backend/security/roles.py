from fastapi import Depends, HTTPException, status

from security.auth import get_current_user


ROLE_PERMISSIONS = {
    "admin": {
        "users:manage",
        "departments:manage",
        "disruptions:submit",
        "disruptions:read",
        "disruptions:read_public",
        "disruptions:review",
        "disruptions:assign",
        "analytics:read",
        "reports:read",
        "emergency:read",
        "emergency:manage",
        "resources:read",
        "resources:manage",
        "audit:read",
        "settings:manage",
    },

    "official": {
        "disruptions:submit",
        "disruptions:read",
        "disruptions:read_public",
        "disruptions:review",
        "disruptions:assign",
        "analytics:read",
        "reports:read",
        "emergency:read",
        "emergency:manage",
        "resources:read",
        "resources:manage",
    },

    "analyst": {
        "disruptions:read",
        "disruptions:read_public",
        "analytics:read",
        "reports:read",
    },

    "emergency": {
        "disruptions:read",
        "emergency:read",
        "emergency:manage",
        "resources:read",
        "resources:manage",
    },

    "public": {
        "disruptions:submit",
        "disruptions:read_public",
    },
}


def normalize_role(role):
    return str(role or "public").strip().lower()


def has_permission(role, permission):
    normalized = normalize_role(role)
    return permission in ROLE_PERMISSIONS.get(normalized, set())


def require_roles(*allowed_roles):
    allowed = {normalize_role(role) for role in allowed_roles}

    def dependency(user=Depends(get_current_user)):
        role = normalize_role(user.get("role"))

        if role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Your role is not permitted to perform this action."
            )

        return user

    return dependency


def require_permission(permission):
    def dependency(user=Depends(get_current_user)):
        role = normalize_role(user.get("role"))

        if not has_permission(role, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission}"
            )

        return user

    return dependency
