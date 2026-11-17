# AI Customer Support Automation

> Production-grade, autonomous customer support agent and triage pipeline powered by FastAPI, Pydantic AI, OpenAI models, PostgreSQL/Supabase, Gmail API, and a React + TypeScript admin dashboard deployed on Azure Container Apps.

---

## 🌟 Overview

**AI Customer Support Automation** is an end-to-end customer service platform built for e-commerce and retail businesses. Customer support teams spend hundreds of hours responding to repetitive order inquiries, tracking requests, product compatibility questions, and warranty issues. Unanswered inquiries lead to negative reviews and lost sales, while manual triage slows down escalation of critical customer complaints.

This platform automates the entire customer email lifecycle:
1. **Intelligent Ingestion & Guardrails**: Continuously monitors incoming emails via the Gmail API, applying deterministic email headers and bot guardrails to filter out spam, auto-replies, and internal communications.
2. **Deterministic Triage & Classification**: Uses an LLM classifier to categorize incoming threads into specialized domain topics (`paddle-boards`, `shelving`, `returns-and-warranty`, `shipping`, etc.) and immediately flags angry customers, chargeback threats, injury reports, or out-of-scope requests for human intervention.
3. **Agentic Knowledge Base Grounding**: Uses Pydantic AI agents equipped with tools to retrieve live company policy documentation, ensuring factual grounding and zero hallucinations.
4. **Deterministic Business Policy Enforcement**: Python rules enforce strict business policies (e.g., replacement eligibility windows, required photos/part numbers, valve checks) before any action is approved.
5. **Real-Time Admin Dashboard**: Provides operational visibility through an authenticated React dashboard where human operators can monitor email events, inspect multi-turn conversation threads, trigger on-demand polling, and edit knowledge base documentation in real time.

---

## 🚀 Live Demo

