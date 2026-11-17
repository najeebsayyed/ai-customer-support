# 🤖 AI Customer Support Automation

An autonomous, multi-agent AI customer support system built with **FastAPI**, **Pydantic AI**, **PostgreSQL (Supabase)**, and the **Gmail API**.

It monitors an incoming support inbox, triages messages with guardrails, references a grounded product knowledge base, applies deterministic business rules, saves conversation history, and sends automated replies or escalates to human agents.

---

## ✨ Features

- **Multi-Stage AI Pipeline**:
  - **Triage & Classification**: Fast model categorizes inquiries and catches escalation triggers (anger, refund demands, legal threats, prompt injections).
  - **Grounded Drafting**: Reasoning model queries the knowledge base for factual product answers and draft replies.
  - **Deterministic Rule Enforcement**: Python logic enforces business constraints (e.g. asking for missing order numbers before sending replacements).
- **Automated Gmail Poller**: Background worker that continuously polls for unread emails, updates message labels (`ai-processed`, `needs-human`), and sends email replies.
- **PostgreSQL Database Integration**: Tracks events, customer tickets, message threads, and editable knowledge base entries.
- **Evaluation Suite**: Built-in test harness with 18 golden test cases powered by `pydantic-evals`.
- **FastAPI Backend**: Lightweight service for health checks and dashboard APIs.

---

## 🚀 Quick Start Guide

### Prerequisites

- **Python**: Version `>= 3.14`
- **[uv](https://docs.astral.sh/uv/)**: Fast Python package manager (`pip install uv` or via [official installer](https://github.com/astral-sh/uv))
- **PostgreSQL**: A database instance (e.g., free tier on [Supabase](https://supabase.com))
- **OpenAI API Key**: For model inference
- **Google Cloud Account**: With Gmail API enabled

---

### Step 1: Clone & Install Dependencies

```bash
git clone https://github.com/<your-username>/ai-customer-support.git
cd ai-customer-support

# Install dependencies using uv
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

### Step 5: Test & Run

#### Run the Evals Suite
Verify that the AI pipeline passes all 18 benchmark cases:
```bash
uv run python -m evals.run_evals
```

#### Start the Email Poller
Run the background worker to start processing incoming support emails:
```bash
uv run python -m app.poller
```

#### Start the Web API Server
In a separate terminal, launch the FastAPI server:
```bash
uv run python -m fastapi dev app/main.py
# or
uv run python -m uvicorn app.main:app --reload
```
- **Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
- **API Docs (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📂 Project Structure

```text
ai-customer-support/
├── app/
│   ├── ai/               # AI agents, classifier, decision engine, & schemas
│   ├── config.py         # App configuration & environment loader
│   ├── db.py             # Database queries & connection management
│   ├── gmail.py          # Gmail client & thread parsing utilities
│   ├── guards.py         # Filtering guards (skip internal/automated emails)
│   ├── main.py           # FastAPI application
│   ├── pipeline.py       # Main ticket processing pipeline
│   └── poller.py         # Continuous polling loop worker
├── evals/
│   ├── golden_emails.py  # 18 test cases representing real-world inquiries
│   └── run_evals.py      # Automated evaluation test runner
├── knowledge_base/       # Source markdown files for store policies & products
├── scripts/
│   ├── get_refresh_token.py  # Interactive OAuth refresh token generator
│   ├── gmail_check.py        # Gmail connectivity test script
│   └── seed_knowledge_base.py# Seeds markdown articles into PostgreSQL
├── supabase/
│   └── migrations/       # SQL table schemas & RLS policies
├── .env.example          # Environment variable template
├── credentials.json      # Google OAuth client secrets (gitignored)
└── pyproject.toml        # Project dependencies & metadata
```

---

## 📄 License

This project is open-source and free to use under the [MIT License](https://opensource.org/licenses/MIT).
