from typing import List
from fastapi import APIRouter, Depends
from sqlmodel import Session, select
from src.app.db.models import Zone
from src.app.db.session import get_session

router = APIRouter(prefix="/api/zones", tags=["zones"])

@router.get("/", response_model=List[Zone])
def list_zones(session: Session = Depends(get_session)):
    return session.exec(select(Zone)).all()

@router.post("/", response_model=Zone, status_code=201)
def create_zone(zone: Zone, session: Session = Depends(get_session)):
    session.add(zone)
    session.commit()
    session.refresh(zone)
    return zone
