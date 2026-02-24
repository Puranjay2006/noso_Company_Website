#!/bin/bash

# =============================================================================
# NoSo Company Production Deployment Script (Zero-Downtime)
# =============================================================================

# Load environment (for non-interactive shells like CI/CD)
[ -f ~/.bashrc ] && source ~/.bashrc

# Smooth deployment:
# 1. Pull code & install backend deps while services are STILL RUNNING
# 2. Build frontend (Caddy serves static files directly from dist/)
# 3. Update Caddy config and reload
# 4. Quick restart backend (few seconds downtime)
# 5. Wait for backend to be healthy

# === Variables ===
PROJECT_DIR="$(pwd)"
BRANCH="main"

# Backend Configuration
BACKEND_NAME="nosocompany-backend"
BACKEND_DIR="$PROJECT_DIR/backend"
BACKEND_MODULE="app:app"
BACKEND_PORT=8080
BACKEND_WORKERS=2

# Frontend Configuration
FRONTEND_DIR="$PROJECT_DIR/frontend"
FRONTEND_DIST="$FRONTEND_DIR/dist"

# Server Configuration
CADDY_SITES_DIR="/etc/caddy/sites-enabled"
CADDY_CONFIG_NAME="nosocompany.com.caddy"
WWW_DIR="/var/www/nosocompany"

# Production Domain
PROD_DOMAIN="nosocompany.com"
PROD_URL="https://$PROD_DOMAIN"

# Prevent Python from creating __pycache__ directories
export PYTHONDONTWRITEBYTECODE=1

# =============================================================================
# Pull Latest Code from GitHub
# =============================================================================
echo "============================================="
echo "  Forcefully pulling latest code from GitHub..."
echo "============================================="
cd "$PROJECT_DIR" || exit

# IMPORTANT: Preserve SECRET_KEY to avoid invalidating user sessions
echo "  Preserving SECRET_KEY before update..."
SAVED_SECRET_KEY=""
if [ -f "$BACKEND_DIR/.env" ]; then
    SAVED_SECRET_KEY=$(grep "^SECRET_KEY=" "$BACKEND_DIR/.env" | cut -d'=' -f2)
    echo "   -> SECRET_KEY preserved (starts with: ${SAVED_SECRET_KEY:0:8}...)"
fi

# Clean any local changes and untracked files (preserve uploads, env files)
echo "  Cleaning local changes..."
git fetch origin
git reset --hard origin/$BRANCH
git clean -fd -e static/uploads -e backend/.env -e frontend/.env -e frontend/node_modules -e backend/uploads

# Restore SECRET_KEY if it was lost during git operations
if [ -n "$SAVED_SECRET_KEY" ]; then
    if [ -f "$BACKEND_DIR/.env" ]; then
        CURRENT_SECRET_KEY=$(grep "^SECRET_KEY=" "$BACKEND_DIR/.env" 2>/dev/null | cut -d'=' -f2)
        if [ "$CURRENT_SECRET_KEY" != "$SAVED_SECRET_KEY" ]; then
            echo "  Restoring preserved SECRET_KEY..."
            if grep -q "^SECRET_KEY=" "$BACKEND_DIR/.env" 2>/dev/null; then
                sed -i.bak "s|^SECRET_KEY=.*|SECRET_KEY=$SAVED_SECRET_KEY|" "$BACKEND_DIR/.env"
            else
                echo "SECRET_KEY=$SAVED_SECRET_KEY" >> "$BACKEND_DIR/.env"
            fi
            rm -f "$BACKEND_DIR/.env.bak"
            echo "   -> SECRET_KEY restored successfully"
        fi
    fi
fi

echo "[OK] Code forcefully updated from GitHub ($BRANCH branch)"

# =============================================================================
# Set Environment to Production
# =============================================================================
echo ""
echo "============================================="
echo "  Setting environment to production..."
echo "============================================="

# === Backend Environment ===
echo "  Updating backend .env to production..."
cd "$BACKEND_DIR" || exit

# Set ENV to production
if grep -q "^ENV=" .env 2>/dev/null; then
    sed -i.bak 's/^ENV=.*/ENV=production/' .env
else
    echo "ENV=production" >> .env
fi

# Set DEBUG to false
if grep -q "^DEBUG=" .env 2>/dev/null; then
    sed -i.bak 's/^DEBUG=.*/DEBUG=false/' .env
else
    echo "DEBUG=false" >> .env
fi

# Set environment variables if needed
if ! grep -q "^SECRET_KEY=" .env 2>/dev/null; then
    echo "SECRET_KEY=$(openssl rand -hex 32)" >> .env
