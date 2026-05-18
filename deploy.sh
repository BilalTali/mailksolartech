#!/bin/bash

# =============================================================================
# MalikSolarTech — Live Server Deployment Script
# =============================================================================
# Usage: bash deploy.sh
#
# This script safely pulls the latest backend code WITHOUT touching:
#   - frontend/dist/         (compiled frontend, built separately)
#   - storage/app/public/    (user uploads: branding, docs, leads, etc.)
#   - backend/public/favicon.ico (overridden on server by branding system)
#
# Run this from the project root on the live server (Hostinger SSH).
# =============================================================================

set -e

echo "=============================="
echo " MalikSolarTech Deploy Script"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "=============================="

# ── Step 1: Stash any local changes to protected files ─────────────────────
echo ""
echo "[1/5] Protecting live server files from git overwrite..."

# Tell git to skip worktree updates for files that must NOT be overwritten
# by git pull (branding, dist, etc.)
git update-index --skip-worktree frontend/dist/index.html 2>/dev/null || true
git update-index --skip-worktree frontend/dist/logo.png 2>/dev/null || true
git update-index --skip-worktree frontend/dist/logo.webp 2>/dev/null || true
git update-index --skip-worktree frontend/dist/favicon.ico 2>/dev/null || true
git update-index --skip-worktree frontend/dist/favicon.svg 2>/dev/null || true
git update-index --skip-worktree frontend/dist/manifest.webmanifest 2>/dev/null || true
git update-index --skip-worktree backend/public/favicon.ico 2>/dev/null || true

echo "   Protected branding assets from git overwrite."

# ── Step 2: Pull latest code ────────────────────────────────────────────────
echo ""
echo "[2/5] Pulling latest code from GitHub..."
git pull origin main
echo "   Pull complete."

# ── Step 3: Install/update backend dependencies ─────────────────────────────
echo ""
echo "[3/5] Installing Composer dependencies..."
cd backend
composer install --no-dev --optimize-autoloader --no-interaction 2>&1 | tail -5
cd ..
echo "   Composer done."

# ── Step 4: Run Laravel maintenance tasks ───────────────────────────────────
echo ""
echo "[4/5] Running Laravel post-deploy tasks..."
cd backend

php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan migrate --force

# Reset OPcache if the opcache-reset script exists
if [ -f "public/opcache-reset.php" ]; then
    curl -s "https://maliksolartech.com/opcache-reset.php" > /dev/null && echo "   OPcache reset."
fi

cd ..
echo "   Laravel cache rebuilt."

# ── Step 5: Summary ─────────────────────────────────────────────────────────
echo ""
echo "[5/5] Deploy complete!"
echo ""
echo "  IMPORTANT: Branding and upload folders were NOT touched."
echo "  If you need to update the frontend, upload dist/ via FTP"
echo "  or run: cd frontend && npm install && npm run build"
echo ""
echo "=============================="