* **Live Admin Dashboard**: **[https://ai-customer-support.najeebsayyed.in](https://ai-customer-support.najeebsayyed.in)**
* **Public Health Endpoint**: **[https://ai-customer-support.najeebsayyed.in/health](https://ai-customer-support.najeebsayyed.in/health)**
* **Interactive API Documentation**: **[https://ai-customer-support.najeebsayyed.in/docs](https://ai-customer-support.najeebsayyed.in/docs)**

> [!NOTE]
> The admin dashboard is protected with HTTP Basic Authentication. Visiting operators can inspect the live interface, review ticket threads, and monitor background poller activity.

---

## ⚡ Key Features

* **Autonomous Email Ingestion**: Gmail API OAuth 2.0 integration with automatic thread tracking and label management (`ai-processed`, `needs-human`).
* **Ingestion Guardrails**: Discards automated replies (`auto-submitted`), mailing list newsletters (`precedence: bulk/list`), messages sent by our own team, and already processed threads.
* **Deterministic Intent Classification**: Classifies customer inquiries by business section, detects language automatically, and identifies mandatory human escalation triggers (legal threats, chargeback demands, safety issues, prompt injections).
* **Tool-Equipped Support Agent**: Pydantic AI agent dynamically queries section-specific documentation and company escalation policies via typed database tools before drafting answers.
* **Automated Two-Phase Validation**: Python-driven business validation inspects proposed answers, verifies order number requirements, enforces warranty rules, and prevents agents from promising refunds or unauthorized replacements.
* **Overlapping Execution Protection**: Uses PostgreSQL advisory locks (`pg_try_advisory_lock`) to guarantee that scheduled background jobs, continuous pollers, and manual dashboard triggers never process the same messages concurrently.
* **Modern React Admin Dashboard**: Built with React 19, TypeScript, Vite, and Tailwind CSS. Features:
  * **Overview**: Real-time KPI statistics, email volume, ticket resolution states, and quick ingestion controls.
  * **Events**: Paginated event ingestion audit trail detailing Gmail IDs, execution statuses, attempts, and error logs.
  * **Tickets**: Split-pane conversation viewer showing customer threads, AI responses, timestamps, and triage metadata.
  * **Knowledge Base Editor**: In-app Markdown policy editor to update company documentation instantly without redeploying code.
* **Serverless Scale-to-Zero Deployment**: Dockerized multi-stage container deployed on Azure Container Apps Consumption tier with automated background poller jobs.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend API** | Python 3.13+, FastAPI, Uvicorn, Pydantic v2, Pydantic Settings |
| **Frontend Dashboard** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons |
| **AI & LLMs** | Pydantic AI, OpenAI (`gpt-6-luna` for classifier, `gpt-6.1-sol` for agent) |
| **Database & Persistence** | PostgreSQL / Supabase, Psycopg 3 (native connection pooler & advisory locking) |
| **Integrations** | Google Cloud Gmail API v1, Google OAuth 2.0 Client |
| **Background Processing** | Azure Container Apps Jobs (Cron), Python Poller daemon |
| **Testing & Quality** | Pytest, Pydantic Evals, Oxlint, TypeScript (`tsc -b`) |
| **Package Management** | `uv` (Fast Python package and dependency manager), `npm` |
| **Container & Cloud** | Multi-Stage Dockerfile, Docker Compose, Azure Container Apps, Azure Container Registry |

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph Customer["Customer Channels"]
        User["Customer Email"]
    end

    subgraph External["External Services"]
        Gmail["Google Gmail API v1"]
        OpenAI["OpenAI API (gpt-6-luna / gpt-6.1-sol)"]
        Supabase["Supabase PostgreSQL Database"]
    end

    subgraph Azure["Azure Container Apps (env-invoice-review)"]
        subgraph PollerJob["Scheduled Poller (Container App Job)"]
            Runner["python -m app.poller_once"]
            AdvisoryLock["PostgreSQL Advisory Lock"]
        end

        subgraph WebService["Web Service (Container App)"]
            FastAPI["FastAPI Backend (:8000)"]
            Auth["HTTP Basic Authentication"]
            Dashboard["React Admin Dashboard (dist/)"]
        end
    end

    subgraph CorePipeline["Core Processing Pipeline"]
        Guards["Email Guards (app/guards.py)"]
        Classifier["AI Classifier (gpt-6-luna)"]
        Agent["Pydantic AI Agent (gpt-6.1-sol)"]
        Rules["Deterministic Business Rules (app/ai/rules.py)"]
    end

    User -->|Sends Email| Gmail
    Runner -->|Cron Trigger| AdvisoryLock
    AdvisoryLock -->|Acquire Lock| Supabase
    Runner -->|Fetch Unread| Gmail
    Runner --> Guards
    Guards -->|Valid Inbound| Classifier
    Classifier -->|Intent & Escalation| OpenAI
    Classifier --> Agent
    Agent -->|Query KB Tools| Supabase
    Agent -->|Draft Answer| OpenAI
    Agent --> Rules
    Rules -->|Approved| Gmail
    Rules -->|Store Ticket & Message| Supabase

    AdminUser["Operator / Support Manager"] -->|HTTPS Basic Auth| Dashboard
    Dashboard --> FastAPI
    FastAPI --> Auth
    FastAPI -->|Query Stats & Tickets| Supabase
    FastAPI -->|Manual Poll Inbox| AdvisoryLock
```

---

## 🔄 Application Workflow

The following flowchart illustrates the complete lifecycle of an incoming customer inquiry from arrival to resolution:

```mermaid
flowchart TD
    Start["New Message in Gmail Inbox"] --> Poller["Poller Fetches Message IDs"]
    Poller --> LockCheck{"Acquire Advisory Lock?"}
    LockCheck -- No --> SkipPoller["Skip (Another worker is active)"]
    LockCheck -- Yes --> StartEvent["Record Event in DB (status: processing)"]
    
    StartEvent --> CheckGuards{"Passes Email Guards?\n(Not sent by us, not bulk, not auto-replied)"}
    CheckGuards -- No --> MarkSkipped["Mark Event as Skipped & Add ai-processed Label"]
    
    CheckGuards -- Yes --> UpsertTicket["Upsert Ticket & Save Inbound Message"]
    UpsertTicket --> CheckEscalated{"Is Thread Already Escalated?\n(has needs-human label)"}
    CheckEscalated -- Yes --> SkipEscalated["Skip Processing (Human Colleague Owns Thread)"]
    
    CheckEscalated -- No --> Classifier["Run Classifier (gpt-6-luna)"]
    Classifier --> CheckNeedsHuman{"Classifier Flags Escalation?\n(angry, refund, legal, prompt injection)"}
    
    CheckNeedsHuman -- Yes --> EscalateTicket["Update Ticket Status: escalated\nAdd needs-human Label\nSend Human Hand-off Acknowledgement"]
    CheckNeedsHuman -- No --> Agent["Pydantic AI Agent (gpt-6.1-sol)"]
    
    Agent --> ToolCall["Agent Queries Knowledge Base via get_section()"]
    ToolCall --> AgentReply["Agent Drafts Proposed Response"]
    
    AgentReply --> CheckInfo{"Enough Information & No False Promises?"}
    CheckInfo -- No --> EscalateTicket
    
    CheckInfo -- Yes --> CheckIssue{"Is Product Issue Reported?"}
    CheckIssue -- Yes --> BusinessRules["Evaluate Business Rules (app/ai/rules.py)"]
    BusinessRules --> ActionDecided{"Customer Action Needed?\n(e.g., valve-check, missing order number)"}
    ActionDecided -- Yes --> SendReply["Send Clarification Reply to Customer"]
    ActionDecided -- No --> EscalateTicket
    
    CheckIssue -- No --> SendReply["Send Solution Reply via Gmail API"]
    SendReply --> SaveOutbound["Save Outbound Message in DB"]
    SaveOutbound --> UpdateTicketAnswered["Update Ticket Status: answered"]
    UpdateTicketAnswered --> AddProcessedLabel["Add ai-processed Label in Gmail"]
    AddProcessedLabel --> FinishEvent["Update Event (status: processed)"]
    EscalateTicket --> FinishEvent
    FinishEvent --> ReleaseLock["Release Advisory Lock"]
    ReleaseLock --> End["Cycle Complete"]
```

---

## 📁 Project Structure

```text
ai-customer-support/
├── app/                              # Core backend application
│   ├── ai/                           # AI agents, prompts, tools, and business rules
│   │   ├── agent.py                  # Pydantic AI support agent with DB tools
│   │   ├── classifier.py             # Zero-shot intent classifier and escalation guard
│   │   ├── decide.py                 # Decision pipeline combining classifier and agent
│   │   ├── rules.py                  # Deterministic product problem & warranty rules
│   │   └── schemas.py                # Strongly-typed Pydantic schemas
│   ├── config.py                     # Application configuration and settings (BaseSettings)
│   ├── db.py                         # PostgreSQL database access layer and advisory locks
│   ├── gmail.py                      # Gmail API client, thread parsing, and email formatting
│   ├── guards.py                     # Header-based email validation guardrails
│   ├── main.py                       # FastAPI API router, static mount, and HTTP Basic Auth
│   ├── pipeline.py                   # High-level email processing and event lifecycle
│   ├── poller.py                     # Continuous polling daemon for local development
│   └── poller_once.py                # Single-cycle poller runner for Azure Container Apps Jobs
├── dashboard/                        # Modern React Admin Dashboard
│   ├── public/                       # Static assets and custom SVG favicon
│   │   └── favicon.svg               # Application favicon
│   ├── src/                          # Frontend source code
│   │   ├── components/               # UI components (cards, tables, buttons, badges)
│   │   │   ├── layout/               # Header, Sidebar, and Layout wrappers
│   │   │   └── ui/                   # Reusable atomic UI elements
│   │   ├── lib/                      # API client, TypeScript models, date formatters
│   │   ├── pages/                    # Overview, Events, Tickets, Knowledge Base, Login
│   │   ├── App.tsx                   # Main React entrypoint
│   │   └── main.tsx                  # Vite DOM bootstrap
│   ├── package.json                  # Node.js dependencies and build scripts
│   ├── tsconfig.json                 # TypeScript compiler configuration
│   └── vite.config.ts                # Vite build and development server proxy
├── evals/                            # AI evaluation harness
│   ├── golden_emails.py              # 18 representative customer inquiry test cases
│   └── run_evals.py                  # Async benchmark runner evaluating accuracy
├── knowledge_base/                   # Raw Markdown policy files for company store
│   ├── brand-and-tone.md             # Voice, tone, and formatting constraints
│   ├── escalation-rules.md           # Mandatory human hand-off criteria
│   ├── paddle-boards.md              # Inflatable paddle boards, leaks, accessories
│   ├── returns-and-warranty.md       # Return windows and warranty policies
│   ├── shelving.md                   # Flat-pack furniture specs, panel replacement
│   └── shipping.md                   # Courier timeframes and replacement delivery
├── scripts/                          # Setup and maintenance scripts
│   ├── get_refresh_token.py          # Google Cloud OAuth refresh token generator
│   ├── gmail_check.py                # Quick verification of Gmail API connectivity
│   └── seed_knowledge_base.py        # Seeds database from knowledge_base/*.md files
├── supabase/                         # Supabase configuration and database migrations
│   └── migrations/
│       └── 20261104161442_create_tables.sql # Schema DDL for events, tickets, messages, KB
├── tests/                            # Pytest automated unit test suite
│   ├── test_api.py                   # Health endpoint and HTTP Basic Auth tests
│   ├── test_guards.py                # Email guardrail filtering tests
│   ├── test_rules.py                 # Deterministic business logic & warranty tests
│   └── test_schemas.py               # Pydantic schema validation tests
├── .dockerignore                     # Production Docker build exclusions
├── .env.example                      # Sanitized environment template
├── .gitignore                        # Git exclusion rules
├── docker-compose.yml                # Multi-service local Docker environment
├── Dockerfile                        # Multi-stage production container build
├── pyproject.toml                    # Python project dependencies and metadata
└── uv.lock                           # Deterministic Python lockfile
```

---

## 💻 Installation and Local Setup

### Prerequisites

* **Python 3.13+** installed
* **uv** installed (Recommended: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"` on Windows)
* **Node.js 20+** and **npm**
* A **Supabase PostgreSQL** instance (or local PostgreSQL 15+)
* An **OpenAI API Key**
* A **Google Cloud Project** with the Gmail API enabled

---

### Step 1: Clone the Repository

```bash
git clone https://github.com/najeebsayyed/ai-customer-support.git
cd ai-customer-support
```

---

### Step 2: Configure Environment Variables

Copy the template file to `.env`:

```powershell
Copy-Item .env.example .env
```

Edit `.env` with your actual credentials:

```dotenv
DATABASE_URL=postgresql://postgres:your-db-password@db.your-supabase-ref.supabase.co:5432/postgres
OPENAI_API_KEY=sk-proj-your-openai-api-key
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret
GOOGLE_REFRESH_TOKEN=1//0your-refresh-token
CLASSIFIER_MODEL=openai:gpt-6-luna
AGENT_MODEL=openai:gpt-6.1-sol
POLL_INTERVAL_SECONDS=30
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=your-secure-password
PYDANTIC_AI_NO_BANNER=1
```

---

### Step 3: Install Backend Dependencies & Run Database Migrations

Install dependencies using `uv`:

```bash
uv sync
```

Apply the database schema to your PostgreSQL / Supabase database:
1. Open the [Supabase SQL Editor](https://supabase.com/dashboard).
2. Execute the migration file: [`supabase/migrations/20261104161442_create_tables.sql`](file:///c:/Projects/ai-customer-support/supabase/migrations/20261104161442_create_tables.sql).
3. Populate company policy documentation into the `knowledge_base` table:

```bash
uv run python -m scripts.seed_knowledge_base
```

---

### Step 4: Configure Google Gmail API Credentials

1. Open the [Google Cloud Console](https://console.cloud.google.com/) and enable the **Gmail API**.
2. Under **OAuth consent screen**, choose **External** and add your Gmail account as a **Test User**.
3. Under **Credentials**, create an **OAuth Client ID** with application type **Desktop app**.
4. Download the JSON credential file and save it in the root directory as `credentials.json`.
5. Run the authentication helper to generate your refresh token:

```bash
uv run python -m scripts.get_refresh_token
```

6. Copy the output `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REFRESH_TOKEN` into your `.env` file.

---

### Step 5: Install Dashboard Dependencies

```bash
cd dashboard
npm install
cd ..
```

---

### Step 6: Run Locally

For local development with live reloading, open 3 terminal windows:

#### Terminal 1: FastAPI Backend
```bash
uv run python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
* Health Endpoint: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
* Swagger UI Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### Terminal 2: React Dashboard (Vite Dev Server)
```bash
cd dashboard
npm run dev
```
* Dashboard UI: [http://localhost:5173](http://localhost:5173) (Proxies `/api` requests to port `8000`)

#### Terminal 3: Background Gmail Poller
```bash
# Continuous polling daemon
uv run python -m app.poller

# Or run a single polling cycle (ACA Job mode)
uv run python -m app.poller_once
```

---

## 🔑 Environment Variables Reference

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string. *(Use Supabase IPv4 Pooler host on Azure)* |
| `OPENAI_API_KEY` | **Yes** | — | OpenAI API authentication key (`sk-proj-...`) |
| `GOOGLE_CLIENT_ID` | **Yes** | — | Google Cloud OAuth 2.0 Client ID for Gmail API |
| `GOOGLE_CLIENT_SECRET` | **Yes** | — | Google Cloud OAuth 2.0 Client Secret |
| `GOOGLE_REFRESH_TOKEN` | **Yes** | — | OAuth 2.0 Refresh Token authorizing Gmail access |
| `CLASSIFIER_MODEL` | No | `openai:gpt-6-luna` | OpenAI model identifier used for intent triage |
| `AGENT_MODEL` | No | `openai:gpt-6.1-sol` | OpenAI model identifier used for support answers |
| `POLL_INTERVAL_SECONDS` | No | `60` | Polling interval in seconds for the continuous daemon |
| `DASHBOARD_USERNAME` | No | `admin` | HTTP Basic Auth username for dashboard and API access |
| `DASHBOARD_PASSWORD` | **Yes** | — | HTTP Basic Auth password for dashboard and API access |
| `CORS_ORIGINS` | No | `*` | Comma-separated allowed origins for CORS (e.g., `https://ai-customer-support.najeebsayyed.in`) |
| `PYDANTIC_AI_NO_BANNER` | No | `1` | Suppresses Pydantic AI startup banner in production container logs |

---

## 📡 API Documentation

All administrative endpoints are prefixed with `/api` and secured with HTTP Basic Authentication. Interactive OpenAPI documentation is automatically available at `/docs`.

| Method | Endpoint | Auth | Description |
| :--- | :--- | :---: | :--- |
| `GET` | `/health` | No | System health check returning `{"status": "ok"}` |
| `GET` | `/api/login` | Basic | Validates operator credentials and returns `{"ok": true}` |
| `GET` | `/api/overview` | Basic | Aggregated metrics: email counts, ticket statuses, recent activity |
| `GET` | `/api/events` | Basic | Paginated audit log of incoming email ingestion events |
| `GET` | `/api/tickets` | Basic | List of customer support tickets sorted by latest update |
| `GET` | `/api/tickets/{id}/messages` | Basic | Complete conversation history (inbound & outbound) for a ticket |
| `GET` | `/api/knowledge-base` | Basic | List all company documentation and policy sections |
| `PUT` | `/api/knowledge-base/{id}` | Basic | Update policy title and Markdown content in real time |
| `POST` | `/api/poll` | Basic | Manually triggers an immediate email polling cycle |

---

## 🗄️ Database Schema

The database consists of 4 normalized relational tables with Row Level Security (RLS) enabled:

```mermaid
erDiagram
    TICKETS ||--o{ MESSAGES : "contains"
    
    EVENTS {
        bigint id PK
        text gmail_message_id UK
        text status "processing | processed | skipped | failed"
        int attempts
        text error
        jsonb result
        timestamptz created_at
        timestamptz processed_at
    }

    TICKETS {
        bigint id PK
        text gmail_thread_id UK
        text customer_email
        text subject
        text category
        text status "open | answered | escalated"
        text proposed_action
        timestamptz created_at
        timestamptz updated_at
    }

    MESSAGES {
        bigint id PK
        bigint ticket_id FK
        text gmail_message_id UK
        text direction "in | out"
        text from_address
        text body
        timestamptz created_at
    }

    KNOWLEDGE_BASE {
        bigint id PK
        text section
        text title
        text content
        timestamptz updated_at
    }
```

* **`events`**: Event-sourcing log tracking every Gmail message ingested. Ensures idempotency via `gmail_message_id` unique constraint.
* **`tickets`**: Represents customer support cases mapped 1-to-1 with Gmail threads. Tracks current resolution state and escalation categories.
* **`messages`**: Inbound and outbound message history for each ticket, preserving email bodies and chronological timestamps.
* **`knowledge_base`**: Markdown policies grouped by section (`paddle-boards`, `shelving`, `shipping`, etc.) queried dynamically by AI agents.

---

## ☁️ Deployment

The application is deployed on **Microsoft Azure** using **Azure Container Apps (ACA) Consumption Tier**, providing automatic HTTPS SSL termination, serverless auto-scaling, and scale-to-zero capability.

### Azure Architecture

1. **Web App (`Container App`)**: Hosts FastAPI and the compiled React dashboard static assets. Accessible via custom domain with an automated Azure Managed Certificate.
2. **Scheduled Poller (`Container App Job`)**: Executes `python -m app.poller_once` on a cron schedule (`*/2 * * * *` — every 2 minutes). Exits after one polling cycle, billing only for active execution seconds.
3. **Container Registry (`Azure Container Registry`)**: Houses multi-stage production Docker images (`acrinvoicereview.azurecr.io/ai-customer-support:latest`).

> [!IMPORTANT]
> **Supabase IPv4 Connection Pooler on Azure Container Apps**:
> Azure Container Apps environments currently do not support outbound IPv6 network traffic. Because Supabase direct hostnames (`db.<project-ref>.supabase.co:5432`) resolve strictly to IPv6, production deployments must configure `DATABASE_URL` using the Supabase Connection Pooler in **session mode** (port `5432`):
> `postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`
> Session mode (`5432`) retains full support for PostgreSQL advisory locking (`pg_try_advisory_lock`), ensuring concurrency protection across distributed replicas.

### Docker Multi-Stage Build

Build and test the production container locally:

```bash
docker build -t ai-customer-support:latest .
docker run -p 8000:8000 --env-file .env ai-customer-support:latest
```

---

## 🔒 Security

* **Zero Committed Secrets**: `.env`, `credentials.json`, tokens, and certificate files are excluded via `.gitignore`.
* **Constant-Time Authentication**: Administrative credentials in `app/main.py` are verified using `secrets.compare_digest` to prevent timing attacks.
* **Parameterized Database Queries**: All database queries use parameterized placeholders (`%s`) via Psycopg 3, completely preventing SQL injection vulnerabilities.
* **Strict Email Guardrails**: Validates email headers (`auto-submitted`, `precedence: bulk/list/junk`) before triggering AI agents, mitigating email loops and denial-of-wallet risks.
* **Sanitized API Errors**: Production endpoints log detailed errors server-side while returning generic error messages to clients, preventing stack trace and system path disclosure.
* **Strict Input Validation**: Pydantic models validate all incoming requests, constraining title and content lengths.
* **Prompt Injection Defense**: The classification engine explicitly detects instructions attempting to override rules, immediately routing them to human review.

---

## 🧪 Testing & Evals

### 1. Pytest Unit Tests
Run the automated test suite covering API security, email guardrails, deterministic business logic, and Pydantic schemas:

```bash
uv run python -m pytest -v
```

```text
tests/test_api.py::test_health_endpoint PASSED                           [  4%]
tests/test_api.py::test_api_login_unauthorized_without_credentials PASSED [  9%]
tests/test_api.py::test_api_login_unauthorized_with_wrong_password PASSED [ 13%]
tests/test_api.py::test_api_login_authorized_with_valid_credentials PASSED [ 18%]
tests/test_guards.py::test_skip_reason_normal_message_allowed PASSED     [ 22%]
tests/test_guards.py::test_skip_reason_sent_by_us PASSED                 [ 27%]
tests/test_guards.py::test_skip_reason_from_own_address PASSED           [ 31%]
tests/test_guards.py::test_skip_reason_auto_submitted PASSED             [ 36%]
tests/test_guards.py::test_skip_reason_bulk_and_list_precedence PASSED   [ 40%]
tests/test_rules.py::test_paddle_board_missing_accessory PASSED          [ 45%]
tests/test_rules.py::test_paddle_board_missing_accessory_without_order_number PASSED [ 50%]
tests/test_rules.py::test_paddle_board_slow_leak_valve_not_checked PASSED [ 54%]
tests/test_rules.py::test_paddle_board_slow_leak_under_30_days PASSED    [ 59%]
tests/test_rules.py::test_paddle_board_slow_leak_over_30_days PASSED     [ 63%]
tests/test_rules.py::test_shelving_missing_hardware PASSED               [ 68%]
tests/test_rules.py::test_shelving_damaged_panels_two_or_fewer PASSED    [ 72%]
tests/test_rules.py::test_shelving_damaged_panels_more_than_two PASSED   [ 77%]
tests/test_rules.py::test_seam_split_escalates PASSED                    [ 81%]
tests/test_schemas.py::test_classification_model PASSED                  [ 86%]
tests/test_schemas.py::test_issue_model_defaults PASSED                  [ 90%]
tests/test_schemas.py::test_decision_model PASSED                        [ 95%]
tests/test_schemas.py::test_agent_reply_model PASSED                     [100%]

============================= 22 passed in 3.76s ==============================
```

### 2. AI Golden Email Evaluation Benchmark
Evaluate the complete AI pipeline against 18 golden test cases representing real-world customer inquiries:

```bash
uv run python -m evals.run_evals
```
*(Evaluates accuracy across classification sections, human escalation triggers, multilingual responses, and business rule steps).*

### 3. Frontend Linting & Build Verification
```bash
cd dashboard
npm run lint    # Runs oxlint (0 errors, 0 warnings)
npm run build   # Verifies TypeScript compilation and Vite production bundling
```

---

## ❓ Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| `psycopg.OperationalError: Cannot assign requested address` | Azure Container Apps does not support outbound IPv6 | Update `DATABASE_URL` to use the Supabase Connection Pooler IPv4 host (`aws-0-<region>.pooler.supabase.com:5432/postgres`) in session mode. |
| `401 Unauthorized` on `/api/*` | Missing or invalid HTTP Basic Auth header | Provide username and password via HTTP Basic Auth matching `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD`. |
| Windows Smart App Control blocks `.exe` | Windows WDAC / AppLocker blocks execution of binary stubs in virtual environments | Run Python commands using module syntax: `uv run python -m pytest` or `uv run python -m uvicorn app.main:app`. |
| Gmail API `invalid_grant` | Expired or revoked OAuth refresh token | Re-run `uv run python -m scripts.get_refresh_token` and update `GOOGLE_REFRESH_TOKEN` in your `.env`. |
| Knowledge Base edits not reflected | Section not selected or uncommitted changes | Click **Save Changes** in the Knowledge Base editor; verify updates in the database `knowledge_base` table. |

---

## 🔮 Future Improvements

- [ ] **Multi-Channel Support**: Ingestion adapters for Zendesk tickets, WhatsApp Business API, and Slack support channels.
- [ ] **Vector Embeddings (RAG)**: Hybrid dense/sparse vector retrieval with `pgvector` for massive documentation catalogs with thousands of pages.
- [ ] **Automated CSAT Surveys**: Follow-up email dispatch triggering 24 hours after ticket resolution to collect satisfaction scores.
- [ ] **Human-in-the-Loop Approval Queue**: Dashboard button allowing support managers to review and approve drafted replies before sending.

---

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome!

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Ensure all tests and linting pass (`uv run python -m pytest`, `npm run lint`).
5. Push to the branch (`git push origin feature/amazing-feature`).
6. Open a Pull Request.

---

## 📄 License

The license for this repository has not yet been specified. All rights reserved.

---

## Author

**Najeeb Sayyed**

- Portfolio: [https://najeebsayyed.in](https://najeebsayyed.in)
- LinkedIn: [https://www.linkedin.com/in/najeebsayyed/](https://www.linkedin.com/in/najeebsayyed/)
