from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from src.app.db.models import TelemetryPoint, TrackedObject
from src.app.services.ingestion import process_telemetry
from src.app.db.session import get_session

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])

@router.post("/", status_code=201)
def post_telemetry(point: TelemetryPoint, session: Session = Depends(get_session)):
    """
    Ingest a single telemetry point.
    """
    try:
        process_telemetry(point, session)
        return {"status": "accepted", "object_id": point.object_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
