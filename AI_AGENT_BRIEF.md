# 🤖 Brief pour l'Agent IA - Développement App SwiftUI ScanGRID

## 📋 Contexte du projet

Développement d'une application iOS SwiftUI pour scanner et gérer l'inventaire de tiroirs Gridfinity avec OCR.

## 🔌 Informations de connexion au Backend

### URL de l'API
```swift
let baseURL = "http://<IP_RASPBERRY_PI>:8000"
// Exemple: "http://192.168.1.100:8000"
// Ou avec mDNS: "http://raspberrypi.local:8000"
```

### Configuration Info.plist
Ajouter pour autoriser HTTP (réseau local) :
```xml
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

## 📦 Modèles de données (à implémenter exactement)

### Structure des données

**Drawer** (Tiroir)
- `drawer_id` : String (UUID, généré par le serveur)
- `name` : String
- `layers` : Array<Layer>

**Layer** (Couche/Niveau)
- `layer_id` : String (UUID, généré par le serveur)
- `z_index` : Int (0 = fond, 1 = au-dessus, etc.)
- `bins` : Array<Bin>

**Bin** (Boîte Gridfinity)
- `bin_id` : String (UUID, généré par le serveur)
- `x_grid` : Int (coordonnée X dans la grille)
- `y_grid` : Int (coordonnée Y dans la grille)
- `width_units` : Int (largeur en unités Gridfinity)
- `depth_units` : Int (profondeur en unités Gridfinity)
- `label_text` : String? (optionnel, texte détecté par OCR ou édité manuellement)

### Naming Convention
⚠️ **IMPORTANT** : L'API utilise `snake_case`, SwiftUI utilise `camelCase`.

Utiliser `CodingKeys` pour la conversion :
```swift
enum CodingKeys: String, CodingKey {
    case binId = "bin_id"
    case xGrid = "x_grid"
    case yGrid = "y_grid"
    // etc.
}
```

## 🌐 Endpoints disponibles

### 1. Santé du serveur
```
GET /
Réponse: {"status": "healthy", "service": "ScanGRID API", "version": "1.0.0"}
```

### 2. Créer un tiroir complet (POST)
```
POST /drawers
Content-Type: application/json

Request:
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

Response: Drawer complet avec IDs générés (201 Created)
```

**Important** : C'est une opération transactionnelle. Si une boîte échoue, tout est annulé.

### 3. Récupérer un tiroir (GET)
```
GET /drawers/{drawer_id}
Response: Drawer complet avec toutes les layers et bins (200 OK)
```

### 4. Lister tous les tiroirs (GET)
```
GET /drawers
Response: Array<Drawer> (200 OK)
```

### 5. Supprimer un tiroir (DELETE)
```
DELETE /drawers/{drawer_id}
Response: {"message": "..."} (200 OK)
```

**Note** : Suppression en cascade (layers et bins aussi supprimés).

### 6. Mettre à jour une boîte (PATCH)
```
PATCH /bins/{bin_id}
Content-Type: application/json

Request (tous les champs optionnels):
{
  "label_text": "Nouveau texte",
  "width_units": 3,
  "depth_units": 2
}

