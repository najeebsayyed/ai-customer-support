import contextlib
import time
import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from app.config import settings

POLLER_LOCK_KEY = 74839201948271


@contextlib.contextmanager
def acquire_poller_lock():
    """Acquire a Postgres advisory lock to prevent concurrent polling across processes.
    Yields True if acquired, False if another process holds the lock.
    """
    with connect() as conn:
        row = conn.execute(
            "select pg_try_advisory_lock(%s) as acquired",
            (POLLER_LOCK_KEY,),
        ).fetchone()
        acquired = bool(row and row["acquired"])
        try:
            yield acquired
        finally:
            if acquired:
                try:
                    conn.execute(
                        "select pg_advisory_unlock(%s)",
                        (POLLER_LOCK_KEY,),
                    )
                except Exception:
                    pass


def connect(retries: int = 3, delay: float = 0.5) -> psycopg.Connection:
    if not settings.database_url or not settings.database_url.strip():
        raise ValueError("DATABASE_URL environment variable is not configured.")
    last_err = None
    for attempt in range(retries):
        try:
            return psycopg.connect(settings.database_url, autocommit=True, row_factory=dict_row)
        except psycopg.OperationalError as e:
            last_err = e
            if attempt < retries - 1:
                time.sleep(delay)
    raise last_err


def start_event(gmail_message_id: str) -> dict | None:
    """Claim a message. Returns None when it is already handled or in progress."""
    with connect() as conn:
        return conn.execute(
            """
            insert into events (gmail_message_id) values (%s)
            on conflict (gmail_message_id) do update
              set attempts = events.attempts + 1, status = 'processing', error = null
              where events.status = 'failed'
            returning id, attempts
            """,
            (gmail_message_id,),
        ).fetchone()


def finish_event(event_id: int, status: str, result: dict) -> None:
    with connect() as conn:
        conn.execute(
            "update events set status = %s, result = %s, processed_at = now() where id = %s",
            (status, Jsonb(result), event_id),
        )


def fail_event(event_id: int, error: str) -> None:
    with connect() as conn:
        conn.execute(
            "update events set status = 'failed', error = %s where id = %s",
            (error, event_id),
        )


def upsert_ticket(gmail_thread_id: str, customer_email: str, subject: str) -> int:
    with connect() as conn:
        row = conn.execute(
            """
            insert into tickets (gmail_thread_id, customer_email, subject)
            values (%s, %s, %s)
            on conflict (gmail_thread_id) do update set updated_at = now()
            returning id
            """,
            (gmail_thread_id, customer_email, subject),
        ).fetchone()
        return row["id"]


def update_ticket(
    ticket_id: int, status: str, category: str | None = None, proposed_action: str | None = None
) -> None:
    with connect() as conn:
        conn.execute(
            """
            update tickets
            set status = %s, category = coalesce(%s, category),
                proposed_action = %s, updated_at = now()
            where id = %s
            """,
            (status, category, proposed_action, ticket_id),
        )


def save_message(
    ticket_id: int, gmail_message_id: str, direction: str, from_address: str, body: str
) -> None:
    with connect() as conn:
        conn.execute(
            """
            insert into messages (ticket_id, gmail_message_id, direction, from_address, body)
            values (%s, %s, %s, %s, %s)
            on conflict (gmail_message_id) do nothing
            """,
            (ticket_id, gmail_message_id, direction, from_address, body),
        )


def list_sections() -> list[str]:
    with connect() as conn:
        rows = conn.execute("select distinct section from knowledge_base order by section").fetchall()
        return [row["section"] for row in rows]


def get_section(section: str) -> list[dict]:
    with connect() as conn:
        return conn.execute(
            "select title, content from knowledge_base where section = %s order by id",
            (section,),
        ).fetchall()


def list_events(limit: int = 100) -> list[dict]:
    with connect() as conn:
        return conn.execute(
            "select * from events order by id desc limit %s", (limit,)
        ).fetchall()


def list_tickets(limit: int = 100) -> list[dict]:
    with connect() as conn:
        return conn.execute(
            "select * from tickets order by updated_at desc limit %s", (limit,)
        ).fetchall()


def list_messages(ticket_id: int) -> list[dict]:
    with connect() as conn:
        return conn.execute(
            "select * from messages where ticket_id = %s order by id asc", (ticket_id,)
        ).fetchall()


def list_knowledge_base() -> list[dict]:
    with connect() as conn:
        return conn.execute(
            "select id, section, title, content, updated_at from knowledge_base order by section, id"
        ).fetchall()


def update_knowledge_base_entry(entry_id: int, title: str, content: str) -> dict | None:
    with connect() as conn:
        return conn.execute(
            """
            update knowledge_base set title = %s, content = %s, updated_at = now()
            where id = %s returning id, section, title, content, updated_at
            """,
            (title, content, entry_id),
        ).fetchone()


def get_overview_stats() -> dict:
    with connect() as conn:
        processed_emails = conn.execute(
            "select count(*) as count from events where status = 'processed'"
        ).fetchone()["count"]
        failed_events = conn.execute(
            "select count(*) as count from events where status = 'failed'"
        ).fetchone()["count"]
        total_events = conn.execute(
            "select count(*) as count from events"
        ).fetchone()["count"]
        open_tickets = conn.execute(
            "select count(*) as count from tickets where status = 'open'"
        ).fetchone()["count"]
        answered_tickets = conn.execute(
            "select count(*) as count from tickets where status = 'answered'"
        ).fetchone()["count"]
        escalated_tickets = conn.execute(
            "select count(*) as count from tickets where status = 'escalated'"
        ).fetchone()["count"]
        total_tickets = conn.execute(
            "select count(*) as count from tickets"
        ).fetchone()["count"]

        recent_events = conn.execute(
            "select id, gmail_message_id, status, error, created_at, processed_at from events order by id desc limit 8"
        ).fetchall()
        recent_tickets = conn.execute(
            "select id, customer_email, subject, category, status, updated_at from tickets order by updated_at desc limit 8"
        ).fetchall()

        return {
            "processed_emails": processed_emails,
            "failed_events": failed_events,
            "total_events": total_events,
            "open_tickets": open_tickets,
            "answered_tickets": answered_tickets,
            "escalated_tickets": escalated_tickets,
            "total_tickets": total_tickets,
            "recent_events": recent_events,
            "recent_tickets": recent_tickets,
        }
