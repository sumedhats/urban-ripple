from pathlib import Path
import sqlite3

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from security.roles import require_roles

router = APIRouter(
    prefix="/api/management/disruptions",
    tags=["Disruption Management"]
)

DB_PATH = Path(__file__).resolve().parents[1] / "urban_ripple.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


class DisruptionUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=3, max_length=150)
    location: str | None = Field(default=None, min_length=2, max_length=200)
    disruption_type: str | None = None
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    duration_hours: float | None = Field(default=None, gt=0, le=720)
    affected_population: int | None = Field(default=None, ge=0)
    severity: str | None = None
    status: str | None = None


ALLOWED_SEVERITIES = {"Low", "Medium", "High", "Critical"}
ALLOWED_STATUSES = {"Active", "Monitoring", "Planned", "Resolved", "Cancelled"}
ALLOWED_TYPES = {
    "Road Closure", "Water Outage", "Power Outage",
    "Flooding", "Traffic Congestion", "Construction",
    "Transport Interruption", "Public Event", "Other"
}


def fetch_record(conn, disruption_id):
    row = conn.execute(
        "SELECT * FROM disruptions WHERE id = ?",
        (disruption_id,)
    ).fetchone()

    if row is None:
        raise HTTPException(status_code=404, detail="Disruption not found")

    return dict(row)


@router.get("")
def list_managed_disruptions(
    search: str = Query(default="", max_length=150),
    severity: str | None = None,
    status: str | None = None,
    disruption_type: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    user=Depends(require_roles("admin", "official", "analyst"))
):
    conditions = []
    values = []

    if search.strip():
        term = f"%{search.strip()}%"
        conditions.append("(title LIKE ? OR location LIKE ?)")
        values.extend([term, term])

    if severity:
        if severity not in ALLOWED_SEVERITIES:
            raise HTTPException(status_code=422, detail="Invalid severity")
        conditions.append("severity = ?")
        values.append(severity)

    if status:
        if status not in ALLOWED_STATUSES:
            raise HTTPException(status_code=422, detail="Invalid status")
        conditions.append("status = ?")
        values.append(status)

    if disruption_type:
        if disruption_type not in ALLOWED_TYPES:
            raise HTTPException(status_code=422, detail="Invalid disruption type")
        conditions.append("disruption_type = ?")
        values.append(disruption_type)

    where = " WHERE " + " AND ".join(conditions) if conditions else ""

    with get_connection() as conn:
        total = conn.execute(
            "SELECT COUNT(*) FROM disruptions" + where,
            values
        ).fetchone()[0]

        records = conn.execute(
            "SELECT * FROM disruptions" + where +
            " ORDER BY created_at DESC LIMIT ? OFFSET ?",
            values + [page_size, (page - 1) * page_size]
        ).fetchall()

    return {
        "page": page,
        "page_size": page_size,
        "total": total,
        "pages": (total + page_size - 1) // page_size,
        "results": [dict(row) for row in records]
    }


@router.get("/{disruption_id}")
def get_managed_disruption(
    disruption_id: str,
    user=Depends(require_roles("admin", "official", "analyst"))
):
    with get_connection() as conn:
        return fetch_record(conn, disruption_id)


@router.patch("/{disruption_id}")
def update_disruption(
    disruption_id: str,
    data: DisruptionUpdate,
    user=Depends(require_roles("admin", "official"))
):
    changes = data.model_dump(exclude_unset=True)

    if not changes:
        raise HTTPException(status_code=400, detail="No changes supplied")

    if "severity" in changes and changes["severity"] not in ALLOWED_SEVERITIES:
        raise HTTPException(status_code=422, detail="Invalid severity")

    if "status" in changes and changes["status"] not in ALLOWED_STATUSES:
        raise HTTPException(status_code=422, detail="Invalid status")

    if (
        "disruption_type" in changes
        and changes["disruption_type"] not in ALLOWED_TYPES
    ):
        raise HTTPException(status_code=422, detail="Invalid disruption type")

    allowed_columns = {
        "title", "location", "disruption_type", "latitude",
        "longitude", "duration_hours", "affected_population",
        "severity", "status"
    }

    if not set(changes).issubset(allowed_columns):
        raise HTTPException(status_code=400, detail="Invalid update fields")

    assignments = ", ".join(f"{column} = ?" for column in changes)
    values = list(changes.values()) + [disruption_id]

    with get_connection() as conn:
        fetch_record(conn, disruption_id)

        conn.execute(
            f"UPDATE disruptions SET {assignments} WHERE id = ?",
            values
        )

        updated = fetch_record(conn, disruption_id)

    return {
        "message": "Disruption updated successfully",
        "disruption": updated
    }


@router.delete("/{disruption_id}")
def delete_disruption(
    disruption_id: str,
    user=Depends(require_roles("admin"))
):
    with get_connection() as conn:
        fetch_record(conn, disruption_id)

        conn.execute(
            "DELETE FROM disruptions WHERE id = ?",
            (disruption_id,)
        )

    return {"message": "Disruption deleted successfully"}
