
from pathlib import Path
import sqlite3
from collections import defaultdict
from fastapi import APIRouter, HTTPException, Query, Depends
from security.roles import require_roles

router = APIRouter(prefix="/api/intelligence", tags=["Predictive Intelligence"])
DB_PATH = Path(__file__).resolve().parents[1] / "urban_ripple.db"

SEVERITY_WEIGHT = {
    "low": 10,
    "medium": 30,
    "high": 60,
    "critical": 85
}

def load_disruptions():
    if not DB_PATH.exists():
        raise HTTPException(status_code=503, detail="Disruption database unavailable")
    try:
        with sqlite3.connect(DB_PATH) as conn:
            conn.row_factory = sqlite3.Row
            rows = conn.execute("""
                SELECT id, title, disruption_type, location,
                       latitude, longitude, duration_hours,
                       affected_population, severity, status, created_at
                FROM disruptions
            """).fetchall()
            return [dict(row) for row in rows]
    except sqlite3.Error as exc:
        raise HTTPException(status_code=500, detail="Could not read disruption records") from exc

def calculate_risk(record):
    severity = SEVERITY_WEIGHT.get(str(record.get("severity", "")).lower(), 15)
    population = max(0, int(record.get("affected_population") or 0))
    duration = max(0, float(record.get("duration_hours") or 0))
    population_score = min(100, population / 1000 * 10)
    duration_score = min(100, duration / 24 * 20)
    score = min(100, severity * 0.60 + population_score * 0.25 + duration_score * 0.15)
    return round(score, 2)

def risk_level(score):
    if score >= 75:
        return "Critical"
    if score >= 50:
        return "High"
    if score >= 25:
        return "Moderate"
    return "Low"

def recommendations(record, score):
    result = []
    severity = str(record.get("severity", "")).lower()
    kind = str(record.get("disruption_type", "")).lower()

    if score >= 75:
        result.append({"priority": "Urgent", "action": "Request immediate review by the responsible emergency authority."})
    elif score >= 50:
        result.append({"priority": "High", "action": "Prioritize monitoring and confirm response-team readiness."})
    else:
        result.append({"priority": "Normal", "action": "Continue monitoring and update incident information."})

    if "road" in kind or "traffic" in kind:
        result.append({"priority": "High", "action": "Review traffic diversions and emergency vehicle access."})
    if "water" in kind or "flood" in kind:
        result.append({"priority": "High", "action": "Review water-service continuity and potential flood exposure."})
    if "power" in kind or "electric" in kind:
        result.append({"priority": "High", "action": "Identify critical facilities that may need backup power."})
    if severity == "critical":
        result.append({"priority": "Urgent", "action": "Verify incident status and communicate confirmed safety information."})
    return result

@router.get("/risk-scores", dependencies=[Depends(require_roles("admin", "official", "analyst"))])
def get_risk_scores():
    records = load_disruptions()
    results = []
    for record in records:
        score = calculate_risk(record)
        results.append({
            "disruption_id": record["id"],
            "title": record["title"],
            "location": record["location"],
            "disruption_type": record["disruption_type"],
            "risk_score": score,
            "risk_level": risk_level(score)
        })
    results.sort(key=lambda item: item["risk_score"], reverse=True)
    return {"count": len(results), "method": "Transparent heuristic baseline", "results": results}

@router.get("/forecast", dependencies=[Depends(require_roles("admin", "official", "analyst"))])
def forecast_impact(horizon_hours: int = Query(default=6, ge=1, le=168)):
    records = load_disruptions()
    forecasts = []
    for record in records:
        base = calculate_risk(record)
        duration = max(0, float(record.get("duration_hours") or 0))
        time_factor = min(1.5, 0.75 + horizon_hours / 48)
        duration_factor = min(1.25, 0.75 + duration / 96)
        projected = min(100, round(base * time_factor * duration_factor, 2))
        forecasts.append({
            "disruption_id": record["id"],
            "title": record["title"],
            "location": record["location"],
            "forecast_horizon_hours": horizon_hours,
            "baseline_risk": base,
            "projected_risk": projected,
            "projected_level": risk_level(projected)
        })
    forecasts.sort(key=lambda item: item["projected_risk"], reverse=True)
    return {
        "forecast_horizon_hours": horizon_hours,
        "method": "Heuristic scenario projection, not a trained forecasting model",
        "count": len(forecasts),
        "results": forecasts
    }

@router.get("/anomalies", dependencies=[Depends(require_roles("admin", "official", "analyst"))])
def detect_anomalies():
    records = load_disruptions()
    if not records:
        return {"count": 0, "results": [], "message": "No disruption records available."}

    populations = [max(0, int(r.get("affected_population") or 0)) for r in records]
    mean = sum(populations) / len(populations)
    variance = sum((x - mean) ** 2 for x in populations) / len(populations)
    deviation = variance ** 0.5
    anomalies = []

    for record in records:
        population = max(0, int(record.get("affected_population") or 0))
        reasons = []
        if deviation > 0 and population > mean + 2 * deviation:
            reasons.append("Affected population is unusually high relative to the current records.")
        if float(record.get("duration_hours") or 0) >= 72:
            reasons.append("Disruption duration is at least 72 hours.")
        if str(record.get("severity", "")).lower() == "critical":
            reasons.append("Incident is marked Critical.")
        if reasons:
            anomalies.append({
                "disruption_id": record["id"],
                "title": record["title"],
                "location": record["location"],
                "reasons": reasons
            })
    return {
        "count": len(anomalies),
        "method": "Rule-based and statistical screening",
        "results": anomalies
    }

@router.get("/recommendations", dependencies=[Depends(require_roles("admin", "official", "analyst"))])
def ranked_recommendations():
    records = load_disruptions()
    items = []
    for record in records:
        score = calculate_risk(record)
        items.append({
            "disruption_id": record["id"],
            "title": record["title"],
            "location": record["location"],
            "risk_score": score,
            "risk_level": risk_level(score),
            "recommendations": recommendations(record, score)
        })
    items.sort(key=lambda item: item["risk_score"], reverse=True)
    return {"count": len(items), "results": items}

@router.get("/multi-hazard", dependencies=[Depends(require_roles("admin", "official", "analyst"))])
def multi_hazard_analysis():
    records = load_disruptions()
    groups = defaultdict(list)
    for record in records:
        location = str(record.get("location") or "Unknown").strip().lower()
        groups[location].append(record)

    results = []
    for location, incidents in groups.items():
        types = sorted(set(str(r.get("disruption_type") or "Unknown") for r in incidents))
        combined = min(100, round(sum(calculate_risk(r) for r in incidents), 2))
        results.append({
            "location": location,
            "incident_count": len(incidents),
            "hazard_types": types,
            "multiple_hazard_types": len(types) > 1,
            "combined_exposure_score": combined,
            "note": "Co-located incident screening; not a validated cascading-failure model."
        })
    results.sort(key=lambda x: x["combined_exposure_score"], reverse=True)
    return {"count": len(results), "results": results}
