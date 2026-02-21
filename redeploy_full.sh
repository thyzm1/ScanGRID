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
# Vérification rapide de la syntaxe
python3 -m py_compile main.py
if [ $? -eq 0 ]; then
    echo "✅ Syntaxe Backend OK"
else
    echo "❌ Erreur de syntaxe dans le Backend !"
    exit 1
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
