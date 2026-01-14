from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.app.db.session import create_db_and_tables
from src.app.api import routes_telemetry, routes_zones, routes_objects

@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()
    yield

app = FastAPI(title="Arctic Corridor Geofence Tracker", lifespan=lifespan)

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for MVP/Dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_telemetry.router)
app.include_router(routes_zones.router)
app.include_router(routes_objects.router)

@app.get("/")
def read_root():
    return {"message": "Geofence Tracker Backend is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
