import logging
import secrets
from pathlib import Path

from fastapi import APIRouter, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app import db
from app.config import settings
from app.poller import poll_once

logger = logging.getLogger("main")

app = FastAPI(title="AI customer support")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBasic(auto_error=False)


def require_login(credentials: HTTPBasicCredentials | None = Depends(security)) -> None:
    valid = (
        credentials is not None
        and settings.dashboard_password != ""
        and secrets.compare_digest(credentials.username.encode("utf-8"), settings.dashboard_username.encode("utf-8"))
        and secrets.compare_digest(credentials.password.encode("utf-8"), settings.dashboard_password.encode("utf-8"))
    )
    if not valid:
        raise HTTPException(
            status_code=401,
            detail="Wrong username or password",
            headers={"WWW-Authenticate": "Basic"},
        )


class EntryUpdate(BaseModel):
    title: str
    content: str


api = APIRouter(prefix="/api", dependencies=[Depends(require_login)])


@api.get("/login")
def login() -> dict:
    return {"ok": True}


@api.get("/overview")
def overview() -> dict:
    return db.get_overview_stats()


@api.get("/events")
def events() -> list[dict]:
    return db.list_events()


@api.get("/tickets")
def tickets() -> list[dict]:
    return db.list_tickets()


@api.get("/tickets/{ticket_id}/messages")
def ticket_messages(ticket_id: int) -> list[dict]:
    return db.list_messages(ticket_id)


@api.get("/knowledge-base")
def knowledge_base() -> list[dict]:
    return db.list_knowledge_base()


@api.put("/knowledge-base/{entry_id}")
def update_entry(entry_id: int, update: EntryUpdate) -> dict:
    entry = db.update_knowledge_base_entry(entry_id, update.title, update.content)
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    return entry


@api.post("/poll")
def poll() -> dict:
    try:
        count = poll_once()
        return {"messages": count}
    except Exception as e:
        logger.exception("Polling failed")
        raise HTTPException(status_code=500, detail=f"Polling failed: {e}")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


app.include_router(api)

# The built dashboard. Mounted last, so the API routes above take precedence.
dashboard = Path(__file__).resolve().parent.parent / "dashboard" / "dist"
if dashboard.exists():
    app.mount("/", StaticFiles(directory=dashboard, html=True), name="dashboard")
