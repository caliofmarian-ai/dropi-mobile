#!/bin/bash
# ============================================================
# DROPi — Automated Deployment Script
# ============================================================
# Deploys DROPi backend to a production server (VPS/dedicated).
# Handles: git pull, dependency install, build, DB migration,
# PM2 restart, health check, and rollback on failure.
#
# Usage:
#   ./scripts/deploy.sh              # Standard deploy
#   ./scripts/deploy.sh --rollback   # Rollback to previous version
#   ./scripts/deploy.sh --status     # Check service status
#
# Prerequisites on server:
#   - Node.js 20+, pnpm, PM2, MySQL 8+, Nginx
#   - Git repository cloned to /opt/dropi (configurable below)
#   - .env file configured at /opt/dropi/.env
#
# ============================================================

set -euo pipefail

# ============================================================
# CONFIGURATION (Edit these for your server)
# ============================================================

APP_NAME="dropi-api"
APP_DIR="/opt/dropi"
BACKUP_DIR="/opt/dropi-backups"
LOG_FILE="/var/log/dropi-deploy.log"
HEALTH_CHECK_URL="http://127.0.0.1:3000/api/trpc/system.healthCheck"
HEALTH_CHECK_TIMEOUT=30
PM2_INSTANCES=1
NODE_ENV="production"
GIT_BRANCH="main"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================
# HELPER FUNCTIONS
# ============================================================

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo -e "${BLUE}${msg}${NC}"
  echo "$msg" >> "$LOG_FILE"
}

success() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1"
  echo -e "${GREEN}${msg}${NC}"
  echo "$msg" >> "$LOG_FILE"
}

warn() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1"
  echo -e "${YELLOW}${msg}${NC}"
  echo "$msg" >> "$LOG_FILE"
}

error() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1"
  echo -e "${RED}${msg}${NC}"
  echo "$msg" >> "$LOG_FILE"
}

# ============================================================
# PRE-FLIGHT CHECKS
# ============================================================

preflight_check() {
  log "Running pre-flight checks..."

  # Check if running as appropriate user
  if [ "$(id -u)" -eq 0 ]; then
    warn "Running as root. Consider using a dedicated deploy user."
  fi

  # Check required tools
  for cmd in node pnpm pm2 git mysql; do
    if ! command -v "$cmd" &> /dev/null; then
      error "Required command not found: $cmd"
      exit 1
    fi
  done

  # Check Node.js version (need 20+)
  NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -lt 20 ]; then
    error "Node.js 20+ required, found v$(node -v)"
    exit 1
  fi

  # Check app directory exists
  if [ ! -d "$APP_DIR" ]; then
    error "App directory not found: $APP_DIR"
    error "Clone the repository first: git clone <repo> $APP_DIR"
    exit 1
  fi

  # Check .env exists
  if [ ! -f "$APP_DIR/.env" ]; then
    error ".env file not found at $APP_DIR/.env"
    exit 1
  fi

  # Create backup directory
  mkdir -p "$BACKUP_DIR"
  mkdir -p "$(dirname "$LOG_FILE")"

  success "Pre-flight checks passed"
}

# ============================================================
# BACKUP CURRENT VERSION
# ============================================================

backup_current() {
  log "Backing up current version..."

  cd "$APP_DIR"
  local CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
  local BACKUP_NAME="backup_${CURRENT_COMMIT}_$(date '+%Y%m%d_%H%M%S')"

  # Save current commit hash for rollback
  echo "$CURRENT_COMMIT" > "$BACKUP_DIR/last_good_commit"

  # Backup dist folder if exists
  if [ -d "dist" ]; then
    cp -r dist "$BACKUP_DIR/${BACKUP_NAME}_dist"
  fi

  # Backup node_modules lockfile
  if [ -f "pnpm-lock.yaml" ]; then
    cp pnpm-lock.yaml "$BACKUP_DIR/${BACKUP_NAME}_pnpm-lock.yaml"
  fi

  # Keep only last 5 backups
  cd "$BACKUP_DIR"
  ls -dt backup_* 2>/dev/null | tail -n +11 | xargs rm -rf 2>/dev/null || true

  success "Backup created: $BACKUP_NAME (commit: $CURRENT_COMMIT)"
}

# ============================================================
# DEPLOY
# ============================================================

deploy() {
  log "Starting DROPi deployment..."
  log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

  preflight_check
  backup_current

  cd "$APP_DIR"

  # Step 1: Pull latest code
  log "Step 1/6: Pulling latest code from $GIT_BRANCH..."
  git fetch origin
  git checkout "$GIT_BRANCH"
  git pull origin "$GIT_BRANCH"
  local NEW_COMMIT=$(git rev-parse --short HEAD)
  success "Code updated to commit: $NEW_COMMIT"

  # Step 2: Install dependencies
  log "Step 2/6: Installing dependencies..."
  pnpm install --frozen-lockfile --prod=false
  success "Dependencies installed"

  # Step 3: Build
  log "Step 3/6: Building production bundle..."
  pnpm build
  if [ ! -f "dist/index.js" ]; then
    error "Build failed: dist/index.js not found"
    rollback
    exit 1
  fi
  success "Build complete: dist/index.js"

  # Step 4: Database migrations
  log "Step 4/6: Running database migrations..."
  pnpm db:push 2>&1 | tee -a "$LOG_FILE"
  success "Database migrations applied"

  # Step 5: Restart application
  log "Step 5/6: Restarting application..."
  if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
    pm2 restart "$APP_NAME" --update-env
  else
    pm2 start dist/index.js \
      --name "$APP_NAME" \
      --instances "$PM2_INSTANCES" \
      --env production \
      --max-memory-restart 512M \
      --exp-backoff-restart-delay=100
  fi
  pm2 save
  success "Application restarted"

  # Step 6: Health check
  log "Step 6/6: Running health check..."
  sleep 3
  if health_check; then
    success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    success "DROPi deployed successfully! (commit: $NEW_COMMIT)"
    success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  else
    error "Health check failed! Rolling back..."
    rollback
    exit 1
  fi
}

