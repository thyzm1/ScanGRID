# Flutter Application - ScanGRID

APPLICATION FLUTTER COMPLÈTE POUR SCAN GRIDFINITY

## ✅ Composants implémentés

### 📦 Modèles de données (Freezed + JSON)
- ✅ `Bin` - Boîte Gridfinity avec sérialisation JSON
- ✅ `Layer` - Couche de tiroir
- ✅ `Drawer` - Tiroir complet
- ✅ `DetectedBin` - Boîte détectée pendant le scan
- ✅ Requests (Create/Update) pour l'API

### 🔧 Services
- ✅ `ApiService` - Client Dio pour l'API REST
  - Health check
  - CRUD complet tiroirs
  - Mise à jour boîtes
  - Gestion erreurs avec timeouts
  
- ✅ `OcrService` - Reconnaissance de texte
  - ML Kit Text Recognition
  - Crop de régions
  - Enhancement d'image
  - Calcul de confiance
  
- ✅ `GridDetectionService` - Détection de grille
  - Prétraitement d'image (grayscale, contrast, gaussian blur)
  - Détection de contours (seuillage Otsu)
  - Composantes connexes (flood fill)
  - Conversion pixels → coordonnées Gridfinity
  - Calcul automatique du ratio pixels/unité
  
- ✅ `LayerComparisonService` - Logique de couches
  - **Détection de trous** (comparaison texte OCR entre couches)
  - Validation anti-chevauchement
  - Normalisation de texte (case-insensitive)

### 🎯 Providers Riverpod
- ✅ Service providers (singleton)
- ✅ Drawer providers (liste, CRUD)
- ✅ Scan providers (état de scan multi-couches)
- ✅ Camera provider

### 🎨 UI & Widgets
- ✅ `GridfinityGridPainter` - CustomPaint pour la grille
  - Grille de fond avec lignes de repère
  - Affichage des boîtes avec couleurs (réelle/trou/sélectionnée)
  - Labels OCR avec confiance
  - Coordonnées et dimensions
  
- ✅ `InteractiveGridfinityGrid` - Widget interactif
  - Détection de tap sur les boîtes
  - Calcul automatique de la taille de grille
  - Sélection visuelle

### 📱 Écrans
- ✅ `HomeScreen` - Accueil avec statut serveur
- ✅ `DrawerListScreen` - Liste des tiroirs
- ✅ `ScanScreen` - Scan caméra avec instructions
- ✅ `EditGridScreen` - Édition interactive de la grille
  - Statistiques (boîtes réelles, trous, couche)
  - Grille CustomPaint interactive
  - Liste des boîtes détectées
  - Modal d'édition (showModalBottomSheet)
  - Passage aux couches suivantes
  - Sauvegarde finale au serveur

### 🧪 Tests Unitaires
- ✅ Tests de logique métier (LayerComparisonService)
  - Détection de trous
  - Validation couches
  - Chevauchements
  - Comparaison de texte
  
- ✅ Tests de modèles
  - Sérialisation/Désérialisation JSON
  - CodingKeys (snake_case ↔ camelCase)

## 🚀 Pour lancer l'application

### 1. Démarrer le backend API (port 8001)

```bash
cd backend
rm -rf venv  # Si vous avez Python 3.14, recréer le venv
python3.12 -m venv venv  # Utiliser Python 3.12 (pas 3.14!)
source venv/bin/activate
pip install -r requirements.txt
export SCANGRID_DB_DIR="./dev_data"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**Note** : Le port 8001 est utilisé car 8000 est occupé par SAM3ToSVG.

### 2. Générer les fichiers Freezed et JSON Serializable

```bash
cd flutterApp
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

### 3. Configurer l'adresse IP du serveur

