from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query

from security.roles import require_roles
from analytics.service import get_analytics

router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"]
)


@router.get("/overview")
def analytics_overview(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    user=Depends(require_roles("admin", "official", "analyst"))
):
    if start_date and end_date and start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="Start date cannot be after end date."
        )

    return get_analytics(
        start_date.isoformat() if start_date else None,
        end_date.isoformat() if end_date else None
    )
