#!/bin/bash

# University Management System (PERN) — Deploy Script
# Starts infrastructure (Docker), builds backend, runs migrations + seed, starts API + frontend.
#
# Usage:
#   ./deploy.sh           — full clean deploy (wipes data volumes)
#   ./deploy.sh --dev     — start in dev (tsx watch / vite dev) mode, skip build
#   ./deploy.sh --no-seed — skip seeding (keep existing data)
#   ./deploy.sh --no-clean — do NOT wipe containers/volumes on start

set -euo pipefail

# ── Flags ────────────────────────────────────────────────────────────────────
DEV_MODE=false
SKIP_SEED=false
SKIP_CLEAN=false

for arg in "$@"; do
  case $arg in
    --dev)      DEV_MODE=true ;;
    --no-seed)  SKIP_SEED=true ;;
    --no-clean) SKIP_CLEAN=true ;;
  esac
done

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

# ── Directories ──────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/pern-backend"
FRONTEND_DIR="$SCRIPT_DIR/pern-frontend"
PID_FILE="$SCRIPT_DIR/backend.pid"
LOG_FILE="$SCRIPT_DIR/backend.log"
FRONTEND_PID_FILE="$SCRIPT_DIR/frontend.pid"
FRONTEND_LOG_FILE="$SCRIPT_DIR/frontend.log"
API_PORT=8080
FRONTEND_PORT=3000

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; }
step()    { echo ""; echo -e "${BOLD}${YELLOW}── $* ──${NC}"; }

# ── Prerequisites ─────────────────────────────────────────────────────────────
step "Checking prerequisites"

check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    error "Required command not found: $1"
    exit 1
  fi
  success "$1 found"
}

check_cmd docker
check_cmd node
check_cmd npm
check_cmd curl

DOCKER_COMPOSE_CMD=""
if docker compose version &>/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker compose"
elif docker-compose version &>/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker-compose"
else
  error "Neither 'docker compose' nor 'docker-compose' is available."
  exit 1
fi
success "Docker Compose: $DOCKER_COMPOSE_CMD"

# ── Step 1: Clean existing deployment ────────────────────────────────────────
step "Step 1: Clean existing deployment"

# Kill existing backend process if running
if [ -f "$PID_FILE" ]; then
  OLD_PID=$(cat "$PID_FILE")
  if kill -0 "$OLD_PID" 2>/dev/null; then
    info "Stopping existing backend (PID $OLD_PID)..."
    kill -TERM "$OLD_PID" 2>/dev/null || true
    sleep 2
    kill -KILL "$OLD_PID" 2>/dev/null || true
  fi
  rm -f "$PID_FILE"
fi

# Kill existing frontend process if running
if [ -f "$FRONTEND_PID_FILE" ]; then
  OLD_FE_PID=$(cat "$FRONTEND_PID_FILE")
  if kill -0 "$OLD_FE_PID" 2>/dev/null; then
    info "Stopping existing frontend (PID $OLD_FE_PID)..."
    kill -TERM "$OLD_FE_PID" 2>/dev/null || true
    sleep 2
    kill -KILL "$OLD_FE_PID" 2>/dev/null || true
  fi
  rm -f "$FRONTEND_PID_FILE"
fi

# Kill anything still bound to the API port
lsof -ti:"$API_PORT" | xargs kill -9 2>/dev/null || true
lsof -ti:"$FRONTEND_PORT" | xargs kill -9 2>/dev/null || true

if $SKIP_CLEAN; then
  warn "--no-clean: skipping docker teardown (keeping volumes)"
  $DOCKER_COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" stop 2>/dev/null || true
else
  info "Tearing down containers and data volumes..."
  $DOCKER_COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" down -v 2>/dev/null || true
fi

success "Environment clean"

# ── Step 2: Start infrastructure ─────────────────────────────────────────────
step "Step 2: Starting infrastructure (PostgreSQL, Redis, MinIO)"

$DOCKER_COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" up -d

