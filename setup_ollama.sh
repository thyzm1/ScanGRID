#!/bin/bash

# Script d'installation et de configuration d'Ollama pour ScanGRID
# À exécuter sur le Raspberry Pi

set -e

echo "🤖 Installation et configuration d'Ollama pour ScanGRID"
echo "========================================================"

# 1. Vérifier si Ollama est déjà installé
if command -v ollama &> /dev/null; then
    echo "✅ Ollama est déjà installé (version: $(ollama --version))"
else
    echo "📥 Installation d'Ollama..."
    curl -fsSL https://ollama.ai/install.sh | sh
    echo "✅ Ollama installé avec succès"
fi

# 2. Configurer Ollama comme service systemd (si possible)
echo ""
echo "🔧 Configuration du service Ollama..."
if command -v systemctl &> /dev/null; then
    # Créer le fichier de service s'il n'existe pas
    if [ ! -f /etc/systemd/system/ollama.service ]; then
        echo "📝 Création du service systemd..."
        sudo tee /etc/systemd/system/ollama.service > /dev/null <<EOF
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
ExecStart=/usr/local/bin/ollama serve
User=$USER
Group=$USER
Restart=always
RestartSec=3
Environment="PATH=/usr/local/bin:/usr/bin:/bin"

[Install]
WantedBy=default.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable ollama
        echo "✅ Service systemd créé et activé"
    else
        echo "✅ Service systemd déjà configuré"
    fi
    
    # Démarrer le service
    echo "🚀 Démarrage du service Ollama..."
    sudo systemctl start ollama
    sleep 2
    
    if sudo systemctl is-active --quiet ollama; then
        echo "✅ Service Ollama actif"
    else
        echo "⚠️  Le service n'a pas démarré correctement"
        sudo systemctl status ollama
    fi
else
    echo "⚠️  systemd non disponible, démarrage manuel..."
    nohup ollama serve > /tmp/ollama.log 2>&1 &
    sleep 2
    echo "✅ Ollama démarré en arrière-plan"
fi

# 3. Télécharger le modèle llama3.2:1b
echo ""
echo "📦 Téléchargement du modèle llama3.2:1b..."
if ollama list | grep -q "llama3.2:1b"; then
    echo "✅ Modèle llama3.2:1b déjà téléchargé"
else
    echo "⏬ Téléchargement en cours (~1.3 GB)..."
    ollama pull llama3.2:1b
    echo "✅ Modèle téléchargé avec succès"
fi

# 4. Test du modèle
echo ""
echo "🧪 Test du modèle..."
RESPONSE=$(ollama run llama3.2:1b "Réponds simplement 'OK' si tu es fonctionnel" 2>&1 | head -n 5)
if [ $? -eq 0 ]; then
    echo "✅ Modèle fonctionnel"
    echo "   Réponse: $RESPONSE"
else
    echo "❌ Erreur lors du test du modèle"
fi

# 5. Récapitulatif
echo ""
echo "========================================================"
echo "🎉 Installation d'Ollama terminée !"
echo "========================================================"
echo ""
echo "📊 État du système:"
if command -v systemctl &> /dev/null && sudo systemctl is-active --quiet ollama; then
    echo "   Service: ✅ Actif (systemd)"
    echo "   Commandes utiles:"
    echo "     - Redémarrer: sudo systemctl restart ollama"
    echo "     - Statut:     sudo systemctl status ollama"
    echo "     - Logs:       sudo journalctl -u ollama -f"
elif pgrep -x "ollama" > /dev/null; then
    echo "   Service: ✅ Actif (processus manuel)"
    echo "   PID:     $(pgrep -x ollama)"
else
    echo "   Service: ❌ Non actif"
fi

echo ""
echo "📦 Modèles disponibles:"
ollama list

echo ""
echo "🔗 Prochaines étapes:"
echo "   1. Vérifiez que le backend a ollama installé: cd backend && pip install ollama"
echo "   2. Redémarrez ScanGRID: ./launch.sh ou pm2 reload ecosystem.config.js"
echo "   3. Testez l'amélioration de description dans l'interface web"
echo ""