# ============================================================
# HEALTH CHECK
# ============================================================

health_check() {
  local attempts=0
  local max_attempts=$((HEALTH_CHECK_TIMEOUT / 3))

  while [ $attempts -lt $max_attempts ]; do
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" 2>/dev/null || echo "000")
    if [ "$response" = "200" ]; then
      success "Health check passed (HTTP 200)"
      return 0
    fi
    attempts=$((attempts + 1))
    sleep 3
  done

  error "Health check failed after ${HEALTH_CHECK_TIMEOUT}s (last HTTP: $response)"
  return 1
}

# ============================================================
# ROLLBACK
# ============================================================

rollback() {
  log "Rolling back to previous version..."

  cd "$APP_DIR"

  # Get last known good commit
  if [ -f "$BACKUP_DIR/last_good_commit" ]; then
    local GOOD_COMMIT=$(cat "$BACKUP_DIR/last_good_commit")
    log "Rolling back to commit: $GOOD_COMMIT"
    git checkout "$GOOD_COMMIT"
    pnpm install --frozen-lockfile --prod=false
    pnpm build
    pm2 restart "$APP_NAME" --update-env
    sleep 3

    if health_check; then
      success "Rollback successful! Running on commit: $GOOD_COMMIT"
    else
      error "CRITICAL: Rollback also failed! Manual intervention required."
      error "Check logs: $LOG_FILE"
      error "Check PM2: pm2 logs $APP_NAME"
      exit 2
    fi
  else
    error "No backup commit found. Manual intervention required."
    exit 2
  fi
}

# ============================================================
# STATUS
# ============================================================

status() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  DROPi Service Status${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # PM2 status
  if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
    echo -e "${GREEN}  PM2 Process: RUNNING${NC}"
    pm2 show "$APP_NAME" | grep -E "status|uptime|memory|restarts" | sed 's/^/  /'
  else
    echo -e "${RED}  PM2 Process: NOT RUNNING${NC}"
  fi
  echo ""

  # Health check
  local response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" 2>/dev/null || echo "000")
  if [ "$response" = "200" ]; then
    echo -e "${GREEN}  API Health: HEALTHY (HTTP 200)${NC}"
  else
    echo -e "${RED}  API Health: UNHEALTHY (HTTP $response)${NC}"
  fi
  echo ""

  # Git info
  cd "$APP_DIR" 2>/dev/null && {
    echo -e "  Git Branch: $(git branch --show-current)"
    echo -e "  Git Commit: $(git rev-parse --short HEAD)"
    echo -e "  Last Deploy: $(git log -1 --format='%ci')"
  }
  echo ""

  # Disk usage
  echo -e "  Disk Usage: $(du -sh "$APP_DIR" 2>/dev/null | cut -f1)"
  echo -e "  Backups: $(ls "$BACKUP_DIR" 2>/dev/null | wc -l) stored"
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# ============================================================
# INITIAL SETUP (First time only)
# ============================================================

setup() {
  log "Running initial DROPi server setup..."
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  DROPi Initial Server Setup${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""

  # Create app directory
  sudo mkdir -p "$APP_DIR"
  sudo chown "$(whoami):$(whoami)" "$APP_DIR"

  # Create required directories
  mkdir -p "$BACKUP_DIR"
  mkdir -p "$(dirname "$LOG_FILE")"
  sudo touch "$LOG_FILE"
  sudo chown "$(whoami):$(whoami)" "$LOG_FILE"

  echo ""
  echo "Next steps:"
  echo "  1. Clone repository:  git clone <repo_url> $APP_DIR"
  echo "  2. Configure env:     cp $APP_DIR/.env.example $APP_DIR/.env && nano $APP_DIR/.env"
  echo "  3. Install deps:      cd $APP_DIR && pnpm install"
  echo "  4. Run migrations:    cd $APP_DIR && pnpm db:push"
  echo "  5. First deploy:      ./scripts/deploy.sh"
  echo ""
  echo "Required .env variables:"
  echo "  DATABASE_URL=mysql://user:pass@localhost:3306/dropi"
  echo "  NODE_ENV=production"
  echo "  PORT=3000"
  echo "  JWT_SECRET=<random-64-char-string>"
  echo "  FCM_PROJECT_ID=<firebase-project-id>"
  echo "  FCM_SERVICE_ACCOUNT_JSON=<path-to-service-account.json>"
  echo "  SMTP_HOST=<smtp-server>"
  echo "  SMTP_USER=<email>"
  echo "  SMTP_PASS=<password>"
  echo ""

  success "Setup directories created. Follow the steps above to complete."
}

# ============================================================
# MAIN
# ============================================================

case "${1:-deploy}" in
  --rollback|-r)
    rollback
    ;;
  --status|-s)
    status
    ;;
  --setup)
    setup
    ;;
  --help|-h)
    echo ""
    echo "DROPi Deployment Script"
    echo ""
    echo "Usage:"
    echo "  ./scripts/deploy.sh              Deploy latest version"
    echo "  ./scripts/deploy.sh --rollback   Rollback to previous version"
    echo "  ./scripts/deploy.sh --status     Check service status"
    echo "  ./scripts/deploy.sh --setup      Initial server setup"
    echo "  ./scripts/deploy.sh --help       Show this help"
    echo ""
    ;;
  *)
    deploy
    ;;
esac
