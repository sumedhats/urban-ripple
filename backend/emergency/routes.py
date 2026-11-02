from pathlib import Path
from datetime import datetime, timezone
from uuid import uuid4
import sqlite3

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from security.roles import require_roles

router = APIRouter(
    prefix="/api/emergency",
    tags=["Emergency Management"]
)

DB_PATH = Path(__file__).resolve().parents[1] / "urban_ripple.db"

STATUSES = {
    "reported",
    "acknowledged",
    "assigned",
    "in_progress",
    "resolved",
    "closed"
}

PRIORITIES = {"low", "medium", "high", "critical"}


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def initialize_tables():
    with get_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS emergency_incidents (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                location TEXT NOT NULL,
                incident_type TEXT NOT NULL,
                priority TEXT NOT NULL,
                status TEXT NOT NULL,
                assigned_team TEXT,
                reported_by TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)


class IncidentCreate(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    description: str = Field(min_length=5, max_length=2000)
    location: str = Field(min_length=2, max_length=250)
    incident_type: str = Field(min_length=2, max_length=80)
    priority: str = "medium"


class IncidentUpdate(BaseModel):
    status: str | None = None
    priority: str | None = None
    assigned_team: str | None = Field(default=None, max_length=150)


@router.post("/incidents", status_code=201)
def create_incident(
    data: IncidentCreate,
    user=Depends(require_roles("admin", "official", "emergency"))
):
    initialize_tables()

    priority = data.priority.lower()

    if priority not in PRIORITIES:
        raise HTTPException(422, "Invalid incident priority.")

    incident_id = str(uuid4())
    now = datetime.now(timezone.utc).isoformat()

    with get_connection() as conn:
        conn.execute("""
            INSERT INTO emergency_incidents (
                id, title, description, location,
                incident_type, priority, status,
                assigned_team, reported_by,
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            incident_id,
            data.title.strip(),
            data.description.strip(),
            data.location.strip(),
            data.incident_type.strip(),
            priority,
            "reported",
            None,
            user.get("email"),
            now,
            now
        ))

    return {
        "message": "Emergency incident registered.",
        "incident_id": incident_id,
        "status": "reported"
    }


@router.get("/incidents")
def list_incidents(
    user=Depends(require_roles("admin", "official", "analyst", "emergency"))
):
    initialize_tables()

    with get_connection() as conn:
        rows = conn.execute("""
            SELECT * FROM emergency_incidents
            ORDER BY created_at DESC
        """).fetchall()

    return {
        "total": len(rows),
        "incidents": [dict(row) for row in rows]
    }


@router.get("/incidents/{incident_id}")
def get_incident(
    incident_id: str,
    user=Depends(require_roles("admin", "official", "analyst", "emergency"))
):
    initialize_tables()

    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM emergency_incidents WHERE id = ?",
            (incident_id,)
        ).fetchone()

    if row is None:
        raise HTTPException(404, "Incident not found.")

    return dict(row)


@router.patch("/incidents/{incident_id}")
def update_incident(
    incident_id: str,
    data: IncidentUpdate,
    user=Depends(require_roles("admin", "official", "emergency"))
):
    initialize_tables()

    changes = data.model_dump(exclude_unset=True)

    if not changes:
        raise HTTPException(400, "No update fields supplied.")

    if "status" in changes and changes["status"] is not None:
        changes["status"] = changes["status"].lower()
        if changes["status"] not in STATUSES:
            raise HTTPException(422, "Invalid incident status.")

    if "priority" in changes and changes["priority"] is not None:
        changes["priority"] = changes["priority"].lower()
        if changes["priority"] not in PRIORITIES:
            raise HTTPException(422, "Invalid incident priority.")

    allowed = {"status", "priority", "assigned_team"}
    if not set(changes).issubset(allowed):
        raise HTTPException(400, "Unsupported update field.")

    changes["updated_at"] = datetime.now(timezone.utc).isoformat()

    columns = ", ".join(f"{key} = ?" for key in changes)
    values = list(changes.values()) + [incident_id]

    with get_connection() as conn:
        cursor = conn.execute(
            f"UPDATE emergency_incidents SET {columns} WHERE id = ?",
            values
        )

        if cursor.rowcount == 0:
            raise HTTPException(404, "Incident not found.")

        row = conn.execute(
            "SELECT * FROM emergency_incidents WHERE id = ?",
            (incident_id,)
        ).fetchone()

    return {
        "message": "Incident updated successfully.",
        "incident": dict(row)
    }


@router.get("/summary")
def emergency_summary(
    user=Depends(require_roles("admin", "official", "analyst", "emergency"))
):
    initialize_tables()

    with get_connection() as conn:
        total = conn.execute(
            "SELECT COUNT(*) FROM emergency_incidents"
        ).fetchone()[0]

        statuses = conn.execute("""
            SELECT status, COUNT(*) AS count
            FROM emergency_incidents
            GROUP BY status
        """).fetchall()

        priorities = conn.execute("""
            SELECT priority, COUNT(*) AS count
            FROM emergency_incidents
            GROUP BY priority
        """).fetchall()

    return {
        "total_incidents": total,
        "by_status": {row["status"]: row["count"] for row in statuses},
        "by_priority": {
            row["priority"]: row["count"] for row in priorities
        }
    }
