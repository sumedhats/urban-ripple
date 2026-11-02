from fastapi import APIRouter, Depends, HTTPException

from security.roles import require_roles
from ml.train import (
    get_model_status,
    train_model,
    detect_anomalies,
)

router = APIRouter(
    prefix="/api/ml",
    tags=["Machine Learning"],
)

AUTHORIZED_ROLES = ("admin", "official", "analyst")


@router.get("/status")
def ml_status(
    user=Depends(require_roles(*AUTHORIZED_ROLES))
):
    try:
        return get_model_status()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve ML status: {str(exc)}",
        )


@router.post("/train")
def ml_train(
    user=Depends(require_roles("admin"))
):
    try:
        result = train_model()

        if not result.get("trained"):
            return result

        return result

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Model training failed: {str(exc)}",
        )


@router.get("/anomalies")
def ml_anomalies(
    user=Depends(require_roles(*AUTHORIZED_ROLES))
):
    try:
        return detect_anomalies()
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not detect anomalies: {str(exc)}",
        )