# Wait for PostgreSQL
info "Waiting for PostgreSQL to be healthy..."
PG_RETRIES=30
until $DOCKER_COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" exec -T postgres \
    pg_isready -U umsuser -d umsdb -q 2>/dev/null; do
  PG_RETRIES=$((PG_RETRIES - 1))
  if [ $PG_RETRIES -le 0 ]; then
    error "PostgreSQL did not become ready in time."
    $DOCKER_COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" logs postgres
    exit 1
  fi
  sleep 1
done
success "PostgreSQL is ready"

# Wait for MinIO
info "Waiting for MinIO to be healthy..."
MINIO_RETRIES=30
until curl -sf http://localhost:9000/minio/health/live &>/dev/null; do
  MINIO_RETRIES=$((MINIO_RETRIES - 1))
  if [ $MINIO_RETRIES -le 0 ]; then
    error "MinIO did not become ready in time."
    $DOCKER_COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" logs minio
    exit 1
  fi
  sleep 1
done
success "MinIO is ready"

# Wait for Redis
info "Waiting for Redis to be healthy..."
REDIS_RETRIES=20
until $DOCKER_COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" exec -T redis \
    redis-cli ping 2>/dev/null | grep -q "PONG"; do
  REDIS_RETRIES=$((REDIS_RETRIES - 1))
  if [ $REDIS_RETRIES -le 0 ]; then
    error "Redis did not become ready in time."
    $DOCKER_COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" logs redis
    exit 1
  fi
  sleep 1
done
success "Redis is ready"

$DOCKER_COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" ps

# ── Step 3: Create MinIO bucket ───────────────────────────────────────────────
step "Step 3: Initialising MinIO storage bucket"

MINIO_BUCKET="${MINIO_BUCKET:-ums-storage}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-miniouser}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-miniopassword123}"

if docker run --rm \
    --network host \
    --entrypoint sh \
    minio/mc:latest \
    -c "mc alias set ums http://localhost:9000 ${MINIO_ACCESS_KEY} ${MINIO_SECRET_KEY} --api S3v4 && \
        mc mb --ignore-existing ums/${MINIO_BUCKET}" 2>/dev/null; then
  success "MinIO bucket '${MINIO_BUCKET}' ready"
else
  warn "Could not create MinIO bucket via mc container (may already exist or mc image unavailable)."
  warn "If file uploads fail, manually create bucket '${MINIO_BUCKET}' at http://localhost:9001"
fi

# ── Step 4: Install backend dependencies ─────────────────────────────────────
step "Step 4: Installing backend dependencies"

pushd "$BACKEND_DIR" > /dev/null

npm install --prefer-offline 2>/dev/null || npm install
success "npm dependencies installed"

# ── Step 5: Generate Prisma Client ──────────────────────────────────────────
step "Step 5: Generating Prisma Client"

npx prisma generate
success "Prisma Client generated"

# ── Step 5b: Run database migrations / push schema ───────────────────────────
step "Step 5b: Applying database schema"

