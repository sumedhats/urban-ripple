from pathlib import Path
import sqlite3
from datetime import datetime, timezone

DB_PATH = Path(__file__).resolve().parents[1] / "urban_ripple.db"

SEVERITY_WEIGHTS = {
    "low": 20,
    "medium": 40,
    "high": 70,
    "critical": 95,
}

DEPENDENCIES = {
    "road_closure": [
        {"system": "Public Transport", "weight": 0.80},
        {"system": "Emergency Services", "weight": 0.90},
        {"system": "Commercial Activity", "weight": 0.55},
        {"system": "Healthcare Access", "weight": 0.75},
    ],
    "water_outage": [
        {"system": "Healthcare Facilities", "weight": 0.95},
        {"system": "Residential Supply", "weight": 1.00},
        {"system": "Commercial Activity", "weight": 0.65},
        {"system": "Public Sanitation", "weight": 0.85},
    ],
    "electricity_failure": [
        {"system": "Healthcare Facilities", "weight": 1.00},
        {"system": "Telecommunications", "weight": 0.90},
        {"system": "Public Transport", "weight": 0.65},
        {"system": "Water Supply", "weight": 0.80},
    ],
    "flood": [
        {"system": "Road Network", "weight": 0.95},
        {"system": "Emergency Services", "weight": 0.90},
        {"system": "Healthcare Access", "weight": 0.85},
        {"system": "Residential Areas", "weight": 0.90},
    ],
    "transport_disruption": [
        {"system": "Public Transport", "weight": 0.90},
        {"system": "Emergency Services", "weight": 0.75},
        {"system": "Commercial Activity", "weight": 0.65},
    ],
}

TYPE_ALIASES = {
    "road closure": "road_closure",
    "road_closure": "road_closure",
    "water outage": "water_outage",
    "water_outage": "water_outage",
    "electricity failure": "electricity_failure",
    "power outage": "electricity_failure",
    "electricity_failure": "electricity_failure",
    "flood": "flood",
    "flooding": "flood",
    "transport disruption": "transport_disruption",
    "transport_disruption": "transport_disruption",
}


def normalize_type(value):
    key = str(value).strip().lower()
    return TYPE_ALIASES.get(key, "transport_disruption")


def get_existing_disruptions():
    with sqlite3.connect(DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        rows = conn.execute("""
            SELECT id, title, disruption_type, location,
                   duration_hours, affected_population,
                   severity, status
            FROM disruptions
            WHERE LOWER(status) IN ('active', 'monitoring', 'ongoing')
        """).fetchall()

    return [dict(row) for row in rows]


def simulate_scenario(
    disruption_type,
    severity,
    duration_hours,
    affected_population,
    location,
):
    kind = normalize_type(disruption_type)
    severity_key = severity.strip().lower()

    if severity_key not in SEVERITY_WEIGHTS:
        raise ValueError("Severity must be Low, Medium, High, or Critical.")

    if duration_hours <= 0 or duration_hours > 720:
        raise ValueError("Duration must be between 0 and 720 hours.")

    if affected_population < 0 or affected_population > 100000000:
        raise ValueError("Affected population is outside the permitted range.")

    severity_score = SEVERITY_WEIGHTS[severity_key]

    duration_factor = min(duration_hours / 24, 3) / 3
    duration_score = duration_factor * 100

    # Transparent weighted heuristic, not a trained prediction model.
    base_risk = (
        severity_score * 0.60
        + duration_score * 0.25
        + min(affected_population / 1000, 100) * 0.15
    )

    risk_score = round(min(base_risk, 100), 2)

    if risk_score >= 75:
        risk_level = "Critical"
    elif risk_score >= 50:
        risk_level = "High"
    elif risk_score >= 25:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    dependencies = DEPENDENCIES[kind]

    downstream = []

    for dependency in dependencies:
        impact = round(
            min(risk_score * dependency["weight"], 100), 2
        )

        downstream.append({
            "system": dependency["system"],
            "dependency_weight": dependency["weight"],
            "impact_score": impact,
            "impact_level": (
                "High" if impact >= 60
                else "Medium" if impact >= 30
                else "Low"
            ),
        })

    estimated_population = round(
        affected_population * min(1 + duration_factor * 0.25, 1.75)
    )

    recommendations = []

    if kind == "road_closure":
        recommendations.extend([
            "Review alternative road access and diversion routes.",
            "Coordinate emergency vehicle access.",
            "Monitor public transport delays.",
        ])
    elif kind == "water_outage":
        recommendations.extend([
            "Assess backup water supply requirements.",
            "Prioritise healthcare and essential facilities.",
            "Communicate service restoration information.",
        ])
    elif kind == "electricity_failure":
        recommendations.extend([
            "Assess backup power availability.",
            "Prioritise critical healthcare infrastructure.",
            "Coordinate utility restoration.",
        ])
    elif kind == "flood":
        recommendations.extend([
            "Assess road accessibility and drainage.",
            "Review emergency evacuation access.",
            "Monitor vulnerable residential areas.",
        ])
    else:
        recommendations.extend([
            "Assess public transport alternatives.",
            "Coordinate emergency access.",
            "Monitor affected commercial activity.",
        ])

    return {
        "scenario": {
            "disruption_type": kind,
            "severity": severity.title(),
            "duration_hours": duration_hours,
            "affected_population": affected_population,
            "location": location,
        },
        "risk": {
            "score": risk_score,
            "level": risk_level,
        },
        "estimated_affected_population": estimated_population,
        "downstream_impacts": downstream,
        "recommendations": recommendations,
        "existing_active_disruptions": len(get_existing_disruptions()),
        "method": "Transparent rule-based scenario simulation",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "disclaimer": (
            "Preliminary demonstration estimate. "
            "Not a validated prediction, causal model, "
            "or SAP-RPT output."
        ),
    }