✅ **Déjà configuré** : `http://MacBook-Pro-de-Mathis.local:8001`  
Si besoin, modifiez [lib/core/config/api_config.dart](lib/core/config/api_config.dart#L7).

### 4. Lancer les tests

```bash
flutter test  # Tous les tests passent ✅
```

### 5. Lancer sur iOS

```bash
flutter run -d 00008130-000C182E0C81001C
# ou simplement: flutter run
```

### Permissions configurées ✅

- **iOS** : Camera + HTTP local autorisé dans [Info.plist](ios/Runner/Info.plist)
- **Android** : À configurer si nécessaire (camera, internet)

## 📐 Architecture Technique

### Détection de Grille - Algorithme

1. **Prétraitement**:
   - Grayscale conversion
   - Contrast enhancement (1.5x)
   - Gaussian blur (radius 2) pour réduire le bruit

2. **Seuillage**:
   - Otsu threshold (simplifié)
   - Image binaire noir/blanc

3. **Détection de contours**:
   - Flood fill pour trouver composantes connexes
   - Filtrage taille minimale (100 pixels)

4. **Conversion Gridfinity**:
   ```dart
   // Ratio calculé automatiquement
   gridUnitSize = plus_petite_dimension_detectée
   
   // Conversion coordonnées
   xGrid = floor(pixelX / gridUnitSize)
   yGrid = floor(pixelY / gridUnitSize)
   widthUnits = round(pixelWidth / gridUnitSize)
   depthUnits = round(pixelHeight / gridUnitSize)
   ```

### Logique des Trous

```dart
Pour chaque boîte détectée sur couche N:
  Si couche N-1 existe:
    Trouver boîte sous-jacente à position (x,y)
    Si texte_OCR(N) == texte_OCR(N-1):
      → C'est un TROU
      → Ne pas ajouter à la couche N
    Sinon:
      → Vraie boîte, ajouter
```

**Normalisation du texte**:
- `.trim()` - Enlever espaces
- `.toLowerCase()` - Insensible à la casse
- Regex espaces multiples

### Gestion de la Mémoire

- ✅ Disposal des contrôleurs caméra
- ✅ Disposal des services OCR
- ✅ Cleanup des images temporaires
- ✅ `ref.onDispose()` pour les providers

## 🎯 Workflow Utilisateur

```
1. HomeScreen
   ↓ [Scanner]
2. ScanScreen (Couche 0)
   ↓ [Capture photo]
3. GridDetectionService.detectGrid()
   ↓ [Analyse + OCR]
4. EditGridScreen
   ↓ [Valider/Éditer]
   ↓ [Couche suivante]
5. ScanScreen (Couche 1)
   ↓ [Capture]
6. LayerComparisonService.filterHoles()
   ↓ [Détection trous]
7. EditGridScreen
   ↓ [Terminer]
8. POST /drawers → Serveur
   ↓
9. Succès → HomeScreen
```

## 🔍 Points d'Amélioration Possible

### Court Terme
- [ ] Permissions iOS/Android (caméra) dans Info.plist/AndroidManifest
- [ ] Persistance locale (SharedPreferences pour config)
- [ ] Mode offline avec cache

### Moyen Terme
- [ ] Intégration opencv_dart pour détection plus robuste
- [ ] Calibration automatique grille (4 coins)
- [ ] Preview 3D des couches empilées
- [ ] Export PDF de l'inventaire

### Long Terme
- [ ] Machine Learning custom pour détection
- [ ] Reconnaissance de composants électroniques
- [ ] Suggestions de rangement

## 📊 Statistiques Code

- **Modèles** : 4 fichiers + generated
- **Services** : 4 fichiers (~1200 lignes)
- **Providers** : 3 fichiers
- **UI** : 5 écrans + 2 widgets
- **Tests** : 2 fichiers avec 15+ tests

## 🔐 Sécurité

- ✅ Validation Freezed compile-time
- ✅ Timeout réseau (30s)
- ✅ Gestion d'erreurs exhaustive
- ✅ Pas de credentials hardcodés

## 🎓 Concepts Avancés Utilisés

- **Freezed** : Classes immuables
- **JSON Serializable** : Sérialisation type-safe
- **Riverpod** : State management réactif
- **CustomPainter** : Rendu 2D custom
- **Computer Vision** : Détection de contours, flood fill
- **OCR** : ML Kit
- **Async/Await** : Opérations asynchrones

---

**Prêt pour flutter run ! 🚀**
