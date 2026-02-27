#!/bin/bash

# Arrêter le script en cas d'erreur
set -e

echo "🚀 Démarrage du redéploiement complet de ScanGRID..."

# Répertoire du projet (automatiquement détecté)
PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_DIR"

echo "📂 Dossier du projet : $PROJECT_DIR"

# 1. Mise à jour du code depuis Git
echo "--------------------------------------------------"
echo "📥 1. Récupération du code (git pull)..."
git pull origin main

# 2. Rebuild du Frontend
echo "--------------------------------------------------"
echo "🏗️  2. Construction du Frontend (React/Vite)..."
cd front
# Installation des dépendances (juste au cas où)
npm install --silent
# Build de production
if npm run build; then
    echo "✅ Build Frontend réussi !"
else
    echo "❌ Échec du build Frontend !"
    exit 1
fi
cd ..

# 3. Mise à jour Backend (vérification dépendances)
echo "--------------------------------------------------"
echo "🐍 3. Vérification du Backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "⚠️  Venv manquant, création..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
echo "✅ Dépendances installées (incl. pypdf + python-multipart pour BOM PDF)"

# 3.1. Vérification et configuration d'Ollama
echo "🤖 3.1. Configuration d'Ollama pour l'IA..."
if ! command -v ollama &> /dev/null; then
    echo "⚠️  Ollama n'est pas installé. Installation..."
    curl -fsSL https://ollama.ai/install.sh | sh
    echo "✅ Ollama installé"
else
    echo "✅ Ollama déjà installé"
fi

# Vérifier si le service tourne
if ! pgrep -x "ollama" > /dev/null; then
    echo "🔄 Démarrage du service Ollama..."
    # Essayer avec systemd d'abord
    if sudo systemctl start ollama 2>/dev/null; then
        echo "✅ Ollama démarré via systemd"
    else
        # Fallback: démarrage manuel en arrière-plan
        nohup ollama serve > /dev/null 2>&1 &
        sleep 2
        echo "✅ Ollama démarré en arrière-plan"
    fi
else
    echo "✅ Service Ollama déjà actif"
fi

# Vérifier et télécharger le modèle si nécessaire
if ! ollama list | grep -q "llama3.2:3b"; then
    echo "📥 Téléchargement du modèle llama3.2:3b (~2 GB)..."
    ollama pull llama3.2:3b
    echo "✅ Modèle téléchargé"
else
    echo "✅ Modèle llama3.2:3b déjà disponible"
fi

# Suppression de l'ancien modèle 1b si présent
if ollama list | grep -q "llama3.2:1b"; then
    echo "🗑️  Suppression de l'ancien modèle llama3.2:1b..."
    ollama rm llama3.2:1b && echo "✅ llama3.2:1b supprimé" || echo "⚠️  Échec suppression 1b"
fi

# Vérification rapide de la syntaxe
python3 -m py_compile main.py
if [ $? -eq 0 ]; then
    echo "✅ Syntaxe Backend OK"
else
    echo "❌ Erreur de syntaxe dans le Backend !"
    exit 1
fi

# Migration de la base de données
echo "🗄️  Migration de la base de données..."
env SCANGRID_DB_DIR=./data PYTHONPATH=. venv/bin/python migrate_categories.py
if [ $? -eq 0 ]; then
    echo "✅ Migration catégories réussie"
else
    echo "⚠️  Attention : La migration catégories a peut-être échoué (ou déjà faite)"
fi

echo "📏 Migration height_units (boîtes multi-couches)..."
env SCANGRID_DB_DIR=./data PYTHONPATH=. venv/bin/python migrate_height.py
if [ $? -eq 0 ]; then
    echo "✅ Migration height_units réussie"
else
    echo "⚠️  Attention : La migration height_units a peut-être échoué (ou déjà faite)"
fi

echo "📏 Migration z_offset (boîtes multi-couches fractionnées)..."
env SCANGRID_DB_DIR=./data PYTHONPATH=. venv/bin/python migrate_z_offset.py
if [ $? -eq 0 ]; then
    echo "✅ Migration z_offset réussie"
else
    echo "⚠️  Attention : La migration z_offset a peut-être échoué (ou déjà faite)"
fi
echo "🗂️  Migration BOM Projects (tables projects + project_bins)..."
env SCANGRID_DB_DIR=./data PYTHONPATH=. venv/bin/python - <<'EOF'
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(".")))
from database import engine, init_db
from models import Base
import models  # noqa: F401 — assure que Project/ProjectBin sont enregistrés
from sqlalchemy import text

async def migrate():
    # 1. Crée les tables manquantes (idempotent)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables OK")

    # 2. Ajoute les colonnes manquantes (idempotent grâce au try/except)
    _column_migrations = [
        "ALTER TABLE project_bins ADD COLUMN url TEXT",
    ]
    async with engine.begin() as conn:
        for stmt in _column_migrations:
            try:
                await conn.execute(text(stmt))
                print(f"Migration colonne OK : {stmt}")
            except Exception:
                print(f"Colonne déjà présente (ignorée) : {stmt}")

asyncio.run(migrate())
EOF

if [ $? -eq 0 ]; then
    echo "✅ Tables projects / project_bins prêtes"
else
    echo "⚠️  Attention : migration Projects a peut-être échoué"
fi

cd ..

# 4. Redémarrage PM2
echo "--------------------------------------------------"
echo "🔄 4. Redémarrage de l'application (PM2)..."
# Recharge la configuration si elle a changé, sinon reload les processus
if pm2 reload ecosystem.config.js; then
    echo "✅ PM2 reload effectué"
else
    echo "⚠️  PM2 reload a échoué, tentative de restart..."
    pm2 start ecosystem.config.js
fi
pm2 save

# 5. Redémarrage du Tunnel Cloudflare
echo "--------------------------------------------------"
echo "🌐 5. Redémarrage du Tunnel Cloudflare..."
# Tentative de restart du service systemd standard
if sudo systemctl restart cloudflared; then
    echo "✅ Service cloudflared redémarré avec succès"
else
    echo "⚠️  Impossible de redémarrer cloudflared via systemctl (peut-être pas installé en tant que service ?)"
    # Fallback: vérifier le process
    if pgrep -x "cloudflared" > /dev/null; then
        echo "ℹ️  Processus cloudflared en cours d'exécution (PID: $(pgrep -x cloudflared))"
    else
        echo "❌ Cloudflared ne semble pas tourner !"
    fi
fi

# 6. Bilan
echo "--------------------------------------------------"
echo "🎉 Redéploiement TERMINÉ avec succès !"
echo "--------------------------------------------------"
echo "📊 État des services :"
pm2 status
echo "--------------------------------------------------"
