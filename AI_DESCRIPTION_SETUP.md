# 🤖 Configuration IA - Amélioration de Descriptions

## 📋 Vue d'ensemble

Cette fonctionnalité permet d'améliorer automatiquement les descriptions de composants en utilisant **Ollama** avec le modèle ultra-léger **llama3.2:1b** (parfait pour Raspberry Pi).

## 🎯 Fonctionnalités

- ✨ Bouton "Améliorer avec IA" dans l'éditeur de boîtes
- 🚀 Génération de descriptions ultra-concises (max 25 mots)
- 🔋 Optimisé pour Raspberry Pi (modèle 1B paramètres)
- ⚡ Rapide et économe en ressources

## � Installation Rapide (Automatisée)

### Option 1 : Script d'installation dédié (Recommandé)

```bash
# Sur votre Raspberry Pi
cd /Users/mathisdupont/ScanGRID

# Exécuter le script d'installation Ollama
./setup_ollama.sh
```

Ce script fait tout automatiquement :
- ✅ Installe Ollama
- ✅ Configure le service systemd
- ✅ Télécharge le modèle llama3.2:1b
- ✅ Teste le fonctionnement

### Option 2 : Utiliser le script de déploiement complet

```bash
# Sur votre Raspberry Pi
cd /Users/mathisdupont/ScanGRID

# Redéploiement complet (inclut Ollama)
./redeploy_full.sh
```

Ce script fait également :
- Git pull du dernier code
- Build du frontend
- Installation des dépendances backend
- **Configuration automatique d'Ollama**
- Migration de la base de données
- Redémarrage PM2

## 📦 Installation Manuelle (si besoin)

### 1. Installer Ollama

```bash
# Installer Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Vérifier l'installation
ollama --version
```

### 2. Télécharger le modèle llama3.2:1b

```bash
# Télécharger le modèle léger (env. 1.3 GB)
ollama pull llama3.2:1b

# Vérifier que le modèle est installé
ollama list
```

### 3. Installer la dépendance Python

```bash
cd /Users/mathisdupont/ScanGRID/backend

# Installer les nouvelles dépendances
pip install -r requirements.txt

# Ou directement
pip install ollama
```

### 4. Démarrer le service Ollama

```bash
# Option 1 : Démarrage manuel (pour test)
ollama serve

# Option 2 : Service systemd (recommandé pour production)
sudo systemctl enable ollama
sudo systemctl start ollama
sudo systemctl status ollama
```

## 🧪 Test de la fonctionnalité

### Test backend direct

```bash
# Vérifier que le modèle répond
ollama run llama3.2:1b "Bonjour, es-tu fonctionnel ?"

# Tester avec un prompt technique
ollama run llama3.2:1b "Décris en 20 mots un relais 5V SRD-05VDC-SL-C pour domotique"
```

### Test de l'endpoint API

```bash
# Redémarrer le backend
cd /Users/mathisdupont/ScanGRID/backend
python main.py

# Tester l'endpoint (dans un autre terminal)
curl -X POST "http://localhost:8000/api/improve-description?title=Relais%205V%20SRD-05VDC-SL-C&content=10A%20250VAC%2C%20bobine%205V&instruction=Montage%20sur%20PCB%20pour%20domotique"
```

Réponse attendue :
```json
{
  "improved_description": "Relais de puissance 10A pour commutation de charges AC. Pilotage en 5V idéal pour l'isolation galvanique en domotique.",
  "model": "llama3.2:1b"
}
```

## 🎨 Utilisation dans l'interface

1. Ouvrir l'éditeur d'une boîte (cliquer sur une boîte existante ou en créer une)
2. Entrer un **Titre** (requis)
3. Éventuellement remplir la **Description** existante ou les **Articles contenus**
4. Cliquer sur le bouton **✨ Améliorer avec IA**
5. Attendre quelques secondes (indicateur de chargement)
6. La description améliorée remplace l'ancienne

## ⚙️ Configuration avancée

### Modifier les paramètres du modèle

