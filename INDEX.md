# 📑 INDEX - Coach Running Platform

Bienvenue ! Voici comment naviguer dans ce projet complet.

## 🚀 Pour Démarrer Rapidement

**Commencez par :** [QUICKSTART.md](QUICKSTART.md)
- 5 étapes simples
- 10 minutes pour démarrer
- Windows/macOS/Linux

**Alternative avec Docker :** [DOCKER.md](DOCKER.md)
- 1 commande : `docker-compose up`
- Tout s'installe automatiquement

## 📚 Documentation

### Vue d'Ensemble
- **[SUMMARY.md](SUMMARY.md)** - Résumé complet du projet
- **[COMPLETION.md](COMPLETION.md)** - Ce qui a été livré
- **[README.md](README.md)** - Guide principal (1000+ lignes)

### Pour Développer
- **[API.md](API.md)** - Documentation de tous les endpoints (500+ lignes)
- **[STRUCTURE.md](STRUCTURE.md)** - Arborescence détaillée du projet
- **[backend/README.md](backend/README.md)** - Spécifique au backend
- **[frontend/README.md](frontend/README.md)** - Spécifique au frontend

### Pour Déployer
- **[DOCKER.md](DOCKER.md)** - Déploiement avec Docker
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - Notes GitHub Copilot

## 🏗️ Structure du Projet

```
Projet coaching/
│
├── 📖 Documentation (Commencer ici)
│   ├── README.md          ← Guide complet
│   ├── QUICKSTART.md      ← Démarrage rapide
│   ├── SUMMARY.md         ← Résumé du projet
│   ├── API.md             ← Endpoints documentation
│   └── STRUCTURE.md       ← Arborescence détaillée
│
├── 🖥️ Backend API (Node.js/Express)
│   ├── README.md          ← Backend guide
│   ├── package.json       ← Dépendances
│   ├── .env.example       ← Variables d'env
│   └── src/
│       ├── routes/        ← 5 routers API
│       ├── database/      ← PostgreSQL setup
│       └── middleware/    ← Auth JWT
│
├── 💻 Frontend (React/TypeScript)
│   ├── README.md          ← Frontend guide
│   ├── package.json       ← Dépendances
│   ├── vite.config.ts     ← Vite config
│   └── src/
│       ├── pages/         ← 4 pages
│       ├── components/    ← 4 composants
│       └── services/      ← API client
│
├── 🐳 Infrastructure
│   ├── docker-compose.yml ← Services Docker
│   ├── DOCKER.md          ← Docker guide
│   ├── setup.bat          ← Setup Windows
│   └── setup.sh           ← Setup Linux/macOS
│
└── 🧪 Tests
    └── test.sh            ← Script de test API
```

## 🎯 Parcours par Rôle

### Je suis un **Nouveau Développeur**
1. Lire [QUICKSTART.md](QUICKSTART.md) (10 min)
2. Lancer l'app (5 min)
3. Tester l'authentification (5 min)
4. Explorer [API.md](API.md) (15 min)

### Je suis un **Developer Backend**
1. Lire [backend/README.md](backend/README.md)
2. Consulter [API.md](API.md)
3. Explorer `backend/src/routes/`
4. Modifier/ajouter des endpoints

### Je suis un **Developer Frontend**
1. Lire [frontend/README.md](frontend/README.md)
2. Consulter [API.md](API.md) pour les endpoints
3. Explorer `frontend/src/components/`
4. Modifier/ajouter des pages

### Je veux **Déployer**
1. Lire [DOCKER.md](DOCKER.md)
2. Exécuter `docker-compose up`
3. Configurer le domaine
4. Mettre en place les sauvegardes

### Je cherche de **l'Aide**
1. Chercher dans README.md
2. Voir section Troubleshooting dans QUICKSTART.md
3. Vérifier API.md si problème d'endpoint
4. Regarder les logs : `npm run dev`

