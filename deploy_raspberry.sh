#!/bin/bash

# Configuration
PROJECT_DIR="$HOME/ScanGRID"
BRANCH="main"

echo "🚀 Starting ScanGRID deployment on Raspberry Pi..."

# 1. Update Codebase
cd "$PROJECT_DIR" || exit
echo "📦 Pulling latest changes from git..."
git pull origin "$BRANCH"

# 2. Update Backend Dependencies
echo "🐍 Updating Backend..."
cd backend || exit
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
cd ..

# 3. Build Frontend
echo "⚛️ Building Frontend..."
cd front || exit
npm install
npm run build
cd ..

# 4. Restart PM2
echo "🔄 Restarting application..."
pm2 reload ecosystem.config.js

echo "✅ Deployment complete! Check status with 'pm2 status'"
