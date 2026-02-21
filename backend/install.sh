#!/bin/bash
# Script d'installation du serveur ScanGRID sur Raspberry Pi

set -e

echo "📦 Installation du serveur ScanGRID..."

# Variables
INSTALL_DIR="/home/pi/ScanGRID/backend"
DB_DIR="/var/lib/scangrid"
SERVICE_FILE="scangrid.service"

# Vérification que le script est exécuté en tant que pi
if [ "$USER" != "pi" ]; then
    echo "❌ Ce script doit être exécuté en tant qu'utilisateur 'pi'"
    exit 1
fi

# Installation des dépendances système
echo "📥 Installation des dépendances système..."
sudo apt-get update
sudo apt-get install -y python3-pip python3-venv sqlite3

# Création du répertoire de la base de données
echo "📁 Création du répertoire de base de données..."
sudo mkdir -p $DB_DIR
sudo chown pi:pi $DB_DIR
sudo chmod 755 $DB_DIR

# Création de l'environnement virtuel
echo "🐍 Création de l'environnement virtuel Python..."
cd $INSTALL_DIR
python3 -m venv venv
source venv/bin/activate

# Installation des dépendances Python
echo "📚 Installation des dépendances Python..."
pip install --upgrade pip
pip install -r requirements.txt

# Installation du service systemd
echo "⚙️ Installation du service systemd..."
sudo cp $SERVICE_FILE /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable scangrid.service

# Démarrage du service
echo "🚀 Démarrage du service..."
sudo systemctl start scangrid.service

# Vérification du statut
echo ""
echo "✅ Installation terminée!"
echo ""
echo "📊 Statut du service:"
sudo systemctl status scangrid.service --no-pager

echo ""
echo "📝 Commandes utiles:"
echo "  - Voir les logs: sudo journalctl -u scangrid -f"
echo "  - Redémarrer: sudo systemctl restart scangrid"
echo "  - Arrêter: sudo systemctl stop scangrid"
echo "  - Statut: sudo systemctl status scangrid"
echo ""
echo "🌐 L'API est accessible sur: http://$(hostname -I | awk '{print $1}'):8000"
echo "📖 Documentation: http://$(hostname -I | awk '{print $1}'):8000/docs"