## 📋 Fichiers Importants

### À Personnaliser
```
backend/.env              ← Configurer PostgreSQL
frontend/.env.local       ← Optionnel (API URL)
docker-compose.yml        ← Ports et services
```

### À Consulter
```
README.md                 ← Architecture générale
API.md                    ← Endpoints détaillés
STRUCTURE.md              ← Organisation du code
```

### À Exécuter
```
setup.bat (Windows)       ← Installation auto
setup.sh (Linux/macOS)    ← Installation auto
docker-compose up         ← Docker
npm run dev              ← Dev mode
```

## 🔧 Commandes Essentielles

```bash
# Installation
npm install

# Développement
npm run dev                    # Backend
npm run dev                    # Frontend (autre terminal)

# Build
npm run build

# Production
npm start                      # Backend
npm run preview              # Frontend

# Docker
docker-compose up --build    # Tout
docker-compose down          # Arrêter

# Tests
./test.sh                    # API tests (Linux/macOS)
```

## ✅ Checklist Avant de Commencer

- [ ] Node.js 18+ installé (`node --version`)
- [ ] PostgreSQL running (`psql --version`)
- [ ] Git installé (optionnel)
- [ ] Code editor (VS Code recommandé)
- [ ] Terminal ouvert dans le dossier du projet

## 🎓 Pages de Documentation par Topic

### Authentication
- [README.md](README.md) - Section "Authentication"
- [backend/README.md](backend/README.md) - Section "Authentication"
- [API.md](API.md) - Section "Auth Endpoints"

### Database
- [README.md](README.md) - Section "Database Schema"
- [backend/README.md](backend/README.md) - Section "Database"
- [STRUCTURE.md](STRUCTURE.md) - Section "Database"

### API
- [API.md](API.md) - Tous les endpoints
- [backend/README.md](backend/README.md) - Architecture
- [README.md](README.md) - Vue d'ensemble

### Frontend
- [frontend/README.md](frontend/README.md) - Frontend specific
- [README.md](README.md) - Architecture globale
- [STRUCTURE.md](STRUCTURE.md) - Organisation fichiers

### Deployment
- [DOCKER.md](DOCKER.md) - Docker deployment
- [README.md](README.md) - Recommendations
- [backend/README.md](backend/README.md) - Build

### Troubleshooting
- [QUICKSTART.md](QUICKSTART.md) - Section "Dépannage"
- [backend/README.md](backend/README.md) - Troubleshooting
- [frontend/README.md](frontend/README.md) - Troubleshooting

## 🚀 Premier Démarrage

### Étape 1 : Lire
```
Lire : QUICKSTART.md (5 min)
```

### Étape 2 : Installer
```bash
./setup.sh                 # Linux/macOS
setup.bat                  # Windows
```

### Étape 3 : Configurer
```bash
# Éditer backend/.env
# Changer les credentials PostgreSQL
```

### Étape 4 : Lancer
```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

### Étape 5 : Tester
```
Ouvrir : http://localhost:5173
Créer compte et tester
```

## 📞 Besoin d'Aide ?

| Question | Où chercher |
|----------|------------|
| Comment installer ? | [QUICKSTART.md](QUICKSTART.md) |
| Comment utiliser l'API ? | [API.md](API.md) |
| Comment ajouter une page ? | [frontend/README.md](frontend/README.md) |
| Comment ajouter un endpoint ? | [backend/README.md](backend/README.md) |
| Erreur lors du démarrage ? | [QUICKSTART.md](QUICKSTART.md) - Dépannage |
| Comment déployer ? | [DOCKER.md](DOCKER.md) |
| Quelle est la structure ? | [STRUCTURE.md](STRUCTURE.md) |

## 🎉 Prêt à Commencer ?

**[Allez au QUICKSTART →](QUICKSTART.md)**

---

**Dernière mise à jour : Février 2024**

Bonne chance avec votre plateforme ! 🚀
