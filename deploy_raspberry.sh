#!/bin/bash

# Configuration
# Détermine le dossier où se trouve le script (votre dossier projet actuel)
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BRANCH="main"

echo "🚀 Starting ScanGRID deployment on Raspberry Pi..."
echo "📂 Project Directory: $PROJECT_DIR"

# 1. Update Codebase
cd "$PROJECT_DIR" || { echo "❌ Cannot cd to $PROJECT_DIR"; exit 1; }
echo "📦 Pulling latest changes from git..."
git pull origin "$BRANCH"

# 2. Update Backend Dependencies
echo "🐍 Updating Backend..."
cd backend || exit
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi
venv/bin/pip install -r requirements.txt

# 2.1. Setup Ollama
echo "🤖 Setting up Ollama AI..."
if ! command -v ollama &> /dev/null; then
    echo "⚠️  Ollama not installed. Installing..."
    curl -fsSL https://ollama.ai/install.sh | sh
fi

# Start Ollama service
if ! pgrep -x "ollama" > /dev/null; then
    echo "Starting Ollama service..."
    sudo systemctl start ollama 2>/dev/null || nohup ollama serve > /dev/null 2>&1 &
    sleep 2
fi

# Pull model if needed
if ! ollama list | grep -q "llama3.2:1b"; then
    echo "📥 Downloading llama3.2:1b model (~1.3 GB)..."
    ollama pull llama3.2:1b
fi
echo "✅ Ollama ready"

# 2.2. Database migrations
echo "🗄️  Running database migrations..."
env SCANGRID_DB_DIR=./data PYTHONPATH=. venv/bin/python migrate_categories.py
env SCANGRID_DB_DIR=./data PYTHONPATH=. venv/bin/python migrate_height.py
echo "✅ Migrations complete"
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
