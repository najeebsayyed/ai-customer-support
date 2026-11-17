# 🤖 AI Customer Support Automation & Admin Dashboard

An autonomous, multi-agent AI customer support platform built with **FastAPI**, **Pydantic AI**, **PostgreSQL (Supabase)**, the **Gmail API**, and a modern **React / TypeScript / Vite / Tailwind CSS** admin dashboard.

The system continuously monitors an incoming support inbox, triages messages with guardrails, references a grounded product knowledge base, applies deterministic business rules, saves conversation history, sends automated replies or escalates to human agents, and provides a full-featured admin dashboard for monitoring, ticket review, and knowledge base editing.

---

## ✨ Features

- **Multi-Stage AI Pipeline**:
  - **Triage & Classification**: Fast model (`openai:gpt-6-luna`) categorizes inquiries and catches escalation triggers (anger, refund demands, legal threats, prompt injections).
  - **Grounded Drafting**: Reasoning model (`openai:gpt-6.1-sol`) queries the PostgreSQL knowledge base for factual product answers and draft replies.
  - **Deterministic Rule Enforcement**: Python logic enforces business constraints (e.g. asking for missing order numbers before sending replacements).
- **Flexible Gmail Poller Execution**:
  - **Continuous Poller**: Long-running background loop (`python -m app.poller`) for local development or traditional VPS deployments.
  - **Scheduled One-Time Poller**: Single-cycle job worker (`python -m app.poller_once`) designed specifically for serverless cron jobs (Azure Container Apps Jobs, Kubernetes CronJobs).
  - **Overlapping Execution Guard**: Protected by PostgreSQL advisory locks (`pg_try_advisory_lock`) to prevent race conditions across parallel jobs, workers, or manual dashboard triggers.
- **PostgreSQL Database Integration**: Persistent storage for ingestion events, customer tickets, message threads, and editable knowledge base entries.
- **Full-Featured Admin Dashboard**:
  - **Overview**: Real-time KPI metrics (Processed emails, Failed events, Open tickets, Answered tickets, Escalated tickets) and recent activity stream directly from PostgreSQL.
  - **Events Management**: Search, filter by status (`processing`, `processed`, `skipped`, `failed`), inspect attempts/errors, and trigger immediate inbox polling with "Check inbox now".
  - **Tickets & Conversation Threads**: Search, filter by status and category, inspect ticket details and AI proposed actions, and view complete message histories clearly distinguishing customer inquiries from autonomous AI replies.
  - **Knowledge Base Editor**: Browse articles grouped by section, edit titles and markdown content, save changes with live persistence to PostgreSQL, with unsaved-changes protection.
  - **Security**: Protected with HTTP Basic Authentication and constant-time credential comparison.
- **Evaluation Suite**: Built-in test harness with 18 golden test cases powered by `pydantic-evals` (100% pass rate).

---

## 🚀 Quick Start Guide

### Prerequisites

