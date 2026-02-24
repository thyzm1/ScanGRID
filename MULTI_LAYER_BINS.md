# Multi-Layer Bins Feature

## Vue d'ensemble

Cette fonctionnalité permet de créer des boîtes qui occupent plusieurs couches verticalement dans le système Gridfinity.

Par exemple, une boîte de hauteur 2 occupera deux couches consécutives (ex: couche 2 et 3).

## Modifications apportées

### Backend
- **models.py**: Ajout du champ `height_units` (INTEGER, default=1) à la table `bins`
- **schemas.py**: Ajout de `height_units` dans `BinBase`, `BinUpdate`
- **migrate_height.py**: Script de migration pour ajouter la colonne aux bases existantes

### Frontend
- **types/api.ts**: Ajout de `height_units` dans les interfaces `Bin`, `BinCreateRequest`, `BinUpdateRequest`, `BinFormData`
- **BinEditorModal.tsx**: 
  - Ajout de contrôles pour modifier largeur/profondeur/hauteur
  - Section "Dimensions" avec 3 inputs numériques
  - Affichage des dimensions dans le header (WxDxH)
- **Viewer3D.tsx**: 
  - Calcul dynamique de la hauteur des bins: `binHeight = height_units * BIN_HEIGHT`
  - Positionnement vertical adapté pour afficher les boîtes multi-couches
- **GridEditor3.tsx**: Ajout de `height_units: 1` par défaut lors de la création de nouvelles boîtes
- **UnplacedDock.tsx**: Affichage conditionnel de la hauteur si > 1

## Migration de la base de données

### Déploiement automatique (recommandé)

La migration est **automatiquement exécutée** lors du déploiement via :

```bash
./redeploy_full.sh
```

ou

```bash
./deploy_raspberry.sh
```

Les scripts de déploiement incluent maintenant la migration `migrate_height.py` qui ajoute la colonne `height_units` si elle n'existe pas.

### Migration manuelle (si nécessaire)

Si vous devez migrer manuellement une base existante :

```bash
cd backend
source venv/bin/activate  # Activer l'environnement virtuel
python3 migrate_height.py
```

### Pour une nouvelle installation:

Rien à faire! Le modèle SQLAlchemy créera automatiquement la colonne avec la valeur par défaut.

## Utilisation

### Créer une boîte multi-couches:

1. Créer ou éditer une boîte
2. Dans la section "Dimensions", modifier le champ "Hauteur (couches)"
3. Valeurs possibles: 1 à 5 couches
4. Enregistrer

### Vue 3D:

Les boîtes s'affichent automatiquement avec la hauteur correcte:
- Une boîte de hauteur 1: hauteur standard (42mm)
- Une boîte de hauteur 2: double hauteur (84mm)
- Une boîte de hauteur 3: triple hauteur (126mm)
- etc.

### Affichage:

- **Modal d'édition**: Dimensions affichées au format `WxDxH` (ex: "2×3×2 unités")
- **Dock non placé**: Hauteur affichée uniquement si > 1 (ex: "2×3×2" au lieu de "2×3")

## Limitations et notes

1. **Collision 3D**: Pour le moment, la logique de collision ne vérifie pas encore les overlaps verticaux entre couches
2. **Hauteur maximale**: Limitée à 5 couches pour éviter des boîtes trop hautes
3. **Compatibilité**: Les anciennes boîtes sans `height_units` seront automatiquement considérées comme hauteur = 1

## Prochaines étapes potentielles

- [ ] Implémenter la détection de collision 3D (vérifier que deux boîtes ne se chevauchent pas verticalement)
- [ ] Ajouter une visualisation dans GridEditor2D pour indiquer les boîtes multi-couches
- [ ] Permettre de visualiser toutes les couches occupées par une boîte
- [ ] Ajouter un indicateur visuel dans la grille 2D pour les boîtes qui s'étendent sur plusieurs couches
