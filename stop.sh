#!/bin/bash

# University Management System (PERN) — Stop Script
# Gracefully stops backend, frontend, and Docker infrastructure.
#
# Usage:
#   ./stop.sh           — stop backend + frontend + Docker containers (keep volumes)
#   ./stop.sh --clean   — stop everything + wipe all data volumes
#   ./stop.sh --logs    — print last 50 lines of backend log before stopping

# No set -e here; we want to continue even if individual steps fail
set -uo pipefail

# ── Flags ─────────────────────────────────────────────────────────────────────
WIPE_DATA=false
SHOW_LOGS=false

for arg in "$@"; do
  case $arg in
    --clean) WIPE_DATA=true ;;
    --logs)  SHOW_LOGS=true ;;
  esac
done

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/backend.pid"
LOG_FILE="$SCRIPT_DIR/backend.log"
FRONTEND_PID_FILE="$SCRIPT_DIR/frontend.pid"
FRONTEND_LOG_FILE="$SCRIPT_DIR/frontend.log"
API_PORT=8080
FRONTEND_PORT=3000

info()    { echo -e "  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }

echo ""
echo -e "${BOLD}Stopping UMS (PERN)...${NC}"
echo ""

# ── Optional: show recent logs ────────────────────────────────────────────────
if $SHOW_LOGS && [ -f "$LOG_FILE" ]; then
  echo -e "${YELLOW}── Recent backend log ──${NC}"
  tail -50 "$LOG_FILE" 2>/dev/null || true
  echo ""
fi

# ── Step 1: Stop backend process ─────────────────────────────────────────────
echo -e "${BOLD}Step 1: Stopping backend API server${NC}"

BACKEND_STOPPED=false

if [ -f "$PID_FILE" ]; then
  BACKEND_PID=$(cat "$PID_FILE")
  if kill -0 "$BACKEND_PID" 2>/dev/null; then
    info "Sending SIGTERM to PID $BACKEND_PID..."
    kill -TERM "$BACKEND_PID" 2>/dev/null || true

    # Wait up to 5 seconds for graceful shutdown
    GRACE=5
    while kill -0 "$BACKEND_PID" 2>/dev/null && [ $GRACE -gt 0 ]; do
      sleep 1
      GRACE=$((GRACE - 1))
    done

    # Force-kill if still alive
    if kill -0 "$BACKEND_PID" 2>/dev/null; then
      warn "Process did not exit; sending SIGKILL..."
      kill -KILL "$BACKEND_PID" 2>/dev/null || true
    fi

    BACKEND_STOPPED=true
  else
    warn "PID $BACKEND_PID is not running (stale PID file)"
  fi
  rm -f "$PID_FILE"
else
  info "No PID file found — checking port $API_PORT..."
fi

# Sweep any remaining processes bound to the port
if lsof -ti:"$API_PORT" 2>/dev/null | grep -q .; then
  warn "Killing remaining processes on port $API_PORT..."
  lsof -ti:"$API_PORT" | xargs kill -9 2>/dev/null || true
  BACKEND_STOPPED=true
fi

if $BACKEND_STOPPED; then
  success "Backend stopped"
else
  success "Backend was not running"
fi

# ── Step 1b: Stop frontend process ───────────────────────────────────────────
echo ""
echo -e "${BOLD}Step 1b: Stopping frontend${NC}"

FRONTEND_STOPPED=false

if [ -f "$FRONTEND_PID_FILE" ]; then
  FE_PID=$(cat "$FRONTEND_PID_FILE")
  if kill -0 "$FE_PID" 2>/dev/null; then
    info "Sending SIGTERM to frontend PID $FE_PID..."
    kill -TERM "$FE_PID" 2>/dev/null || true
    GRACE=5
    while kill -0 "$FE_PID" 2>/dev/null && [ $GRACE -gt 0 ]; do sleep 1; GRACE=$((GRACE - 1)); done
    if kill -0 "$FE_PID" 2>/dev/null; then kill -KILL "$FE_PID" 2>/dev/null || true; fi
    FRONTEND_STOPPED=true
  else
    warn "Frontend PID $FE_PID not running (stale PID file)"
  fi
  rm -f "$FRONTEND_PID_FILE"
fi

lsof -ti:"$FRONTEND_PORT" | xargs kill -9 2>/dev/null || true

if $FRONTEND_STOPPED; then
  success "Frontend stopped"
else
  success "Frontend was not running"
fi

# ── Step 2: Stop Docker services ─────────────────────────────────────────────
echo ""
echo -e "${BOLD}Step 2: Stopping Docker infrastructure${NC}"

DOCKER_COMPOSE_CMD=""
if docker compose version &>/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker compose"
elif docker-compose version &>/dev/null 2>&1; then
  DOCKER_COMPOSE_CMD="docker-compose"
else
  warn "Docker Compose not found; skipping infrastructure stop."
fi

if [ -n "$DOCKER_COMPOSE_CMD" ]; then
  if $WIPE_DATA; then
    warn "--clean: this will DELETE all database, storage data, and build artifacts."
    $DOCKER_COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" down -v 2>/dev/null || true
    success "Docker containers stopped and volumes wiped"
    rm -f "$LOG_FILE"
    rm -f "$FRONTEND_LOG_FILE"
    info "Log files removed"
  else
    $DOCKER_COMPOSE_CMD -f "$SCRIPT_DIR/docker-compose.yml" down 2>/dev/null || true
    success "Docker containers stopped (volumes preserved)"
  fi
fi

# ── Step 3: Clean build artefacts (--clean only) ─────────────────────────────
if $WIPE_DATA; then
  echo ""
  echo -e "${BOLD}Step 3: Removing build artefacts${NC}"

  # Frontend: Vite build output
  if [ -d "$SCRIPT_DIR/pern-frontend/dist" ]; then
    rm -rf "$SCRIPT_DIR/pern-frontend/dist"
    info "Removed pern-frontend/dist"
  fi

  # Backend: compiled JS output
  if [ -d "$SCRIPT_DIR/pern-backend/dist" ]; then
    rm -rf "$SCRIPT_DIR/pern-backend/dist"
    info "Removed pern-backend/dist"
  fi

  success "Build artefacts cleaned"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}${BOLD}  UMS (PERN) stopped${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if $WIPE_DATA; then
  echo "  All data and build artefacts wiped. Next start will re-compile and re-seed."
else
  echo "  Database and MinIO data preserved."
  echo "  Use './stop.sh --clean' to wipe all data and build artefacts."
fi
echo "  Restart:  ./deploy.sh"
echo "  Restart (keep data):  ./deploy.sh --no-seed --no-clean"
echo ""
