from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
from sqlmodel import SQLModel, Field as SQLField
from enum import Enum

# --- Enums ---

class ObjectCategory(str, Enum):
    UAV = "UAV"
    VEHICLE = "VEHICLE"
    BEACON = "BEACON"
    UNKNOWN = "UNKNOWN"

# --- Shared Pydantic Models (API DTOs) ---

class Position(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)
    alt_m: Optional[float] = None

class TelemetryData(BaseModel):
    speed_mps: float = Field(..., ge=0)
    heading_deg: float = Field(..., ge=0, le=360)
    rssi_dbm: Optional[float] = None
    battery_pct: Optional[float] = Field(None, ge=0, le=100)
    source: Optional[str] = None

class ObjectInference(BaseModel):
    category: ObjectCategory
    class_confidence: float = Field(..., ge=0, le=1)

class TelemetryPoint(BaseModel):
    object_id: str = Field(..., min_length=1)
    ts: datetime
    position: Position
    confidence: float = Field(..., ge=0, le=1)
    telemetry: TelemetryData
    inference: Optional[ObjectInference] = None
    meta: Optional[dict] = None

    @field_validator("ts")
    def validate_utc(cls, v: datetime):
        if v.tzinfo is None:
            raise ValueError("Timestamp must be timezone-aware (UTC)")
        return v

# --- Database Models (SQLModel) ---

class TrackedObject(SQLModel, table=True):
    id: str = SQLField(primary_key=True)
    last_seen: datetime = SQLField(index=True)
    last_lat: float
    last_lon: float
    last_confidence: float
    # Denormalized for easier querying, or could be JSON
    speed_mps: Optional[float] = None
    heading_deg: Optional[float] = None
    battery_pct: Optional[float] = None
    
    # Store JSON blob for full details if needed, or keep simple for MVP

class TelemetryRecord(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    object_id: str = SQLField(index=True)
    ts: datetime = SQLField(index=True)
    lat: float
    lon: float
    alt_m: Optional[float] = None
    speed_mps: Optional[float] = None
    heading_deg: Optional[float] = None
    battery_pct: Optional[float] = None


class Zone(SQLModel, table=True):
    id: Optional[int] = SQLField(default=None, primary_key=True)
    name: str
    # BBOX definition
    min_lat: float
    min_lon: float
    max_lat: float
    max_lon: float
    
    enabled: bool = True
    created_at: datetime = SQLField(default_factory=datetime.utcnow)
