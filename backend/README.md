# Backend - Coach Running Platform

API REST complète pour la plateforme de coaching de course à pieds.

## Démarrage Rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Créer le fichier .env
cp .env.example .env

# 3. Configurer la base de données
# Modifier .env avec vos paramètres PostgreSQL

# 4. Lancer le serveur
npm run dev
```

Le serveur sera disponible à `http://localhost:3001`

## Scripts

- `npm run dev` - Démarrer le serveur en mode développement
- `npm run build` - Compiler TypeScript
- `npm start` - Lancer le serveur compilé
- `npm run db:migrate` - Exécuter les migrations de base de données

## Architecture

```
src/
├── database/
│   ├── connection.ts   # Connexion PostgreSQL
│   └── init.ts         # Initialisation des tables
├── routes/
│   ├── auth.ts         # Authentification
│   ├── athletes.ts     # Gestion des athlètes
│   ├── sessions.ts     # Gestion des séances
│   ├── messages.ts     # Messagerie
│   └── performance.ts  # Performance et analytics
├── middleware/
│   └── auth.ts         # Middleware d'authentification JWT
├── types/
│   └── index.ts        # Types TypeScript
└── index.ts            # Point d'entrée principal
```

## Endpoints

### Auth
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter

### Athletes
- `GET /api/athletes` - Lister les athlètes du coach
- `GET /api/athletes/:id` - Récupérer un athlète
- `POST /api/athletes` - Ajouter un athlète
- `PUT /api/athletes/:id` - Modifier un athlète

### Sessions d'entraînement
- `POST /api/sessions` - Créer une séance
- `GET /api/sessions` - Lister toutes les séances
- `GET /api/sessions/athlete/:athleteId` - Séances d'un athlète
- `PUT /api/sessions/:id` - Modifier une séance
- `DELETE /api/sessions/:id` - Supprimer une séance

### Performances
- `POST /api/performance` - Enregistrer une performance
- `GET /api/performance/athlete/:athleteId` - Historique
- `GET /api/performance/analytics/:athleteId` - Analytics

### Messages
- `POST /api/messages` - Envoyer un message
- `GET /api/messages/conversation/:userId` - Conversation
- `PUT /api/messages/read/:userId` - Marquer comme lu

## Base de Données

PostgreSQL est utilisé pour le stockage des données.

### Schéma

**users** - Utilisateurs (Coachs et Athlètes)
- id (UUID)
- email (VARCHAR UNIQUE)
- name (VARCHAR)
- password_hash (VARCHAR)
- role (coach | athlete)
- created_at (TIMESTAMP)

**athletes** - Profils des athlètes
- id (UUID)
- user_id (FK → users)
- coach_id (FK → users)
- age (INT)
- level (VARCHAR)
- goals (TEXT)

**training_sessions** - Séances d'entraînement
- id (UUID)
- coach_id (FK → users)
- athlete_id (FK → athletes)
- title (VARCHAR)
- description (TEXT)
- type (VARCHAR)
- distance (DECIMAL)
- duration (INT)
- intensity (VARCHAR)
- start_date (TIMESTAMP)

**performance_records** - Résultats des séances
- id (UUID)
- athlete_id (FK → athletes)
- session_id (FK → training_sessions)
- actual_distance (DECIMAL)
- actual_duration (INT)
- avg_heart_rate (INT)
- max_heart_rate (INT)
- notes (TEXT)
- recorded_at (TIMESTAMP)

**messages** - Messagerie
- id (UUID)
- sender_id (FK → users)
- receiver_id (FK → users)
- content (TEXT)
- read (BOOLEAN)
- created_at (TIMESTAMP)

## Configuration

### Variables d'environnement (.env)

```env
# Serveur
PORT=3001
NODE_ENV=development

# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=coaching_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=7d

# WebSocket
WS_PORT=3002
```

## Authentification

JWT (JSON Web Tokens) est utilisé pour l'authentification.

### Flux
1. Utilisateur se connecte avec email + mot de passe
2. Serveur valide et retourne un token JWT
3. Client stocke le token dans localStorage
4. Token est envoyé dans le header `Authorization: Bearer <token>`
5. Serveur valide le token pour chaque requête

### Protection des routes
```typescript
router.get('/athletes', authenticateToken, async (req, res) => {
  // req.userId et req.userRole sont disponibles
});
```

## Erreurs courantes

### Erreur de connexion DB
- Vérifier que PostgreSQL est running
- Vérifier les variables d'environnement .env
- Vérifier la base de données existe

### Erreur de token
- Token peut être expiré (7 jours)
- Token invalide ou corrompu
- Header Authorization mal formaté

## Déploiement

### Docker
```bash
docker-compose up
```

### Production
```bash
# Compiler
npm run build

# Lancer
npm start
```

## Monitoring

Le serveur log les erreurs et opérations importantes.

```bash
# Voir les logs
npm run dev
```

## Tests

À implémenter avec Jest/Mocha

```bash
npm test
```

## Support

Pour toute question ou bug, consultez le README principal du projet.
