#!/bin/bash

# Script untuk update otomatis LokaClean di VPS
# Cara pakai: ./update.sh

set -e # Stop script jika ada error

echo "🚀 Starting LokaClean Update..."

# 0. Force clean artifacts
echo "🧹 Cleaning up old builds..."
rm -rf frontend/dist
rm -rf frontend/node_modules/.vite

# 1. Pull latest code
echo "📥 Pulling latest changes from git..."
git pull origin main

# 2. Update Frontend (Includes SEO Prerendering)
echo "🎨 Updating Frontend..."
cd frontend

# FORCE CLEAN: Remove previous build artifacts and cache to ensure image optimizer runs fresh
echo "🧹 Cleaning previous build artifacts..."
rm -rf dist
rm -rf node_modules/.vite

npm install
# Note: npm run build triggers 'react-snap' (prerendering) automatically via postbuild
echo "🏗️  Building Frontend & Prerendering SEO pages..."
npm run build
cd ..

# 3. Update Backend
echo "⚙️  Updating Backend..."
cd backend
npm install
npm run build
echo "🗄️  Migrating Database..."
npx prisma migrate deploy
echo "🔄 Restarting API..."
pm2 restart lokaclean-api
cd ..

echo "✅ Update Finished! Check https://lokaclean.com"