Dans [backend/main.py](backend/main.py#L510), ajuster :

```python
response = ollama.generate(
    model='llama3.2:1b',
    prompt=prompt,
    options={
        'temperature': 0.2,    # Plus bas = plus factuel (0.0-1.0)
        'num_predict': 40,     # Nombre max de tokens générés
        'top_p': 0.9           # Diversité (0.0-1.0)
    }
)
```

### Utiliser un modèle plus puissant (si Pi 5 ou serveur)

```bash
# Télécharger un modèle plus gros (3B paramètres, ~2GB)
ollama pull llama3.2:3b

# Modifier dans main.py
model='llama3.2:3b'
```

## 🔧 Dépannage

### Le script setup_ollama.sh échoue

```bash
# Vérifier les permissions
chmod +x setup_ollama.sh

# Lancer avec plus de logs
bash -x setup_ollama.sh
```

### Erreur "Service Ollama non disponible"

```bash
# Vérifier qu'Ollama tourne
ps aux | grep ollama

# Redémarrer si nécessaire
sudo systemctl restart ollama
```

### Erreur "model not found"

```bash
# Re-télécharger le modèle
ollama pull llama3.2:1b
```

### Timeout ou lenteur

- Vérifier la RAM disponible : `free -h`
- Réduire `num_predict` dans le code (ex: 30 au lieu de 40)
- Utiliser le modèle 1B au lieu du 3B

### Le bouton est grisé

- Vérifier qu'un **titre** est entré (requis)
- Vérifier que le backend est démarré
- Consulter la console navigateur (F12) pour voir les erreurs

## 📊 Performance

Sur Raspberry Pi 4B (4GB RAM) :
- Temps de réponse : **2-5 secondes**
- RAM utilisée : **~800 MB**
- CPU : **~50% pendant la génération**

Sur Raspberry Pi 5 (8GB RAM) :
- Temps de réponse : **1-3 secondes**
- RAM utilisée : **~1 GB**
- CPU : **~40% pendant la génération**

## 🔒 Sécurité

- ✅ L'IA tourne **100% localement** (pas d'envoi de données externes)
- ✅ Pas besoin de clé API
- ✅ Respect de la vie privée
- ✅ Fonctionne hors ligne

## 📝 Exemple de prompt système

Le prompt utilisé actuellement :

```
Tu es un assistant technique spécialisé dans l'inventaire de composants électroniques.

Génère une description ultra-concise (maximum 25 mots) à partir des informations suivantes :

Titre : Relais 5V SRD-05VDC-SL-C
Contenu : 10A 250VAC, bobine 5V
Consigne : Montage sur PCB pour domotique

Règles strictes :
- Style : Direct, factuel, sans adjectifs marketing
- Structure : [Fonction principale] + [Caractéristique clé] + [Usage cible]
- Format : Une seule phrase ou deux segments courts séparés par un point
- Si le contenu est vide ou contradictoire, base-toi uniquement sur le titre
- N'invente pas de spécifications techniques non fournies


## 📜 Scripts disponibles

| Script | Description |
|--------|-------------|
| `setup_ollama.sh` | Installation et configuration complète d'Ollama |
| `launch.sh` | Lancement en développement (avec vérification Ollama) |
| `deploy_raspberry.sh` | Déploiement sur Raspberry Pi (inclut Ollama) |
| `redeploy_full.sh` | Redéploiement complet avec git pull (inclut Ollama) |

### Ordre recommandé pour la première installation

```bash
# 1. Installation initiale d'Ollama
./setup_ollama.sh

# 2. Premier déploiement complet
./redeploy_full.sh

# 3. Pour les redéploiements suivants
./redeploy_full.sh  # ou
pm2 reload ecosystem.config.js
```
Description :
```

## 🚀 Prochaines étapes possibles

- [ ] Ajouter un cache des descriptions générées
- [ ] Permettre la sélection du modèle dans l'UI
- [ ] Ajouter un historique des versions de descriptions
- [ ] Support multilingue (anglais/français)
- [ ] Fine-tuning du modèle sur vos composants spécifiques
