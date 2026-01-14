from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, delete
from src.app.db.models import Zone, ObjectZoneState
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

@router.delete("/{zone_id}")
def delete_zone(zone_id: int, session: Session = Depends(get_session)):
    zone = session.get(Zone, zone_id)
    if not zone:
        raise HTTPException(status_code=404, detail="Zone not found")
    
    # Cleanup states for this zone
    session.exec(delete(ObjectZoneState).where(ObjectZoneState.zone_id == zone_id))
    
    session.delete(zone)
    session.commit()
    return {"status": "deleted", "id": zone_id}
