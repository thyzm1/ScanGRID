# 📂 Index des Fichiers du Projet ScanGRID

## 🎯 Documentation Principale

| Fichier | Description |
|---------|-------------|
| [README.md](README.md) | Documentation principale du projet |
| [AI_AGENT_BRIEF.md](AI_AGENT_BRIEF.md) | Brief complet pour l'agent IA SwiftUI (17 pages) |
| [SWIFTUI_INTEGRATION.md](SWIFTUI_INTEGRATION.md) | Guide d'intégration SwiftUI avec code complet |
| [QUICK_START_SWIFTUI.md](QUICK_START_SWIFTUI.md) | Démarrage rapide pour SwiftUI (copier-coller) |

## 🖥️ Backend (dans `/backend`)

### Code Source

| Fichier | Description | Lignes |
|---------|-------------|---------|
| `main.py` | Application FastAPI principale avec tous les endpoints | ~250 |
| `database.py` | Configuration SQLAlchemy 2.0 + session asynchrone | ~50 |
| `models.py` | Modèles ORM (Drawer, Layer, Bin) avec relations | ~80 |
| `schemas.py` | Schémas Pydantic pour validation entrée/sortie | ~100 |

### Tests

| Fichier | Description | Tests |
|---------|-------------|-------|
| `test_main.py` | Tests unitaires complets avec pytest | 15+ tests |
| `pytest.ini` | Configuration pytest | - |
| `quick_test.py` | Script de test rapide de l'API | 9 tests |

### Configuration & Déploiement

| Fichier | Description |
|---------|-------------|
| `requirements.txt` | Dépendances Python (FastAPI, SQLAlchemy, etc.) |
| `scangrid.service` | Fichier service systemd pour Raspberry Pi |
| `install.sh` | Script d'installation automatique pour Raspberry Pi |
| `dev.sh` | Script de développement local avec hot-reload |
| `.env.example` | Exemple de configuration d'environnement |
| `.gitignore` | Fichiers à ignorer par Git |

### Données de Test

| Fichier | Description |
|---------|-------------|
| `test_data.json` | 3 tiroirs d'exemple avec composants électroniques |
| `load_test_data.py` | Script pour charger les données de test dans l'API |

### Documentation

| Fichier | Description |
|---------|-------------|
| `README.md` | Documentation complète du backend |

## 📊 Structure de la Base de Données

**Fichier** : `/var/lib/scangrid/gridfinity.db` (ou `./dev_data/gridfinity.db` en dev)

**Tables** :
- `drawers` : Tiroirs
- `layers` : Couches (z_index)
- `bins` : Boîtes Gridfinity

**Relations** : Drawer 1→N Layer 1→N Bin (cascade DELETE)

## 🔌 API Endpoints

| Méthode | Endpoint | Fichier | Ligne |
|---------|----------|---------|-------|
| GET | `/` | main.py | ~55 |
| POST | `/drawers` | main.py | ~63 |
| GET | `/drawers` | main.py | ~135 |
| GET | `/drawers/{id}` | main.py | ~113 |
| DELETE | `/drawers/{id}` | main.py | ~158 |
| GET | `/bins/{id}` | main.py | ~238 |
| PATCH | `/bins/{id}` | main.py | ~187 |

## 📱 Pour l'Agent IA SwiftUI

### À lire en priorité :
1. ⭐ **QUICK_START_SWIFTUI.md** - 2 min de lecture, tout l'essentiel
2. **AI_AGENT_BRIEF.md** - Spécifications complètes
3. **SWIFTUI_INTEGRATION.md** - Code Swift prêt à l'emploi

### Modèles Swift à implémenter :
- `Drawer`, `Layer`, `Bin` (avec CodingKeys)
- `CreateDrawerRequest`, `CreateLayerRequest`, `CreateBinRequest`
- `UpdateBinRequest`

### Service API :
Voir `SWIFTUI_INTEGRATION.md` section "Service API" pour la classe `ScanGridAPIService` complète.

## 🧪 Comment Tester

### 1. Lancer le serveur
```bash
cd backend
./dev.sh
```

### 2. Tester avec pytest
```bash
cd backend
source venv/bin/activate
pytest -v
```

### 3. Test rapide manuel
```bash
cd backend
python quick_test.py
```

### 4. Charger des données de test
```bash
cd backend
python load_test_data.py
```

### 5. Documentation interactive
Ouvrir dans le navigateur : http://localhost:8000/docs

## 📦 Installation Raspberry Pi

```bash
# Sur le Raspberry Pi
cd /home/pi/ScanGRID/backend
./install.sh
```

Le service démarre automatiquement au boot.

## 🔍 Commandes Utiles

### Logs du serveur (Raspberry Pi)
```bash
sudo journalctl -u scangrid -f
```

### Redémarrer le service
```bash
sudo systemctl restart scangrid
```

### Voir le statut
```bash
sudo systemctl status scangrid
```

### Trouver l'IP du Raspberry Pi
```bash
hostname -I
```

## 📐 Schéma de Données Complet

```
Drawer
├── drawer_id: UUID (auto)
├── name: String
└── layers: [Layer]
    └── Layer
        ├── layer_id: UUID (auto)
        ├── drawer_id: UUID (FK)
        ├── z_index: Int (0, 1, 2...)
        └── bins: [Bin]
            └── Bin
                ├── bin_id: UUID (auto)
                ├── layer_id: UUID (FK)
                ├── x_grid: Int (≥0)
                ├── y_grid: Int (≥0)
                ├── width_units: Int (≥1)
                ├── depth_units: Int (≥1)
                └── label_text: String? (optionnel)
```

## 🎯 Statut du Projet

### ✅ Complété
- [x] Backend FastAPI complet et testé
- [x] Base de données SQLite avec SQLAlchemy 2.0
- [x] Validation Pydantic stricte
- [x] 15+ tests unitaires pytest
- [x] Service systemd pour Raspberry Pi
- [x] Documentation complète
- [x] Scripts d'installation et de test
- [x] Données de test pour démo

### 🔄 En Cours (App iOS)
- [ ] Interface SwiftUI
- [ ] Service API Swift
- [ ] Scan caméra + détection grille
- [ ] OCR sur les boîtes
- [ ] Édition manuelle des boîtes
- [ ] Synchronisation avec le serveur

## 📝 Notes Importantes

1. **UUIDs** : Toujours générés côté serveur, jamais côté client
2. **Transactions** : POST /drawers est atomique (tout ou rien)
3. **Cascade** : Supprimer un drawer supprime layers et bins
4. **Validation** : x_grid/y_grid ≥ 0, width/depth ≥ 1, name non vide
5. **HTTP** : Réseau local uniquement (pas HTTPS)

## 🌟 Prochaines Étapes

1. Installer sur Raspberry Pi : `./install.sh`
2. Tester l'API : `python quick_test.py`
3. Charger des données : `python load_test_data.py`
4. Développer l'app SwiftUI (voir AI_AGENT_BRIEF.md)
5. Intégrer scan + OCR
6. Tester end-to-end

---

**Version** : 1.0.0  
**Date** : 20 février 2026  
**Fichiers** : 22 fichiers créés  
**Lignes de code** : ~1500+ lignes Python + Tests  
**Documentation** : ~2500+ lignes Markdown
