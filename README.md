# Coach Running Platform

Plateforme complète de coaching de course à pieds pour gérer les athlètes, créer des séances d'entraînement, suivre les performances et communiquer en temps réel.

## 🎯 Fonctionnalités

### Pour les Coachs
- 📊 Dashboard avec vue d'ensemble (athlètes, séances, performances)
- 👥 Gestion des athlètes (ajouter, consulter, modifier)
- 🎯 Création et gestion des séances d'entraînement
- 📅 Calendrier interactif des séances
- 💬 Système de messagerie avec les athlètes
- 📈 Analytics et suivi des performances

### Pour les Athlètes
- 📅 Vue des séances assignées
- 📊 Historique des performances
- 📝 Enregistrement des résultats de séances
- 💬 Communication directe avec le coach

## 🛠️ Architecture

```
├── Backend (Node.js + Express)
│   ├── PostgreSQL Database
│   ├── JWT Authentication
│   └── RESTful API
├── Frontend (React + TypeScript)
│   ├── Vite Build Tool
│   ├── React Router
│   └── State Management (Zustand)
```

## 📋 Prérequis

- Node.js 18+
- PostgreSQL 12+
- npm ou yarn

## 🚀 Installation

### 1. Base de données

```bash
# Créer une base de données PostgreSQL
createdb coaching_db

# Ou via psql:
psql
CREATE DATABASE coaching_db;
\q
```

### 2. Backend

```bash
cd backend

# Copier le fichier d'environnement
cp .env.example .env

# Modifier .env avec vos paramètres
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=coaching_db
# DB_USER=postgres
# DB_PASSWORD=votre_mot_de_passe

# Installer les dépendances
npm install

# Lancer le serveur
npm run dev
```

Le serveur sera accessible à `http://localhost:3001`

### 3. Frontend

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

L'application sera accessible à `http://localhost:5173`

## 🔗 Endpoints API

### Authentication
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion

### Athletes (Coach only)
- `GET /api/athletes` - Liste des athlètes
- `GET /api/athletes/:id` - Détails d'un athlète
- `POST /api/athletes` - Ajouter un athlète
- `PUT /api/athletes/:id` - Modifier un athlète

### Training Sessions
- `POST /api/sessions` - Créer une séance
- `GET /api/sessions` - Lister les séances
- `GET /api/sessions/athlete/:athleteId` - Séances d'un athlète
- `PUT /api/sessions/:id` - Modifier une séance
- `DELETE /api/sessions/:id` - Supprimer une séance

### Performance
- `POST /api/performance` - Enregistrer une performance
- `GET /api/performance/athlete/:athleteId` - Historique
- `GET /api/performance/analytics/:athleteId` - Analytics

### Messages
- `POST /api/messages` - Envoyer un message
- `GET /api/messages/conversation/:userId` - Conversation
- `PUT /api/messages/read/:userId` - Marquer comme lu

## 📊 Schéma Base de Données

### users
- id (UUID)
- email (VARCHAR)
- name (VARCHAR)
- password_hash (VARCHAR)
- role (coach | athlete)
- created_at (TIMESTAMP)

### athletes
- id (UUID)
- user_id (FK)
- coach_id (FK)
- age (INT)
- level (VARCHAR)
- goals (TEXT)

### training_sessions
- id (UUID)
- coach_id (FK)
- athlete_id (FK)
- title (VARCHAR)
- description (TEXT)
- type (VARCHAR)
- distance (DECIMAL)
- duration (INT)
- intensity (VARCHAR)
- start_date (TIMESTAMP)

### performance_records
- id (UUID)
- athlete_id (FK)
- session_id (FK)
- actual_distance (DECIMAL)
- actual_duration (INT)
- avg_heart_rate (INT)
- max_heart_rate (INT)
- notes (TEXT)
- recorded_at (TIMESTAMP)

### messages
- id (UUID)
- sender_id (FK)
- receiver_id (FK)
- content (TEXT)
- read (BOOLEAN)
- created_at (TIMESTAMP)

## 🔐 Authentification

La plateforme utilise JWT (JSON Web Tokens) pour l'authentification.

- Token stocké dans `localStorage`
- Automatiquement ajouté à chaque requête API
- Expiration : 7 jours

## 🎨 Interface Utilisateur

### Palette de Couleurs
- Primaire: `#007bff` (Bleu)
- Secondaire: `#667eea` (Violet)
- Succès: `#28a745` (Vert)
- Danger: `#dc3545` (Rouge)

### Composants
- Dashboard responsive avec grille
- Calendrier interactif
- Formulaires de saisie
- Cartes pour les données
- Navigation par onglets

## 📦 Structure du Projet

```
Projet coaching/
├── backend/
│   ├── src/
│   │   ├── database/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── types/
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   ├── styles/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## 🔄 Variables d'Environnement

### Backend (.env)
```
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coaching_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=7d
WS_PORT=3002
```

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:3001/api
```

## 🚧 Prochaines Étapes

- [ ] Intégration WebSocket pour les messages en temps réel
- [ ] Notifications push
- [ ] Import de données GPS (tracé de course)
- [ ] Graphiques avancés avec recharts
- [ ] Export de rapports PDF
- [ ] Mobile app native
- [ ] Intégration avec Strava, Garmin, etc.
- [ ] Paiements et abonnements

## 📝 Notes de Développement

### Développement Backend
```bash
cd backend
npm run dev
```

### Développement Frontend
```bash
cd frontend
npm run dev
```

### Build Production
```bash
# Backend
cd backend && npm run build

# Frontend
cd frontend && npm run build
```

## 🤝 Contribution

Les contributions sont les bienvenues !

## 📄 Licence

MIT

## 📞 Support

Pour toute question ou bug, veuillez ouvrir une issue.

---

**Développé pour révolutionner le coaching de course à pieds** 🏃‍♂️🏃‍♀️
