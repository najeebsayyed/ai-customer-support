# 🤖 AI Customer Support Automation & Admin Dashboard

An autonomous, multi-agent AI customer support platform built with **FastAPI**, **Pydantic AI**, **PostgreSQL (Supabase)**, the **Gmail API**, and a modern **React / TypeScript / Vite / Tailwind CSS** admin dashboard.

The system continuously monitors an incoming support inbox, triages messages with guardrails, references a grounded product knowledge base, applies deterministic business rules, saves conversation history, sends automated replies or escalates to human agents, and provides a full-featured admin dashboard for monitoring, ticket review, and knowledge base editing.

---

## ✨ Features

- **Multi-Stage AI Pipeline**:
  - **Triage & Classification**: Fast model (`openai:gpt-6-luna`) categorizes inquiries and catches escalation triggers (anger, refund demands, legal threats, prompt injections).
  - **Grounded Drafting**: Reasoning model (`openai:gpt-6.1-sol`) queries the PostgreSQL knowledge base for factual product answers and draft replies.
  - **Deterministic Rule Enforcement**: Python logic enforces business constraints (e.g. asking for missing order numbers before sending replacements).
- **Automated Gmail Poller**: Background worker that continuously polls for unread emails, updates message labels (`ai-processed`, `needs-human`), and sends email replies.
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
uv run python -m app.poller
```
*Monitors the Gmail inbox continuously every `POLL_INTERVAL_SECONDS` and triggers the AI pipeline.*

#### Terminal 3: React Admin Dashboard (Vite Dev Server)
```bash
cd dashboard
npm run dev
```
- **Dashboard UI**: [http://localhost:5173](http://localhost:5173)
- API requests to `/api` are automatically proxied to `http://127.0.0.1:8000`.
- Log in with the `DASHBOARD_USERNAME` and `DASHBOARD_PASSWORD` configured in your `.env`.

---

### Step 7: Production Build

You can also compile the React dashboard into static assets:

```bash
cd dashboard
npm run build
cd ..
```

When `dashboard/dist` exists, the FastAPI backend automatically serves the full admin dashboard at the root URL:
- Open [http://127.0.0.1:8000/](http://127.0.0.1:8000/) directly in your browser.

---

## 🧪 Testing & Evals

### Run the Evaluation Benchmark
Verify that the AI pipeline passes all 18 test cases representing real-world customer inquiries:
```bash
uv run python -m evals.run_evals
```

### Windows WDAC Note
On Windows systems with Application Control (WDAC / AppLocker) enabled, always run Python commands via module syntax `uv run python -m <module>` (e.g. `uv run python -m uvicorn app.main:app`) rather than executing binary `.exe` stubs directly.

---

## 📂 Project Structure

```text
ai-customer-support/
├── app/
│   ├── ai/                   # AI agents, classifier, decision engine, & schemas
│   ├── config.py             # App configuration & environment loader
│   ├── db.py                 # PostgreSQL queries, aggregations, & connection management
│   ├── gmail.py              # Gmail API client & thread parsing utilities
│   ├── guards.py             # Guardrails (filters out internal/automated emails)
│   ├── main.py               # FastAPI backend with Basic Auth, REST API, & static mount
│   ├── pipeline.py           # Main ticket processing pipeline
│   └── poller.py             # Continuous polling loop worker
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
├── .env.example              # Environment variable template
├── credentials.json          # Google OAuth client secrets (gitignored)
├── pyproject.toml            # Python dependencies & project metadata
└── README.md                 # Complete documentation
```

---

## 📄 License

This project is open-source and free to use under the [MIT License](https://opensource.org/licenses/MIT).
