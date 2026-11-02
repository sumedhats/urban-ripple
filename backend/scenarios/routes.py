from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Literal

from security.roles import require_roles
from scenarios.simulator import simulate_scenario, get_existing_disruptions

router = APIRouter(
    prefix="/api/scenarios",
    tags=["Scenario Simulation"],
)

AUTHORIZED_ROLES = ("admin", "official", "analyst")


class ScenarioRequest(BaseModel):
    disruption_type: str = Field(min_length=2, max_length=80)
    severity: Literal["Low", "Medium", "High", "Critical"]
    duration_hours: float = Field(gt=0, le=720)
    affected_population: int = Field(ge=0, le=100000000)
    location: str = Field(min_length=2, max_length=200)


@router.get("/active-disruptions")
def active_disruptions(
    user=Depends(require_roles(*AUTHORIZED_ROLES))
):
    try:
        return {
            "count": len(get_existing_disruptions()),
            "disruptions": get_existing_disruptions(),
        }
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Could not retrieve disruptions: {str(exc)}",
        )


@router.post("/simulate")
def run_scenario(
    payload: ScenarioRequest,
    user=Depends(require_roles(*AUTHORIZED_ROLES))
):
    try:
        return simulate_scenario(
            disruption_type=payload.disruption_type,
            severity=payload.severity,
            duration_hours=payload.duration_hours,
            affected_population=payload.affected_population,
            location=payload.location,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Scenario simulation failed: {str(exc)}",
        )
