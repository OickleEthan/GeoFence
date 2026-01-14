from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from src.app.db.models import TrackedObject, TelemetryRecord
from src.app.db.session import get_session

router = APIRouter(prefix="/api/objects", tags=["objects"])

@router.get("/", response_model=List[TrackedObject])
def list_objects(session: Session = Depends(get_session)):
    return session.exec(select(TrackedObject)).all()

@router.get("/{object_id}/history", response_model=List[TelemetryRecord])
def get_object_history(object_id: str, limit: int = 50, session: Session = Depends(get_session)):
    """Get the last N telemetry records for an object."""
    statement = (
        select(TelemetryRecord)
        .where(TelemetryRecord.object_id == object_id)
        .order_by(TelemetryRecord.ts.desc())
        .limit(limit)
    )
    return session.exec(statement).all()
