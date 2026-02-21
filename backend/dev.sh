#!/bin/bash
# Script de développement local - Lance le serveur en mode dev

cd "$(dirname "$0")"

echo "🚀 Démarrage du serveur ScanGRID en mode développement..."

# Vérifier si l'environnement virtuel existe
if [ ! -d "venv" ]; then
    echo "📦 Création de l'environnement virtuel..."
    python3 -m venv venv
fi

# Activer l'environnement virtuel
source venv/bin/activate

# Installer/mettre à jour les dépendances
echo "📚 Installation des dépendances..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

# Créer le répertoire de base de données pour le dev
export SCANGRID_DB_DIR="./dev_data"
mkdir -p $SCANGRID_DB_DIR

echo ""
echo "✅ Environnement prêt!"
echo "📁 Base de données: $SCANGRID_DB_DIR/gridfinity.db"
echo ""

# Lancer le serveur en mode reload (pour le dev)
echo "🌐 Serveur démarré sur http://localhost:8000"
echo "📖 Documentation: http://localhost:8000/docs"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter"
echo ""

uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level info