fi

# Update backend production URLs
sed -i.bak "s|^FRONTEND_URL=.*|FRONTEND_URL=$PROD_URL|" .env 2>/dev/null || echo "FRONTEND_URL=$PROD_URL" >> .env
sed -i.bak "s|^APP_BASE_URL=.*|APP_BASE_URL=$PROD_URL/|" .env 2>/dev/null || echo "APP_BASE_URL=$PROD_URL/" >> .env
sed -i.bak "s|^PRODUCTION_DOMAIN=.*|PRODUCTION_DOMAIN=$PROD_DOMAIN|" .env 2>/dev/null || echo "PRODUCTION_DOMAIN=$PROD_DOMAIN" >> .env

# Update CORS_ORIGINS for production
CORS_ORIGINS='["http://localhost:3000", "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "https://nosocompany.com", "https://www.nosocompany.com", "http://nosocompany.com", "http://www.nosocompany.com"]'
if grep -q "^CORS_ORIGINS=" .env 2>/dev/null; then
    sed -i.bak "s|^CORS_ORIGINS=.*|CORS_ORIGINS=$CORS_ORIGINS|" .env
else
    echo "CORS_ORIGINS=$CORS_ORIGINS" >> .env
fi

# Clean up backup files
rm -f .env.bak

echo "[OK] Backend environment set to production"

# === Frontend Environment ===
echo "  Updating frontend .env to production..."
cd "$FRONTEND_DIR" || exit

# Set VITE_ENV to production
if grep -q "^VITE_ENV=" .env 2>/dev/null; then
    sed -i.bak 's/^VITE_ENV=.*/VITE_ENV=production/' .env
else
    echo "VITE_ENV=production" >> .env
fi

# Update frontend production URLs
sed -i.bak "s|^VITE_API_URL=.*|VITE_API_URL=$PROD_URL/api|" .env 2>/dev/null
sed -i.bak "s|^VITE_FRONTEND_URL=.*|VITE_FRONTEND_URL=$PROD_URL|" .env 2>/dev/null

# Clean up backup files
rm -f .env.bak

echo "[OK] Frontend environment set to production"

# =============================================================================
# Install Backend Dependencies
# =============================================================================
echo ""
echo "============================================="
echo "  Installing backend dependencies..."
echo "============================================="

cd "$BACKEND_DIR" || exit

# Install uv if not present
if ! command -v uv &> /dev/null; then
    echo "  Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
fi

uv sync --frozen || { echo "[ERROR] Backend dependency installation failed"; exit 1; }
echo "[OK] Backend dependencies installed"

# =============================================================================
# Build Frontend
# =============================================================================
echo ""
echo "============================================="
echo "  Building frontend for production..."
echo "============================================="
cd "$FRONTEND_DIR" || exit

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "  Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# Install npm if not present (usually comes with node)
if ! command -v npm &> /dev/null; then
    echo "  Installing npm..."
    sudo apt-get install -y npm
fi

echo "  Node version: $(node -v)"
echo "  npm version: $(npm -v)"

# Install npm dependencies
echo "  Installing npm dependencies..."
npm install || { echo "[ERROR] npm install failed"; exit 1; }

# Remove old build artifacts
echo "  Removing old build artifacts..."
rm -rf "$FRONTEND_DIST"

# Build frontend
echo "  Running npm build..."
npm run build || { echo "[ERROR] Frontend build failed"; exit 1; }

if [ ! -d "$FRONTEND_DIST" ]; then
    echo "[ERROR] Build directory not found at $FRONTEND_DIST"
    exit 1
fi

echo "[OK] Frontend built successfully"

# =============================================================================
# Deploy Frontend to WWW Directory
# =============================================================================
echo ""
echo "============================================="
echo "  Deploying frontend to $WWW_DIR..."
echo "============================================="

# Create www directory if it doesn't exist
sudo mkdir -p "$WWW_DIR"

# Remove old dist and copy new one
sudo rm -rf "$WWW_DIR/dist"
sudo cp -r "$FRONTEND_DIST" "$WWW_DIR/"

# Set proper permissions for Caddy
sudo chown -R www-data:www-data "$WWW_DIR"
sudo chmod -R 755 "$WWW_DIR"

echo "[OK] Frontend deployed to $WWW_DIR/dist"

# =============================================================================
# Update Caddy Configuration
# =============================================================================
echo ""
echo "============================================="
echo "  Updating Caddy configuration..."
echo "============================================="

CADDY_CONFIG_PATH="$CADDY_SITES_DIR/$CADDY_CONFIG_NAME"

