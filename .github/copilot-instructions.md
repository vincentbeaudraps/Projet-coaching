# Instructions de Configuration

Ce document décrit les étapes pour mettre en place et lancer la plateforme de coaching de course à pieds.

## Étapes Complétées

✅ Scaffolding du projet fullstack
- Structure frontend React + TypeScript + Vite
- Structure backend Node.js + Express + TypeScript
- Configuration des dépendances

✅ Configuration base de données PostgreSQL
- Schémas pour users, athletes, training_sessions, messages, performance_records
- Relations et contraintes
- UUID comme clés primaires

✅ API Backend RESTful
- Endpoints authentification (register, login)
- Endpoints gestion athlètes
- Endpoints gestion séances d'entraînement
- Endpoints messages
- Endpoints performances et analytics
- Middleware d'authentification JWT

✅ Interface Frontend
- Pages de login/register
- Dashboard coach avec tous les modules
- Dashboard athlète
- Composants : Calendrier, Formulaires, Listes
- Styles responsifs

## Prochaines Étapes

1. **Installation des dépendances**
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

2. **Configuration base de données**
   - Créer la base PostgreSQL
   - Configurer le fichier .env

3. **Lancer le développement**
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

4. **Améliorations futures**
   - WebSocket pour messages temps réel
   - Upload fichiers/images
   - Notifications
   - Intégration GPS
   - Export PDF
   - Tests unitaires et E2E
   - Docker/Kubernetes pour déploiement
