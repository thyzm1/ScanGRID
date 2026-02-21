# ScanGRID Web Interface

Interface web minimaliste pour la gestion d'inventaire de tiroirs Gridfinity.

## 🎨 Design System

- **Style** : Minimaliste type Apple/Vercel
- **Mode sombre/clair** : Automatique avec toggle manuel
- **Typographie** : SF Pro / Inter / Segoe UI
- **Framework** : React 18 + TypeScript + Vite
- **UI** : Tailwind CSS
- **Grille interactive** : react-grid-layout

## 🚀 Développement

### Prérequis

- Node.js 18+
- npm ou yarn

### Installation

```bash
cd front
npm install
```

### Lancement en mode développement

```bash
npm run dev
```

L'application sera accessible sur http://localhost:3000

**Important** : Le backend doit tourner sur le port 8001 (proxy configuré dans vite.config.ts).

### Build pour production

```bash
npm run build
```

Les fichiers compilés seront dans le dossier `dist/`.

## 📁 Structure du projet

```
front/
├── src/
│   ├── components/          # Composants React
│   │   ├── DrawerList.tsx   # Liste des tiroirs
│   │   ├── DrawerEditor.tsx # Éditeur de tiroir
│   │   ├── GridEditor.tsx   # Grille interactive (react-grid-layout)
│   │   └── ThemeToggle.tsx  # Toggle mode sombre/clair
│   ├── services/
│   │   └── api.ts           # Client API REST
│   ├── store/
│   │   └── useStore.ts      # State management (Zustand)
│   ├── types/
│   │   └── api.ts           # Types TypeScript (contrat API)
│   ├── styles/
│   │   └── global.css       # Styles globaux + variables CSS
│   ├── App.tsx              # Composant racine
│   └── main.tsx             # Point d'entrée
├── index.html
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## 🎯 Fonctionnalités

### Gestion des tiroirs

- ✅ Création de tiroirs avec dimensions personnalisées (W × D)
- ✅ Liste des tiroirs avec aperçu
- ✅ Suppression de tiroirs

### Éditeur de grille

- ✅ **Multi-couches** (z_index) : Système de couches avec sélecteur
- ✅ **Drag & Drop** : Déplacement des boîtes par glisser-déposer
- ✅ **Redimensionnement** : Poignées de redimensionnement
- ✅ **Contraintes physiques** :
  - Pas de superposition sur la même couche
  - Pas de débordement de la grille
  - Snap-to-grid strict (1 unité)
- ✅ **Édition des boîtes** : Modal pour modifier le nom (label_text)
- ✅ **Ajout/Suppression** : Gestion complète des boîtes

### Sauvegarde

- ✅ Synchronisation avec l'API REST (POST /drawers)
- ✅ Format JSON strictement conforme au contrat backend

## 🔌 Intégration avec le Backend

### Mode développement (proxy)

Le fichier `vite.config.ts` configure un proxy `/api` vers `http://localhost:8001` :

```typescript
proxy: {
  '/api': {
    target: 'http://localhost:8001',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ''),
  },
}
```

### Mode production (FastAPI StaticFiles)

Le backend FastAPI sert directement les fichiers du dossier `dist/` :

1. Compiler le frontend :
   ```bash
   npm run build
   ```

2. Le backend FastAPI (voir `backend/main.py`) servira automatiquement :
   - `GET /` → index.html
   - `GET /assets/*` → fichiers statiques
   - `GET /api/*` → API REST

**Avantage** : Un seul serveur sur le Raspberry Pi (port 8001).

## 🎨 Personnalisation des couleurs

Les variables CSS dans `src/styles/global.css` :

```css
:root {
  --color-bg: #ffffff;              /* Fond principal */
  --color-bg-secondary: #f9fafb;    /* Fond secondaire */
  --color-border: #e5e7eb;          /* Bordures */
  --color-text: #111827;            /* Texte principal */
  --color-text-secondary: #6b7280;  /* Texte secondaire */
  --color-primary: #2563eb;         /* Couleur primaire */
  --color-primary-hover: #1d4ed8;   /* Hover primaire */
  --color-error: #dc2626;           /* Erreurs */
  --color-success: #059669;         /* Succès */
}

:root.dark {
  /* Variables pour le mode sombre */
}
```

## 📦 Déploiement sur Raspberry Pi

1. **Build du frontend** :
   ```bash
   cd front
   npm run build
   ```

2. **Le backend FastAPI sert les fichiers** :
   Le dossier `front/dist/` est automatiquement servi par FastAPI via StaticFiles.

3. **Démarrer le backend** :
   ```bash
   cd backend
   source venv/bin/activate
   uvicorn main:app --host 0.0.0.0 --port 8001
   ```

4. **Accéder à l'interface** :
   - Interface web : http://raspberry-pi.local:8001/
   - API : http://raspberry-pi.local:8001/api/drawers

## 🧪 Tests

Pour tester l'interface sans backend :

```bash
# Lancer un serveur de développement avec données mockées
npm run dev
```

## 🐛 Debugging

### Problèmes courants

**Erreur "Failed to fetch"** :
- Vérifier que le backend tourne sur le port 8001
- Vérifier la configuration du proxy dans `vite.config.ts`

**La grille ne s'affiche pas correctement** :
- Vérifier que les dimensions du tiroir sont définies
- Vérifier la console pour les erreurs de layout

**Le mode sombre ne fonctionne pas** :
- Vérifier que la classe `dark` est bien ajoutée à `<html>` dans le navigateur

## 📄 Licence

MIT
