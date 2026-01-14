from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select, desc
from src.app.db.models import AlertEvent
from src.app.db.session import get_session

router = APIRouter(prefix="/api/alerts", tags=["alerts"])

@router.get("/", response_model=List[AlertEvent])
def list_alerts(
    limit: int = Query(50, ge=1, le=100),
    offset: int = 0,
    session: Session = Depends(get_session)
):
    """
    Retrieve a list of alerts, sorted by timestamp descending.
    """
    statement = select(AlertEvent).order_by(desc(AlertEvent.ts)).offset(offset).limit(limit)
    return session.exec(statement).all()

@router.post("/{alert_id}/ack")
def acknowledge_alert(alert_id: int, session: Session = Depends(get_session)):
    """
    Mark an alert as acknowledged.
    """
    alert = session.get(AlertEvent, alert_id)
    if not alert:
        return {"error": "Alert not found"}
    alert.ack = True
    session.add(alert)
    session.commit()
    return {"status": "ok"}
