#!/bin/bash

# Fonction pour tuer les processus en quittant
cleanup() {
    echo ""
    echo "🛑 Arrêt des serveurs..."
    kill $(jobs -p) 2>/dev/null
    exit
}

# Piéger le signal de sortie (Ctrl+C)
trap cleanup SIGINT SIGTERM

echo "🚀 Démarrage de ScanGRID..."

# 1. Démarrer le Backend (Port 8001)
echo "📦 Lancement du Backend (FastAPI)..."
cd backend
# Vérifier si venv existe
if [ ! -d "venv" ]; then
    echo "⚠️  Environnement virtuel non trouvé. Création..."
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Démarrer le backend en arrière-plan
SCANGRID_DB_DIR=./data python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload &
BACKEND_PID=$!
echo "✅ Backend démarré (PID: $BACKEND_PID)"

# 2. Démarrer le Frontend (Vite)
echo "💻 Lancement du Frontend (React/Vite)..."
cd ../front
# Installer les dépendances si node_modules n'existe pas
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances npm..."
    npm install
fi

# Démarrer le frontend
npm run dev &
FRONTEND_PID=$!

echo "✨ Tout est prêt !"
echo "👉 Frontend : http://localhost:5173"
echo "👉 Backend  : http://localhost:8001"
echo "Appuyez sur Ctrl+C pour arrêter."

# Attendre indéfiniment
wait