# Backup current Caddy config
if [ -f "$CADDY_CONFIG_PATH" ]; then
    sudo cp "$CADDY_CONFIG_PATH" "${CADDY_CONFIG_PATH}.backup"
    echo "  Backed up current $CADDY_CONFIG_NAME"
fi

# Copy new Caddy config
echo "  Copying new Caddy config to $CADDY_CONFIG_PATH..."
sudo cp "$PROJECT_DIR/caddy.conf" "$CADDY_CONFIG_PATH"

# Validate Caddy config
echo "  Validating Caddy configuration..."
if sudo caddy validate --config /etc/caddy/Caddyfile 2>/dev/null; then
    echo "[OK] Caddy configuration is valid"
else
    echo "[ERROR] Caddy configuration is invalid, restoring backup..."
    sudo cp "${CADDY_CONFIG_PATH}.backup" "$CADDY_CONFIG_PATH"
    exit 1
fi

# Reload Caddy
echo "  Reloading Caddy..."
sudo systemctl reload caddy || sudo caddy reload --config /etc/caddy/Caddyfile
echo "[OK] Caddy reloaded with new configuration"

# =============================================================================
# Stop Frontend PM2 Process (if running)
# =============================================================================
echo ""
echo "============================================="
echo "  Cleaning up PM2 frontend process..."
echo "============================================="

if pm2 list | grep -q "nosocompany-frontend"; then
    echo "  Stopping and removing frontend PM2 process..."
    pm2 stop nosocompany-frontend 2>/dev/null || true
    pm2 delete nosocompany-frontend 2>/dev/null || true
    echo "[OK] Frontend PM2 process removed (Caddy serves static files now)"
else
    echo "  No frontend PM2 process found"
fi

# =============================================================================
# Quick Restart Backend
# =============================================================================
echo ""
echo "============================================="
echo "  Quick restart backend (minimal downtime)..."
echo "============================================="
cd "$BACKEND_DIR" || exit

# Delete legacy process if exists
pm2 delete "nosocompany" 2>/dev/null || true

# Check if backend is already running
if pm2 list | grep -q "$BACKEND_NAME"; then
    echo "  Restarting existing backend process..."
    pm2 delete "$BACKEND_NAME" 2>/dev/null || true
fi

echo "  Starting backend process with uv..."
pm2 start "$HOME/.local/bin/uv run uvicorn $BACKEND_MODULE --host 0.0.0.0 --port $BACKEND_PORT --workers $BACKEND_WORKERS" \
    --name "$BACKEND_NAME" --cwd "$BACKEND_DIR"

echo "[OK] Backend restarted on port $BACKEND_PORT"

# =============================================================================
# Wait for Backend Health Check
# =============================================================================
echo ""
echo "============================================="
echo "  Waiting for backend to be healthy..."
echo "============================================="

MAX_RETRIES=30
RETRY_COUNT=0
HEALTH_URL="http://localhost:$BACKEND_PORT/health"

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" | grep -q "200"; then
        echo "[OK] Backend is healthy!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "  Waiting for backend... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "[WARN] Backend health check timed out, continuing anyway..."
fi

# =============================================================================
# Save PM2 Configuration
# =============================================================================
echo ""
echo "============================================="
echo "  Saving PM2 configuration..."
echo "============================================="

pm2 save
pm2 startup systemd -u $USER --hp $HOME 2>/dev/null || true

echo "[OK] PM2 configuration saved and startup enabled"

# =============================================================================
# Display Status
# =============================================================================
echo ""
echo "============================================="
echo "  Deployment Status"
echo "============================================="
pm2 status

echo ""
echo "[OK] =================================="
echo "[OK] DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "[OK] =================================="
echo ""
echo "  Backend running on: http://localhost:$BACKEND_PORT"
echo "  Frontend served by: Caddy (static files from $WWW_DIR/dist)"
echo "  Production URL: $PROD_URL"
echo ""
echo "  Next Steps:"
echo "   1. SSL certificates are auto-managed by Caddy"
echo "   2. Check backend logs with: pm2 logs $BACKEND_NAME"
echo "   3. Check Caddy logs with: sudo journalctl -u caddy -f"
echo "   4. Monitor with: pm2 monit"
echo ""
echo "  To restart services:"
echo "   pm2 restart $BACKEND_NAME"
echo "   sudo systemctl reload caddy"
echo ""
echo "  Package management (uv):"
echo "   uv add <package>    # Add new dependency"
echo "   uv sync             # Install from lock file"
echo ""
