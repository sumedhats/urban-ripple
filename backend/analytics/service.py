import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[1] / "urban_ripple.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_analytics(start_date=None, end_date=None):
    conditions = []
    params = []

    if start_date:
        conditions.append("date(created_at) >= date(?)")
        params.append(start_date)

    if end_date:
        conditions.append("date(created_at) <= date(?)")
        params.append(end_date)

    where_clause = (
        " WHERE " + " AND ".join(conditions)
        if conditions else ""
    )

    with get_connection() as conn:
        total = conn.execute(
            f"SELECT COUNT(*) FROM disruptions{where_clause}",
            params
        ).fetchone()[0]

        severity = conn.execute(
            f"""
            SELECT severity, COUNT(*) AS count
            FROM disruptions
            {where_clause}
            GROUP BY severity
            """,
            params
        ).fetchall()

        types = conn.execute(
            f"""
            SELECT disruption_type, COUNT(*) AS count
            FROM disruptions
            {where_clause}
            GROUP BY disruption_type
            ORDER BY count DESC
            """,
            params
        ).fetchall()

        locations = conn.execute(
            f"""
            SELECT location, COUNT(*) AS count,
                   SUM(affected_population) AS affected_population
            FROM disruptions
            {where_clause}
            GROUP BY location
            ORDER BY affected_population DESC
            """,
            params
        ).fetchall()

        population = conn.execute(
            f"""
            SELECT COALESCE(SUM(affected_population), 0)
            FROM disruptions
            {where_clause}
            """,
            params
        ).fetchone()[0]


        risk_summary = conn.execute(
            f"""
            SELECT
                SUM(CASE WHEN lower(severity) = 'critical' THEN 1 ELSE 0 END) AS critical,
                SUM(CASE WHEN lower(severity) = 'high' THEN 1 ELSE 0 END) AS high,
                SUM(CASE WHEN lower(severity) IN ('high', 'critical') THEN 1 ELSE 0 END) AS high_risk,
                SUM(CASE WHEN lower(severity) IN ('high', 'critical')
                    THEN COALESCE(affected_population, 0) ELSE 0 END) AS high_risk_population
            FROM disruptions
            {where_clause}
            """,
            params
        ).fetchone()

        status_summary = conn.execute(
            f"""
            SELECT
                SUM(CASE WHEN lower(status) = 'active' THEN 1 ELSE 0 END) AS active,
                SUM(CASE WHEN lower(status) = 'monitoring' THEN 1 ELSE 0 END) AS monitoring,
                SUM(CASE WHEN lower(status) = 'planned' THEN 1 ELSE 0 END) AS planned,
                SUM(CASE WHEN lower(status) = 'resolved' THEN 1 ELSE 0 END) AS resolved
            FROM disruptions
            {where_clause}
            """,
            params
        ).fetchone()

        monthly = conn.execute(
            f"""
            SELECT strftime('%Y-%m', created_at) AS month,
                   COUNT(*) AS count
            FROM disruptions
            {where_clause}
            GROUP BY month
            ORDER BY month
            """,
            params
        ).fetchall()

    return {
        "total_disruptions": total,
        "affected_population": population,
        "severity_distribution": [dict(row) for row in severity],
        "disruption_types": [dict(row) for row in types],
        "location_impact": [dict(row) for row in locations],
        "monthly_trend": [dict(row) for row in monthly],
        "risk_summary": dict(risk_summary),
        "status_summary": {
            key: int(status_summary[key] or 0)
            for key in ("active", "monitoring", "planned", "resolved")
        },
        "filters": {
            "start_date": start_date,
            "end_date": end_date
        }
    }
