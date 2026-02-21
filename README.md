# 🗂️ ScanGRID - Système de Gestion d'Inventaire Gridfinity

> Application iOS + Backend Raspberry Pi pour scanner et gérer l'inventaire de tiroirs Gridfinity avec OCR

## 📦 Structure du projet

```
ScanGRID/
├── backend/                    # Serveur API FastAPI (Raspberry Pi)
│   ├── main.py                # Application FastAPI principale
│   ├── database.py            # Configuration SQLAlchemy
│   ├── models.py              # Modèles ORM
│   ├── schemas.py             # Schémas Pydantic
│   ├── test_main.py           # Tests unitaires
│   ├── requirements.txt       # Dépendances Python
│   ├── scangrid.service       # Service systemd
│   ├── install.sh             # Installation Raspberry Pi
│   ├── dev.sh                 # Développement local
│   └── README.md              # Documentation backend
├── SWIFTUI_INTEGRATION.md     # Guide d'intégration SwiftUI
└── AI_AGENT_BRIEF.md          # Brief pour l'agent IA (SwiftUI)
```

## 🚀 Démarrage rapide

### Backend (Raspberry Pi)

```bash
cd backend
./install.sh
```

### Backend (Développement local)

```bash
cd backend
./dev.sh
```

Accéder à :
- API : http://localhost:8000
- Documentation Swagger : http://localhost:8000/docs

### Tests

```bash
cd backend
source venv/bin/activate
pytest
```

## 📱 App iOS SwiftUI

Voir [AI_AGENT_BRIEF.md](AI_AGENT_BRIEF.md) pour toutes les informations nécessaires au développement de l'app SwiftUI.

**Informations clés pour l'agent IA :**

1. **URL API** : `http://<IP_RASPBERRY_PI>:8000`
2. **Modèles de données** : Drawer → Layer → Bin
3. **Format** : JSON avec snake_case (API) → camelCase (Swift)
4. **Endpoints** : 
   - `POST /drawers` (créer tiroir complet)
   - `GET /drawers/{id}` (récupérer un tiroir)
   - `PATCH /bins/{id}` (mettre à jour une boîte)
   - Et plus...

Voir [SWIFTUI_INTEGRATION.md](SWIFTUI_INTEGRATION.md) pour le code Swift complet.

## 🎯 Fonctionnalités

### Backend
- ✅ API RESTful FastAPI
- ✅ Base de données SQLite
- ✅ Validation Pydantic stricte
- ✅ Transactions SQL atomiques
- ✅ Tests unitaires complets
- ✅ Service systemd pour auto-démarrage
- ✅ Logging détaillé

### App iOS (à développer)
- 🔄 Scan caméra de tiroirs Gridfinity
- 🔄 Détection automatique de la grille
- 🔄 OCR pour extraction des labels
- 🔄 Édition manuelle des boîtes
- 🔄 Gestion multi-couches (z_index)
- 🔄 Synchronisation avec le serveur

## 📊 Schéma de données

```
Drawer (Tiroir)
├── drawer_id (UUID)
├── name (String)
└── layers []
    └── Layer (Couche)
        ├── layer_id (UUID)
        ├── z_index (Int)
        └── bins []
            └── Bin (Boîte)
                ├── bin_id (UUID)
                ├── x_grid (Int)
                ├── y_grid (Int)
                ├── width_units (Int)
                ├── depth_units (Int)
                └── label_text (String?)
```

## 🔧 Technologies

**Backend :**
- FastAPI 0.109.0
- SQLAlchemy 2.0.25
- Pydantic 2.5.3
- Uvicorn 0.27.0
- Pytest 7.4.4

**iOS (recommandé) :**
- SwiftUI
- Vision Framework (OCR)
- URLSession (API)
- Combine (optionnel)

## 📖 Documentation

- [Backend README](backend/README.md) - Configuration serveur Raspberry Pi
- [SwiftUI Integration](SWIFTUI_INTEGRATION.md) - Guide d'intégration iOS complet
- [AI Agent Brief](AI_AGENT_BRIEF.md) - Brief pour développement SwiftUI

## 🧪 Tests

Le backend inclut 15+ tests unitaires couvrant :
- Création de tiroirs complets
- Récupération et listing
- Mise à jour de boîtes
- Suppressions en cascade
- Gestion des erreurs
- Validation des données

```bash
cd backend
pytest -v
```

## 🌐 API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/` | Health check |
| POST | `/drawers` | Créer un tiroir complet |
| GET | `/drawers` | Lister tous les tiroirs |
| GET | `/drawers/{id}` | Récupérer un tiroir |
| DELETE | `/drawers/{id}` | Supprimer un tiroir |
| GET | `/bins/{id}` | Récupérer une boîte |
| PATCH | `/bins/{id}` | Mettre à jour une boîte |

Documentation interactive : `http://<server>:8000/docs`

## 🔒 Sécurité

- ✅ Validation stricte des données (Pydantic)
- ✅ Transactions SQL atomiques
- ✅ CORS configuré pour iOS
- ✅ Service systemd sécurisé
- ⚠️ HTTP uniquement (réseau local)

## 📝 Licence

Projet interne - Usage personnel uniquement

---

**Version** : 1.0.0  
**Date** : 20 février 2026  
**Auteur** : Mathis Dupont