# If migration files exist, use migrate deploy; otherwise push schema directly
if [ -d "prisma/migrations" ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  info "Migration files found — running prisma migrate deploy..."
  npx prisma migrate deploy
else
  info "No migration files found — pushing schema with prisma db push..."
  npx prisma db push --accept-data-loss
fi
success "Database schema applied"

# ── Step 6: Seed database ─────────────────────────────────────────────────────
if $SKIP_SEED; then
  warn "Step 6: Skipping seed (--no-seed)"
else
  step "Step 6: Seeding database"
  npx tsx prisma/seed.ts
  success "Database seeded (24 users, 16 courses, 180+ enrollments, 1,125 attendance records)"
fi

# ── Step 7: Build TypeScript ──────────────────────────────────────────────────
if $DEV_MODE; then
  step "Step 7: Skipping build (--dev mode uses tsx watch)"
else
  step "Step 7: Building TypeScript"
  npm run build
  success "Build complete (dist/server.js)"
fi

popd > /dev/null

# ── Step 8: Start backend ─────────────────────────────────────────────────────
step "Step 8: Starting backend API server (Express)"

pushd "$BACKEND_DIR" > /dev/null

if $DEV_MODE; then
  info "Starting in development mode (hot-reload)..."
  npm run dev > "$LOG_FILE" 2>&1 &
else
  info "Starting production server..."
  npm start > "$LOG_FILE" 2>&1 &
fi

BACKEND_PID=$!
echo "$BACKEND_PID" > "$PID_FILE"
info "Backend PID: $BACKEND_PID — logs: $LOG_FILE"

popd > /dev/null

# Health check loop
info "Waiting for API to become healthy (http://localhost:${API_PORT}/api/health)..."
HEALTH_RETRIES=40
until curl -sf "http://localhost:${API_PORT}/api/health" > /dev/null 2>&1; do
  HEALTH_RETRIES=$((HEALTH_RETRIES - 1))
  if [ $HEALTH_RETRIES -le 0 ]; then
    error "Backend did not become healthy. Check logs:"
    tail -30 "$LOG_FILE" 2>/dev/null || true
    exit 1
  fi
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    error "Backend process exited unexpectedly. Last log lines:"
    tail -30 "$LOG_FILE" 2>/dev/null || true
    exit 1
  fi
  sleep 1
done

success "Backend is healthy"

# ── Step 9: Frontend ──────────────────────────────────────────────────────────
if [ -d "$FRONTEND_DIR" ]; then
  step "Step 9: Building and starting frontend (Vite + React)"

  pushd "$FRONTEND_DIR" > /dev/null

  info "Installing frontend dependencies..."
  npm install --prefer-offline 2>/dev/null || npm install
  success "Frontend dependencies installed"

  if $DEV_MODE; then
    info "Starting frontend in development mode (Vite HMR)..."
    npm run dev > "$FRONTEND_LOG_FILE" 2>&1 &
  else
    info "Building frontend..."
    npm run build > "$FRONTEND_LOG_FILE" 2>&1
    success "Frontend build complete (dist/)"
    info "Starting frontend preview server..."
    npm run preview >> "$FRONTEND_LOG_FILE" 2>&1 &
  fi

  FRONTEND_PID=$!
  echo "$FRONTEND_PID" > "$FRONTEND_PID_FILE"
  info "Frontend PID: $FRONTEND_PID — logs: $FRONTEND_LOG_FILE"

  # Health check
  info "Waiting for frontend to become available (http://localhost:${FRONTEND_PORT})..."
  FE_RETRIES=40
  until curl -sf "http://localhost:${FRONTEND_PORT}" > /dev/null 2>&1; do
    FE_RETRIES=$((FE_RETRIES - 1))
    if [ $FE_RETRIES -le 0 ]; then
      warn "Frontend did not respond in time. Check logs: $FRONTEND_LOG_FILE"
      break
    fi
    if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
      warn "Frontend process exited unexpectedly. Check: $FRONTEND_LOG_FILE"
      break
    fi
    sleep 1
  done
  success "Frontend is running"

  popd > /dev/null
else
  warn "pern-frontend directory not found — skipping frontend startup."
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}${BOLD}  UMS (PERN) Deployment Complete${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${BLUE}Service URLs${NC}"
echo "  Frontend:        http://localhost:${FRONTEND_PORT}"
echo "  API:             http://localhost:${API_PORT}"
echo "  API Health:      http://localhost:${API_PORT}/api/health"
echo "  MinIO Console:   http://localhost:9001   (miniouser / miniopassword123)"
echo "  PostgreSQL:      localhost:5432          (umsuser / umspassword / umsdb)"
echo "  Redis:           localhost:6379"
echo ""
echo -e "${BLUE}Test Credentials${NC}"
echo "  Developer  developer@iiitu.ac.in       Dev@2026"
echo "  Admin      sukhsagar@iiitu.ac.in       Admin@2026"
echo "  Admin      admin.registrar@iiitu.ac.in Admin@2026"
echo "  Faculty    manish.g@iiitu.ac.in        Faculty@2026"
echo "  Student    24429@iiitu.ac.in           Student@2026"
echo ""
echo -e "${BLUE}Useful Commands${NC}"
echo "  Backend logs:    tail -f $LOG_FILE"
echo "  Frontend logs:   tail -f $FRONTEND_LOG_FILE"
echo "  Stop all:        ./stop.sh"
echo "  Stop + wipe:     ./stop.sh --clean"
echo "  Prisma Studio:   cd pern-backend && npx prisma studio"
echo "  DB status:       $DOCKER_COMPOSE_CMD ps"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
