from scenarios.routes import router as scenarios_router
from ml.routes import router as ml_router
from analytics.routes import router as analytics_router
from disruption_management.routes import router as management_router
from intelligence.predictions import router as intelligence_router
from security.auth import router as auth_router
from fastapi import FastAPI, HTTPException, Depends
from security.roles import require_roles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal
from datetime import datetime, timezone
from uuid import uuid4
import sqlite3
from pathlib import Path
from emergency.routes import router as emergency_router

app = FastAPI(
    title="URBAN RIPPLE API",
    description="City Disruption Impact Prediction System",
    version="1.0.0"
)

app.include_router(emergency_router)
app.include_router(intelligence_router)

app.include_router(auth_router)
app.include_router(management_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Permanent SQLite database
DATABASE = Path(__file__).resolve().parent / "urban_ripple.db"

def get_db():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS disruptions (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                disruption_type TEXT NOT NULL,
                location TEXT NOT NULL,
                latitude REAL,
                longitude REAL,
                duration_hours REAL NOT NULL,
                affected_population INTEGER NOT NULL,
                severity TEXT NOT NULL,
                created_at TEXT NOT NULL,
                status TEXT NOT NULL
            )
        """)

def row_to_dict(row):
    return dict(row) if row else None

init_db()


class DisruptionCreate(BaseModel):
    title: str = Field(min_length=3, max_length=150)
    disruption_type: Literal[
        "Road Closure", "Water Outage", "Power Outage"
    ]
    location: str = Field(min_length=2, max_length=200)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    duration_hours: float = Field(gt=0, le=720)
    affected_population: int = Field(ge=0)
    severity: Literal["Low", "Medium", "High", "Critical"]


class ImpactRequest(BaseModel):
    disruption_type: Literal[
        "Road Closure", "Water Outage", "Power Outage"
    ]
    duration_hours: float = Field(gt=0, le=720)
    affected_population: int = Field(ge=0)
    severity: Literal["Low", "Medium", "High", "Critical"]


@app.get("/")
def home():
    return {
        "project": "URBAN RIPPLE",
        "status": "Backend running",
        "version": "1.0.0"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/api/disruptions")
def get_disruptions(
    user=Depends(require_roles("admin", "official", "analyst", "emergency", "public"))
):
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM disruptions ORDER BY created_at DESC"
        ).fetchall()

    records = [row_to_dict(row) for row in rows]

    if user.get("role") == "public":
        public_fields = {
            "id", "title", "disruption_type", "location",
            "latitude", "longitude", "severity", "status", "created_at"
        }
        records = [
            {key: value for key, value in record.items() if key in public_fields}
            for record in records
        ]

    return {"count": len(records), "disruptions": records}

@app.post("/api/disruptions", status_code=201)
def create_disruption(
    data: DisruptionCreate,
    user=Depends(require_roles("admin", "official", "analyst", "public"))
):
    record = data.model_dump()
    record["id"] = str(uuid4())
    record["created_at"] = datetime.now(timezone.utc).isoformat()
    record["status"] = "Active"

    with get_db() as conn:
        conn.execute("""
            INSERT INTO disruptions (
                id, title, disruption_type, location, latitude,
                longitude, duration_hours, affected_population,
                severity, created_at, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            record["id"], record["title"], record["disruption_type"],
            record["location"], record["latitude"], record["longitude"],
            record["duration_hours"], record["affected_population"],
            record["severity"], record["created_at"], record["status"]
        ))

    return {
        "message": "Disruption registered successfully",
        "disruption": record
    }

@app.get("/api/disruptions/{disruption_id}")
def get_disruption(
    disruption_id: str,
    user=Depends(require_roles("admin", "official", "analyst", "emergency", "public"))
):
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM disruptions WHERE id = ?",
            (disruption_id,)
        ).fetchone()

    record = row_to_dict(row)
    if record is None:
        raise HTTPException(status_code=404, detail="Disruption not found")

    if user.get("role") == "public":
        public_fields = {
            "id", "title", "disruption_type", "location",
            "latitude", "longitude", "severity", "status", "created_at"
        }
        record = {
            key: value for key, value in record.items()
            if key in public_fields
        }

    return record

@app.post("/api/impact/analyze")
def analyze_impact(data: ImpactRequest):
    # Transparent demonstration formula, not a trained prediction model.
    severity_weights = {
        "Low": 1,
        "Medium": 2,
        "High": 3,
        "Critical": 4
    }

    type_weights = {
        "Road Closure": 1.0,
        "Water Outage": 1.3,
        "Power Outage": 1.5
    }

    raw_score = (
        data.affected_population
        * min(data.duration_hours, 72)
        * severity_weights[data.severity]
        * type_weights[data.disruption_type]
    )

    impact_score = round(
        min(100, raw_score / 10000 * 100), 1
    )

    if impact_score < 25:
        impact_level = "Low"
    elif impact_score < 50:
        impact_level = "Moderate"
    elif impact_score < 75:
        impact_level = "High"
    else:
        impact_level = "Severe"

    recommendations = []

    if data.severity in ["High", "Critical"]:
        recommendations.append(
            "Prioritise the disruption for immediate review by city authorities."
        )

    if data.affected_population >= 1000:
        recommendations.append(
            "Notify affected residents and coordinate alternative services."
        )

    if data.duration_hours >= 4:
        recommendations.append(
            "Prepare a continuity plan and provide periodic public updates."
        )

    if data.disruption_type == "Road Closure":
        recommendations.append(
            "Identify alternate routes and coordinate traffic management."
        )
    elif data.disruption_type == "Water Outage":
        recommendations.append(
            "Assess backup water supply and prioritise essential facilities."
        )
    elif data.disruption_type == "Power Outage":
        recommendations.append(
            "Prioritise critical infrastructure and assess backup power."
        )

    if not recommendations:
        recommendations.append(
            "Monitor the disruption and review conditions periodically."
        )

    return {
        "impact_score": impact_score,
        "impact_level": impact_level,
        "disruption_type": data.disruption_type,
        "duration_hours": data.duration_hours,
        "affected_population": data.affected_population,
        "severity": data.severity,
        "recommendations": recommendations,
        "method": "Demonstration rule-based formula",
        "is_sap_rpt_prediction": False,
        "notice": (
            "This is a preliminary demonstration estimate, "
            "not a validated prediction or SAP-RPT output."
        )
    }

app.include_router(analytics_router)
app.include_router(ml_router)
app.include_router(scenarios_router)