Response: Bin mis à jour (200 OK)
```

### 7. Récupérer une boîte (GET)
```
GET /bins/{bin_id}
Response: Bin (200 OK)
```

## ✅ Codes de statut HTTP

- `200 OK` : Succès (GET, PATCH, DELETE)
- `201 Created` : Tiroir créé avec succès (POST)
- `404 Not Found` : Ressource non trouvée
- `422 Unprocessable Entity` : Erreur de validation Pydantic
- `500 Internal Server Error` : Erreur serveur

## 🎯 Fonctionnalités requises dans l'app SwiftUI

### Écran 1 : Scan de tiroir
1. Caméra pour scanner un tiroir Gridfinity
2. Détection de la grille (computer vision)
3. OCR sur chaque boîte détectée pour extraire `label_text`
4. Prévisualisation des boîtes détectées avec leurs labels

### Écran 2 : Édition/Validation
1. Afficher la grille détectée
2. Permettre d'éditer manuellement :
   - Les labels (`label_text`)
   - Les positions (`x_grid`, `y_grid`)
   - Les dimensions (`width_units`, `depth_units`)
3. Choisir le `z_index` (étage de la boîte)
4. Bouton "Enregistrer" → appel à `POST /drawers`

### Écran 3 : Liste des tiroirs
1. Afficher tous les tiroirs (`GET /drawers`)
2. Recherche/filtrage par nom
3. Navigation vers les détails d'un tiroir

### Écran 4 : Détails d'un tiroir
1. Afficher les layers groupées par `z_index`
2. Afficher les bins sur une grille visuelle
3. Permet de modifier un label → `PATCH /bins/{id}`
4. Permet de supprimer le tiroir → `DELETE /drawers/{id}`

## 🧪 Gestion des erreurs

### Cas à gérer :
1. **Serveur non accessible** : Afficher un message d'erreur clair avec bouton "Réessayer"
2. **Timeout réseau** : Timeout de 30 secondes recommandé
3. **Erreur 422** : Afficher les erreurs de validation (coordonnées négatives, etc.)
4. **Erreur 404** : "Tiroir ou boîte non trouvé"
5. **Erreur réseau** : Mode hors ligne éventuel (local cache)

## 📱 Architecture recommandée

```
ScanGRIDApp/
├── Models/
│   ├── Drawer.swift
│   ├── Layer.swift
│   ├── Bin.swift
│   └── APIRequests.swift
├── Services/
│   ├── ScanGridAPIService.swift
│   ├── OCRService.swift
│   └── GridDetectionService.swift
├── ViewModels/
│   ├── ScanViewModel.swift
│   ├── DrawerListViewModel.swift
│   └── DrawerDetailViewModel.swift
└── Views/
    ├── ScanView.swift
    ├── EditGridView.swift
    ├── DrawerListView.swift
    └── DrawerDetailView.swift
```

## 🔧 Librairies suggérées

- **Vision Framework** : Pour OCR et détection de grille
- **URLSession** : Pour les appels réseau (natif, pas besoin de lib externe)
- **Combine** : Pour la gestion réactive (optionnel, async/await suffit)

## 🚀 Priorités de développement

1. ✅ **Phase 1** : Service API + modèles + liste des tiroirs
2. ✅ **Phase 2** : Affichage des détails + édition de labels
3. 🔄 **Phase 3** : Scan caméra + détection de grille
4. 🔄 **Phase 4** : OCR sur les boîtes
5. 🔄 **Phase 5** : Création complète d'un tiroir depuis le scan

## ⚡ Points critiques

1. **UUIDs** : Ne JAMAIS générer d'UUIDs côté client pour les créations. Le serveur les génère.
2. **Transactions** : Le POST /drawers est tout-ou-rien. Si ça échoue, rien n'est créé.
3. **Validation** : 
   - `x_grid`, `y_grid` : >= 0
   - `width_units`, `depth_units` : >= 1
   - `name` : non vide, max 200 caractères
4. **Relations** : Les boîtes appartiennent à des layers, les layers à des drawers.
5. **Cascade** : Supprimer un drawer supprime tout (layers + bins).

## 🌐 Documentation API interactive

Accessible sur le Raspberry Pi :
- **Swagger UI** : `http://<RASPBERRY_PI_IP>:8000/docs`
- **ReDoc** : `http://<RASPBERRY_PI_IP>:8000/redoc`

## 📞 Support

Pour tester la connexion :
```bash
# Depuis le Mac/iPhone sur le même réseau
curl http://<RASPBERRY_PI_IP>:8000/

# Réponse attendue :
# {"status":"healthy","service":"ScanGRID API","version":"1.0.0"}
```

## ✨ Exemple complet de workflow

1. **Utilisateur scanne un tiroir** → détection de 6 boîtes
2. **OCR extrait les labels** → ["Résistances", "LEDs", "Condensateurs", ...]
3. **Utilisateur valide/édite** → change "Résistances" en "Résistances 10kΩ"
4. **App envoie POST /drawers** avec structure complète
5. **Serveur répond avec IDs** → affichage de confirmation
6. **Utilisateur retourne à la liste** → voit le nouveau tiroir

---

**Version du backend** : 1.0.0  
**Date de création** : 20 février 2026  
**Compatibilité** : iOS 16+, Raspberry Pi 3B+ ou supérieur