- **Python**: Version `>= 3.13`
- **Node.js**: Version `>= 20.x` & `npm`
- **[uv](https://docs.astral.sh/uv/)**: Fast Python package manager (`pip install uv` or via [official installer](https://github.com/astral-sh/uv))
- **PostgreSQL**: A database instance (e.g., free tier on [Supabase](https://supabase.com))
- **OpenAI API Key**: For model inference
- **Google Cloud Account**: With Gmail API enabled
- **Docker**: For containerized local testing and cloud deployment

---

### Step 1: Clone & Install Python Dependencies

```bash
git clone https://github.com/<your-username>/ai-customer-support.git
cd ai-customer-support

# Install Python dependencies using uv
uv sync
```

---

### Step 2: Configure Environment Variables

Create a `.env` file from the example template:

```bash
# On Linux/macOS
cp .env.example .env

# On Windows (PowerShell)
Copy-Item .env.example .env
```

Open `.env` and fill in your keys:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres
OPENAI_API_KEY=sk-...

CLASSIFIER_MODEL=openai:gpt-6-luna
AGENT_MODEL=openai:gpt-6.1-sol
POLL_INTERVAL_SECONDS=30

DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=your_secure_password
PYDANTIC_AI_NO_BANNER=1
```

---

### Step 3: Set Up Database & Knowledge Base

1. **Run the Database Migration**:
   Execute the SQL script located in [`supabase/migrations/20261104161442_create_tables.sql`](supabase/migrations/20261104161442_create_tables.sql) in your Supabase SQL Editor (or via PostgreSQL CLI). This creates the `events`, `tickets`, `messages`, and `knowledge_base` tables.

2. **Seed the Knowledge Base**:
   Populate the database with the markdown documentation in `knowledge_base/`:
   ```bash
   uv run python -m scripts.seed_knowledge_base
   ```

---

### Step 4: Configure Gmail API Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and create a project.
2. Enable the **Gmail API** under **APIs & Services**.
3. In the **OAuth Consent Screen**, configure the user type as **External** and add your Gmail address under **Test users**.
4. In **Credentials**, create an **OAuth 2.0 Client ID** with Application type set to **Desktop app**.
5. Download the credentials file, rename it to `credentials.json`, and place it in the project root directory.
6. Generate your OAuth refresh token:
   ```bash
   uv run python -m scripts.get_refresh_token
   ```
   *Follow the link to authenticate. If multiple Google accounts are active in your browser, open the link in an Incognito window.*
7. Copy the printed `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REFRESH_TOKEN` into your `.env` file.

---

### Step 5: Install Dashboard Dependencies

```bash
cd dashboard
npm install
cd ..
```

---

### Step 6: Run Locally

For full local development with live reloading, open 3 terminal windows:

#### Terminal 1: FastAPI Backend
```bash
uv run python -m uvicorn app.main:app --port 8000 --reload
```
- **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- **API Docs (Swagger)**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

#### Terminal 2: Gmail Poller Worker
```bash
# Continuous poller loop
uv run python -m app.poller

# Or run a single polling cycle (Container App Job mode)
uv run python -m app.poller_once
```

#### Terminal 3: React Admin Dashboard (Vite Dev Server)
```bash
cd dashboard
npm run dev
```
- **Dashboard UI**: [http://localhost:5173](http://localhost:5173)
- API requests to `/api` are automatically proxied to `http://127.0.0.1:8000`.
- Log in with the `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD` configured in your `.env`.

---

### Step 7: Production Dashboard Build

Compile the React dashboard into static assets:

```bash
cd dashboard
npm run build
cd ..
```

When `dashboard/dist` exists, the FastAPI backend automatically serves the full admin dashboard at the root URL:
- Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/) directly in your browser.

---

## 🐳 Docker & Local Container Testing

The project includes a production-grade multi-stage `Dockerfile`:
- **Stage 1 (Node 22)**: Builds the React/TypeScript dashboard with `npm ci` and `npm run build`.
- **Stage 2 (Python 3.13-slim)**: Installs production Python dependencies with `uv sync --no-dev`, copies the application code, and mounts the compiled frontend at `/app/dashboard/dist`.

### Build the Image

```bash
docker build -t ai-customer-support:latest .
```

### Run the API & Dashboard Container

```bash
docker run --rm -p 8000:8000 --env-file .env ai-customer-support:latest
```

Verify in your browser:
- Health probe: `curl http://127.0.0.1:8000/health` -> `{"status":"ok"}`
- Dashboard & API: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

### Run the One-Time Poller in Docker

```bash
docker run --rm --env-file .env ai-customer-support:latest python -m app.poller_once
```

### Run with Docker Compose

```bash
# Starts both the FastAPI server and continuous poller
docker compose up --build

# Run one-off poller job via compose
docker compose run --rm poller python -m app.poller_once
```

---

## ☁️ Azure Container Apps Deployment Guide

Deploy using **Azure Container Apps Consumption** for low cost and serverless scale-to-zero capability.

### Architecture Overview

```
                      ┌────────────────────────────────────────┐
                      │      Azure Container Apps Env          │
                      │                                        │
Internet ───────────► │  ┌──────────────────────────────────┐  │
(HTTPS Port 443)      │  │  API & Dashboard Container App   │  │ ──► Supabase PostgreSQL
                      │  │  uvicorn app.main:app:8000       │  │ ──► OpenAI API
                      │  │  (Autoscale 0 to 3 replicas)     │  │
                      │  └──────────────────────────────────┘  │
                      │                                        │
Cron Schedule ──────► │  ┌──────────────────────────────────┐  │
(e.g. Every 2 mins)   │  │  Scheduled Poller App Job        │  │ ──► Gmail API
                      │  │  python -m app.poller_once       │  │ ──► Supabase (Advisory Lock)
                      │  │  (Runs & exits after 1 cycle)    │  │ ──► OpenAI API
                      │  └──────────────────────────────────┘  │
                      └────────────────────────────────────────┘
```

1. **API Service (`Container App`)**: Hosts FastAPI and the React Admin Dashboard. Accessible via external HTTPS URL with automatic SSL. Scales to zero when idle.
2. **Scheduled Poller (`Container App Job`)**: Executes `python -m app.poller_once` on a cron schedule (e.g. every 2 minutes). Exits immediately when the polling cycle completes, billing only for execution seconds.
3. **Overlapping Execution Protection**: PostgreSQL advisory locks ensure the scheduled job and manual dashboard polling never process the same messages concurrently.

### Required Environment Variables

| Variable | Required In API | Required In Poller Job | Description |
| :--- | :---: | :---: | :--- |
| `DATABASE_URL` | Yes | Yes | Supabase PostgreSQL connection string (use IPv4 Pooler URL on Azure) |
| `OPENAI_API_KEY` | Yes | Yes | OpenAI API key (`sk-...`) |
| `GOOGLE_CLIENT_ID` | Optional | Yes | Google Cloud OAuth Client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | Yes | Google Cloud OAuth Client Secret |
| `GOOGLE_REFRESH_TOKEN` | Optional | Yes | OAuth Refresh Token for Gmail account |
| `DASHBOARD_USERNAME` | Yes | No | HTTP Basic Auth username (default: `admin`) |
| `DASHBOARD_PASSWORD` | Yes | No | HTTP Basic Auth password |
| `CLASSIFIER_MODEL` | Yes | Yes | OpenAI model for triage (`openai:gpt-6-luna`) |
| `AGENT_MODEL` | Yes | Yes | OpenAI model for answering (`openai:gpt-6.1-sol`) |
| `PYDANTIC_AI_NO_BANNER` | Yes | Yes | Suppresses banner in production logs (`1`) |

> [!IMPORTANT]
> **Supabase IPv4 Connection Pooler on Azure Container Apps**:
> Azure Container Apps environments do not support outbound IPv6 network traffic. Because Supabase direct connection hostnames (`db.<project-ref>.supabase.co:5432`) resolve to IPv6 by default, you must configure `DATABASE_URL` using the Supabase Connection Pooler in **session mode** (port `5432`):
> `postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`
> Session mode (`5432`) preserves support for PostgreSQL advisory locks (`pg_try_advisory_lock`), preventing overlapping poller executions.

---

### Step-by-Step Azure CLI Deployment

#### 1. Log in & Set Variables
```bash
az login

RESOURCE_GROUP="rg-ai-support"
LOCATION="eastus"
ACR_NAME="acraisupport$RANDOM"
ENV_NAME="env-ai-support"
IMAGE_NAME="ai-customer-support:latest"
```

#### 2. Create Resource Group & Azure Container Registry (ACR)
```bash
# Create Resource Group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Azure Container Registry
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true

# Retrieve ACR credentials
ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --query loginServer --output tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" --output tsv)
```

#### 3. Build & Push Container Image to ACR
Use cloud build (no local Docker daemon required):
```bash
az acr build \
  --registry $ACR_NAME \
  --image $IMAGE_NAME .
```

#### 4. Create Container Apps Environment
```bash
az containerapp env create \
  --name $ENV_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION
```

#### 5. Deploy the API & Dashboard Container App
```bash
az containerapp create \
  --name ai-support-api \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --image "$ACR_LOGIN_SERVER/$IMAGE_NAME" \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_NAME \
  --registry-password "$ACR_PASSWORD" \
  --target-port 8000 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 3 \
  --secrets \
    db-url="$DATABASE_URL" \
    openai-key="$OPENAI_API_KEY" \
    g-id="$GOOGLE_CLIENT_ID" \
    g-secret="$GOOGLE_CLIENT_SECRET" \
    g-token="$GOOGLE_REFRESH_TOKEN" \
    dash-pass="$DASHBOARD_PASSWORD" \
  --env-vars \
    DATABASE_URL=secretref:db-url \
    OPENAI_API_KEY=secretref:openai-key \
    GOOGLE_CLIENT_ID=secretref:g-id \
    GOOGLE_CLIENT_SECRET=secretref:g-secret \
    GOOGLE_REFRESH_TOKEN=secretref:g-token \
    DASHBOARD_USERNAME="admin" \
    DASHBOARD_PASSWORD=secretref:dash-pass \
    CLASSIFIER_MODEL="openai:gpt-6-luna" \
    AGENT_MODEL="openai:gpt-6.1-sol" \
    PYDANTIC_AI_NO_BANNER="1"
```

*Retrieve your app's public URL:*
```bash
az containerapp show \
  --name ai-support-api \
  --resource-group $RESOURCE_GROUP \
  --query "properties.configuration.ingress.fqdn" \
  --output tsv
```

#### 6. Deploy the Scheduled Poller Container App Job
```bash
az containerapp job create \
  --name ai-support-poller \
  --resource-group $RESOURCE_GROUP \
  --environment $ENV_NAME \
  --image "$ACR_LOGIN_SERVER/$IMAGE_NAME" \
  --registry-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_NAME \
  --registry-password "$ACR_PASSWORD" \
  --trigger-type Schedule \
  --cron-expression "*/2 * * * *" \
  --replica-timeout 180 \
  --replica-retry-limit 1 \
  --replica-completion-count 1 \
  --parallelism 1 \
  --command "/app/.venv/bin/python" "-m" "app.poller_once" \
  --args "" \
  --secrets \
    db-url="$DATABASE_URL" \
    openai-key="$OPENAI_API_KEY" \
    g-id="$GOOGLE_CLIENT_ID" \
    g-secret="$GOOGLE_CLIENT_SECRET" \
    g-token="$GOOGLE_REFRESH_TOKEN" \
  --env-vars \
    DATABASE_URL=secretref:db-url \
    OPENAI_API_KEY=secretref:openai-key \
    GOOGLE_CLIENT_ID=secretref:g-id \
    GOOGLE_CLIENT_SECRET=secretref:g-secret \
    GOOGLE_REFRESH_TOKEN=secretref:g-token \
    CLASSIFIER_MODEL="openai:gpt-6-luna" \
    AGENT_MODEL="openai:gpt-6.1-sol" \
    PYDANTIC_AI_NO_BANNER="1"
```

*Trigger a manual test execution of the poller job:*
```bash
az containerapp job start \
  --name ai-support-poller \
  --resource-group $RESOURCE_GROUP
```

---

## 🧪 Testing & Evals

### Run the Evaluation Benchmark
Verify that the AI pipeline passes all 18 test cases representing real-world customer inquiries:
```bash
uv run python -m evals.run_evals
```

### Windows WDAC / Smart App Control Note
On Windows systems with Application Control (WDAC / AppLocker / Smart App Control) enabled, always run Python commands via module syntax `uv run python -m <module>` (e.g. `uv run python -m uvicorn app.main:app`) rather than executing binary `.exe` stubs directly.

---

## 📂 Project Structure

```text
ai-customer-support/
├── app/
│   ├── ai/                   # AI agents, classifier, decision engine, & schemas
│   ├── config.py             # App configuration & environment loader
│   ├── db.py                 # PostgreSQL queries, advisory locks, & connection pooling
│   ├── gmail.py              # Gmail API client & thread parsing utilities
│   ├── guards.py             # Guardrails (filters out internal/automated emails)
│   ├── main.py               # FastAPI backend with Basic Auth, REST API, & static mount
│   ├── pipeline.py           # Main ticket processing pipeline
│   ├── poller.py             # Continuous polling loop worker
│   └── poller_once.py        # Single-cycle job worker for Azure Container Apps Jobs
├── dashboard/                # React Admin Dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/       # Sidebar, Header, and responsive Layout
│   │   │   └── ui/           # Badges, Buttons, Cards, Inputs, Tables
│   │   ├── lib/
│   │   │   ├── api.ts        # Typed API client with Basic Auth & 401 handling
│   │   │   └── types.ts      # TypeScript interfaces & date utilities
│   │   ├── pages/
│   │   │   ├── Events.tsx    # Ingestion event log with search, filter, & manual poll
│   │   │   ├── KnowledgeBase.tsx # Multi-section editor with unsaved-changes protection
│   │   │   ├── Login.tsx     # Modern authentication card
│   │   │   ├── Overview.tsx  # Metrics cards & recent activity feed
│   │   │   └── Tickets.tsx   # Two-column ticket viewer & conversation threads
│   │   ├── App.tsx           # Auth guard & view routing
│   │   ├── index.css         # Tailwind CSS styling
│   │   └── main.tsx          # React application root
│   ├── index.html            # Single page app template
│   ├── package.json          # Frontend dependencies
│   ├── tsconfig.json         # TypeScript compiler configuration
│   └── vite.config.ts        # Vite configuration with proxy to 127.0.0.1:8000
├── evals/
│   ├── golden_emails.py      # 18 test cases representing customer inquiries
│   └── run_evals.py          # Evaluation benchmark runner
├── knowledge_base/           # Source markdown articles for store policies & products
├── scripts/
│   ├── get_refresh_token.py  # Interactive OAuth refresh token generator
│   ├── gmail_check.py        # Gmail connectivity test script
│   └── seed_knowledge_base.py# Seeds markdown articles into PostgreSQL
├── supabase/
│   └── migrations/           # SQL table schemas & RLS policies
├── .dockerignore             # Docker build context exclusions (secrets, venv, git)
├── .env.example              # Environment variable template
├── credentials.json          # Google OAuth client secrets (gitignored)
├── Dockerfile                # Production multi-stage Docker build (Node 22 + Python 3.13)
├── docker-compose.yml        # Multi-container orchestration (API + Poller)
├── pyproject.toml            # Python dependencies & project metadata
└── README.md                 # Complete documentation
```

---

## 📄 License

This project is open-source and free to use under the [MIT License](https://opensource.org/licenses/MIT).
