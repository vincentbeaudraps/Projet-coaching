# 🚀 Guide de Démarrage - Coach Running Platform

Bienvenue ! Ce guide vous explique comment démarrer la plateforme rapidement.

## ⚙️ Prérequis

Assurez-vous que vous avez installé :
- **Node.js 18+** : https://nodejs.org/
- **PostgreSQL 12+** : https://www.postgresql.org/download/
- **Git** (optionnel) : https://git-scm.com/

Vérifiez avec :
```bash
node --version      # v18.0.0 ou plus
npm --version       # 9.0.0 ou plus
psql --version      # PostgreSQL 12 ou plus
```

## 📊 Étape 1 : Configurer PostgreSQL

### Windows
1. Lancez PostgreSQL
2. Ouvrez pgAdmin (inclus) ou utilisez pgAdmin Web
3. Créez une base de données :
   ```sql
   CREATE DATABASE coaching_db;
   ```

### macOS/Linux
```bash
# Démarrer PostgreSQL
brew services start postgresql

# Se connecter
psql postgres

# Créer la base
CREATE DATABASE coaching_db;
\q
```

## 🖥️ Étape 2 : Configuration Backend

```bash
# 1. Aller dans le dossier backend
cd backend

# 2. Créer le fichier .env
cp .env.example .env

# 3. Éditer .env avec vos paramètres
# ===== Windows/macOS =====
# Ouvrir .env dans votre éditeur
# Remplir :
# - DB_HOST=localhost
# - DB_PORT=5432
# - DB_NAME=coaching_db
# - DB_USER=postgres
# - DB_PASSWORD=[votre_mot_de_passe]
# - JWT_SECRET=ma_cle_secrete_super_longue_123456
# - JWT_EXPIRE=7d

# 4. Installer les dépendances
npm install

# 5. Vérifier que tout est bon (optionnel)
npm run build
```

## 🎨 Étape 3 : Configuration Frontend

```bash
# 1. Aller dans le dossier frontend (depuis la racine du projet)
cd frontend

# 2. Installer les dépendances
npm install
```

## 🚀 Étape 4 : Lancer l'application

### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

Vous devriez voir :
```
Connected to PostgreSQL
Database initialized successfully
Server running on port 3001
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

Vous devriez voir :
```
  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

## ✅ Vérification

1. **Backend API** : http://localhost:3001/api/health
   - Doit retourner : `{ "status": "ok", "timestamp": "..." }`

2. **Frontend** : http://localhost:5173
   - La page de login doit s'afficher

## 👤 Premier Test

### Créer un compte Coach
1. Cliquez sur "Register here"
2. Remplissez :
   - Nom : "Jean Coach"
   - Email : "coach@example.com"
   - Password : "password123"
   - Rôle : **Coach**
3. Cliquez "Register"

### Créer un compte Athlète
1. Ouvrez une fenêtre privée (Ctrl+Shift+P)
2. Allez à http://localhost:5173
3. Cliquez sur "Register here"
4. Remplissez :
   - Nom : "Marie Athlete"
   - Email : "athlete@example.com"
   - Password : "password123"
   - Rôle : **Athlete**
5. Cliquez "Register"

## 📚 Utilisation

### Coach Dashboard
1. Connectez-vous comme coach
2. Allez à l'onglet **Athletes** - Pour ajouter des athlètes
3. Allez à l'onglet **Sessions** - Pour créer des séances
4. Allez à l'onglet **Calendar** - Pour voir le calendrier
5. Allez à l'onglet **Overview** - Pour les stats

### Athlete Dashboard
1. Connectez-vous comme athlète
2. Allez à l'onglet **Sessions** - Voir ses séances
3. Allez à l'onglet **Performance** - Suivre ses résultats
4. Allez à l'onglet **Messages** - (À implémenter)

## 🔧 Dépannage

### "Cannot connect to database"
```
❌ Erreur : Database connection error
```
**Solutions:**
- Vérifier que PostgreSQL est running
- Vérifier les credentials dans .env
- Vérifier que coaching_db existe

### "Port 3001 already in use"
```bash
# Trouver ce qui utilise le port
# Windows
netstat -ano | findstr :3001

# macOS/Linux
lsof -i :3001

# Arrêter le processus ou changer PORT dans .env
```

### "Module not found"
```bash
# Réinstaller les dépendances
rm -rf node_modules package-lock.json
npm install
```

### Frontend affiche "Loading..." infiniment
- Vérifier que le backend est running sur :3001
- Vérifier les erreurs dans la console (F12)
- Vérifier le token JWT dans localStorage

## 🏗️ Structure du Projet

```
Projet coaching/
├── backend/                  # API Node.js/Express
│   ├── src/
│   │   ├── database/        # Connexion + Init DB
│   │   ├── routes/          # Endpoints API
│   │   ├── middleware/      # Auth JWT
│   │   ├── types/           # Types TS
│   │   └── index.ts         # Entry point
│   ├── package.json
│   ├── .env.example
│   └── README.md
│
├── frontend/                 # App React
│   ├── src/
│   │   ├── components/      # Réutilisables
│   │   ├── pages/           # Pages principales
│   │   ├── services/        # API client
│   │   ├── store/           # État Zustand
│   │   ├── styles/          # CSS
│   │   ├── types/           # Types TS
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md
│
├── docker-compose.yml       # Docker setup
├── README.md                # Doc principale
└── QUICKSTART.md           # Ce fichier
```

## 🎯 Prochaines Étapes

Après avoir démarré l'app :

1. **Ajouter un athlète**
   - Coach : Onglet Athletes → Formulaire
   - ⚠️ À implémenter (formulaire d'ajout)

2. **Créer une séance**
   - Coach : Onglet Sessions → SessionForm
   - Sélectionner un athlète, remplir les détails

3. **Voir le calendrier**
   - Coach : Onglet Calendar
   - Les séances doivent s'afficher

4. **Enregistrer une performance**
   - Athlète : Onglet Performance
   - ⚠️ À implémenter (formulaire d'enregistrement)

## 📞 Problèmes ?

Consultez les README.md de chaque dossier :
- `backend/README.md` - API et base de données
- `frontend/README.md` - Interface et composants
- `README.md` - Documentation générale

## 🎓 Pour Apprendre

### Backend
- Endpoints API : `backend/src/routes/`
- Base de données : `backend/src/database/init.ts`
- Auth : `backend/src/middleware/auth.ts`

### Frontend
- Pages : `frontend/src/pages/`
- Composants : `frontend/src/components/`
- Services API : `frontend/src/services/api.ts`
- État : `frontend/src/store/authStore.ts`

## 🚀 Prêt pour le développement ?

Vous pouvez maintenant :
1. **Ajouter des fonctionnalités** (messages temps réel, etc.)
2. **Améliorer l'UI/UX** (plus de graphiques, animations)
3. **Ajouter des tests** (Jest, Cypress)
4. **Déployer** (Docker, Vercel, Heroku)

Bonne chance avec votre plateforme de coaching ! 🏃‍♂️🏃‍♀️

---

**Questions fréquentes :**

Q: Comment changer le port ?
R: Modifier `PORT=3001` dans `backend/.env` et `VITE_API_URL` dans `frontend/.env.local`

Q: Comment ajouter une route API ?
R: Créer un fichier dans `backend/src/routes/` et l'importer dans `backend/src/index.ts`

Q: Comment ajouter une page ?
R: Créer un fichier dans `frontend/src/pages/` et l'importer dans `frontend/src/App.tsx`

Q: Où sont mes données ?
R: Dans la base PostgreSQL `coaching_db`, utilisez pgAdmin ou `psql` pour les voir
