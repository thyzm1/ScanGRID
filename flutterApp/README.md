# ScanGRID Flutter App

Application mobile Flutter pour scanner et gérer l'inventaire de tiroirs Gridfinity.

## 🚀 Fonctionnalités

- 📷 Scan de tiroirs par couche (z_index)
- 🔍 Détection automatique de la grille Gridfinity
- 📝 OCR sur les boîtes pour extraction des labels
- 🎨 Interface d'édition interactive (CustomPaint)
- 🧠 Détection intelligente des "trous" entre couches
- 🌐 Synchronisation avec serveur Raspberry Pi

## 🏗️ Architecture

```
lib/
├── models/          # Modèles Freezed (Drawer, Layer, Bin)
├── services/        # Services (API, OCR, Vision)
├── providers/       # Providers Riverpod
├── features/        # Fonctionnalités par module
│   ├── scan/       # Scan caméra + détection
│   ├── drawer/     # Liste et détails tiroirs
│   └── edit/       # Édition grille
├── core/           # Config, constantes, utils
└── main.dart       # Point d'entrée
```

## 📦 Installation

```bash
# Installer les dépendances
flutter pub get

# Générer les fichiers
flutter pub run build_runner build --delete-conflicting-outputs

# Lancer l'app
flutter run
```

## 🧪 Tests

```bash
# Tests unitaires
flutter test

# Tests avec coverage
flutter test --coverage
```

## 🔧 Configuration

Éditer `lib/core/config/api_config.dart` :

```dart
static const baseUrl = 'http://192.168.1.100:8000';
```

## 📱 Permissions iOS (Info.plist)

```xml
<key>NSCameraUsageDescription</key>
<string>Scan de tiroirs Gridfinity</string>
<key>NSAppTransportSecurity</key>
<dict>
    <key>NSAllowsArbitraryLoads</key>
    <true/>
</dict>
```

## 🏃 Build Runner

```bash
# Watch mode (auto-génération)
flutter pub run build_runner watch --delete-conflicting-outputs

# Build unique
flutter pub run build_runner build --delete-conflicting-outputs
```

## 📝 Notes Techniques

### Détection de Grille
Le service `GridDetectionService` analyse l'image pour :
1. Détecter les contours des boîtes
2. Calculer le ratio pixels/unité Gridfinity
3. Convertir en coordonnées (x_grid, y_grid) et dimensions

### Gestion des Trous
Pour chaque couche N > 0 :
- Compare les résultats OCR avec la couche N-1
- Si texte identique à la position (x,y) → c'est un trou
- La boîte n'est pas ajoutée à la couche N

### Conversion Pixels → Gridfinity
```dart
// 1 unité Gridfinity = 42mm dans le standard
// Algorithme dans grid_detection_service.dart
```
