# ========================================================
# Stage 1: Build the React TypeScript Vite dashboard
# ========================================================
FROM node:22-alpine AS dashboard-builder

WORKDIR /dashboard

# Respect existing package manager and lockfile
COPY dashboard/package.json dashboard/package-lock.json ./
RUN npm ci

# Copy dashboard source and compile static assets
COPY dashboard/ ./
RUN npm run build

# ========================================================
# Stage 2: Production Python 3.13 backend runtime
# ========================================================
FROM python:3.13-slim

# Copy uv binaries from official Astral image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Environment configuration for containerized Python execution
ENV PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PYTHON_DOWNLOADS=never \
    PATH="/app/.venv/bin:$PATH"

WORKDIR /app

# Install production dependencies using uv and uv.lock (excluding dev group)
COPY pyproject.toml uv.lock ./
RUN uv sync --locked --no-dev --no-install-project

# Copy application source code and knowledge base
COPY app ./app
COPY knowledge_base ./knowledge_base

# Copy compiled dashboard static distribution from builder stage
COPY --from=dashboard-builder /dashboard/dist ./dashboard/dist

# Expose port 8000 for FastAPI
EXPOSE 8000

# Default command: Bind Uvicorn to 0.0.0.0 on port 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
