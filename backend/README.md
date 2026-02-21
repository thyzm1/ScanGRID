# ScanGRID Backend API

API ultra-légère pour la gestion d'inventaire Gridfinity sur Raspberry Pi.

## 🚀 Démarrage rapide

### Installation sur Raspberry Pi

```bash
# 1. Cloner ou copier le dossier backend sur le Raspberry Pi
cd /home/pi/ScanGRID/backend

# 2. Rendre le script d'installation exécutable
chmod +x install.sh

# 3. Exécuter l'installation
./install.sh
```

Le script va :
- Installer les dépendances système (Python 3, SQLite)
- Créer un environnement virtuel Python
- Installer les dépendances Python
- Configurer le service systemd pour démarrage automatique au boot
- Démarrer le serveur

### Installation manuelle (développement)

```bash
# Créer l'environnement virtuel
python3 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Créer le répertoire de base de données
mkdir -p /var/lib/scangrid

# Lancer le serveur
python main.py
```

## 📡 Endpoints API

### Santé du serveur
```http
GET /
```
Vérifie que le serveur est actif.

### Tiroirs

#### Créer/Remplacer un tiroir complet
```http
POST /drawers
Content-Type: application/json

{
  "name": "Tiroir Composants",
  "layers": [
    {
      "z_index": 0,
      "bins": [
        {
          "x_grid": 0,
          "y_grid": 0,
          "width_units": 2,
          "depth_units": 1,
          "label_text": "Résistances 10k"
        }
      ]
    }
  ]
}
```

#### Récupérer un tiroir
```http
GET /drawers/{drawer_id}
```

#### Lister tous les tiroirs
```http
GET /drawers
```

#### Supprimer un tiroir
```http
DELETE /drawers/{drawer_id}
```

### Boîtes

#### Mettre à jour une boîte
```http
PATCH /bins/{bin_id}
Content-Type: application/json

{
  "label_text": "Nouveau label",
  "width_units": 3
}
```

#### Récupérer une boîte
```http
GET /bins/{bin_id}
```

## 🧪 Tests

```bash
# Activer l'environnement virtuel
source venv/bin/activate

# Lancer tous les tests
pytest

# Lancer avec verbose
pytest -v

# Lancer un test spécifique
pytest test_main.py::test_create_drawer_full -v
```

## 🔧 Gestion du service (Raspberry Pi)

```bash
# Voir les logs en temps réel
sudo journalctl -u scangrid -f

# Redémarrer le service
sudo systemctl restart scangrid

# Arrêter le service
sudo systemctl stop scangrid

# Démarrer le service
sudo systemctl start scangrid

# Voir le statut
sudo systemctl status scangrid

# Désactiver le démarrage automatique
sudo systemctl disable scangrid
```

## 📁 Structure du projet

```
backend/
├── main.py              # Application FastAPI principale
├── database.py          # Configuration SQLAlchemy
├── models.py            # Modèles ORM
├── schemas.py           # Schémas Pydantic
├── test_main.py         # Tests unitaires
├── requirements.txt     # Dépendances Python
├── pytest.ini           # Configuration pytest
├── scangrid.service     # Service systemd
├── install.sh           # Script d'installation
└── README.md           # Cette documentation
```

## 🗄️ Base de données

- **Type**: SQLite
- **Emplacement**: `/var/lib/scangrid/gridfinity.db`
- **Schéma**: Tables `drawers`, `layers`, `bins` avec relations en cascade

## 🔒 Sécurité

- CORS activé pour permettre les requêtes depuis l'app iOS
- Validation stricte avec Pydantic
- Transactions SQL pour éviter les états corrompus
- Service systemd avec restrictions de sécurité

## 📊 Monitoring

Les logs sont disponibles via journalctl :
```bash
sudo journalctl -u scangrid -n 100  # 100 dernières lignes
sudo journalctl -u scangrid --since "1 hour ago"
```

## 🌐 Documentation interactive

Une fois le serveur lancé, accéder à :
- Swagger UI: `http://<raspberry-pi-ip>:8000/docs`
- ReDoc: `http://<raspberry-pi-ip>:8000/redoc`

## 🐛 Dépannage

### Le serveur ne démarre pas
```bash
# Vérifier les logs
sudo journalctl -u scangrid -n 50

# Vérifier que le port 8000 n'est pas utilisé
sudo netstat -tlnp | grep 8000

# Tester manuellement
cd /home/pi/ScanGRID/backend
source venv/bin/activate
python main.py
```

### Erreur de base de données
```bash
# Vérifier les permissions
ls -la /var/lib/scangrid/

# Réinitialiser la base (ATTENTION: supprime toutes les données)
sudo rm -f /var/lib/scangrid/gridfinity.db
sudo systemctl restart scangrid
```

## 📝 Licence

Projet interne - Usage personnel uniquement.
