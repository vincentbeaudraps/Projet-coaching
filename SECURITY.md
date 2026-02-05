# 🔒 Système de Sécurité et Rôles

## Vue d'ensemble

La plateforme Coach Running utilise un système de rôles pour contrôler l'accès aux différentes fonctionnalités.

## 🎭 Rôles

### 1. Athlète (athlete)
- **Création de compte** : Via la page d'inscription publique `/register`
- **Accès** :
  - ✅ Tableau de bord athlète
  - ✅ Voir ses séances d'entraînement
  - ✅ Enregistrer ses performances
  - ✅ Messagerie avec son coach
  - ❌ Gestion d'autres athlètes
  - ❌ Création de séances pour d'autres
  - ❌ Accès au dashboard coach

### 2. Coach (coach)
- **Création de compte** : Uniquement via méthodes sécurisées (voir COACH_SETUP.md)
- **Accès** :
  - ✅ Tableau de bord coach
  - ✅ Gestion de tous ses athlètes
  - ✅ Création et modification de séances
  - ✅ Consultation des performances
  - ✅ Messagerie avec tous ses athlètes
  - ✅ Analytics et statistiques

## 🛡️ Protection des Routes

### Frontend (React)

#### Routes Publiques
- `/login` - Connexion
- `/register` - Inscription (crée automatiquement un athlète)

#### Routes Protégées
- `/dashboard` - Redirige vers le bon dashboard selon le rôle
- `/coach/*` - **Accessible uniquement aux coachs**

#### Composants de Protection

```tsx
// Protège toute route authentifiée
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Protège les routes coaches uniquement
<CoachOnlyRoute>
  <CoachDashboard />
</CoachOnlyRoute>
```

### Backend (API)

#### Routes Publiques
- `POST /api/auth/register` - Crée automatiquement un compte athlète
- `POST /api/auth/login` - Authentification

#### Routes Protégées (JWT)
- Toutes les autres routes nécessitent un token JWT valide
- Le middleware `auth.ts` vérifie l'authenticité du token

## 🔐 Flux de Sécurité

### Inscription d'un Athlète
```
1. Utilisateur remplit le formulaire /register
2. Frontend envoie : { email, name, password }
3. Backend crée automatiquement avec role='athlete'
4. JWT généré avec { id, role: 'athlete' }
5. Redirection vers /dashboard (vue athlète)
```

### Tentative d'Accès à une Route Coach par un Athlète
```
1. Athlète essaie d'accéder à /coach/*
2. Composant CoachOnlyRoute vérifie le rôle
3. Si role !== 'coach' → Redirection vers /dashboard
4. L'athlète reste dans son espace
```

### Création d'un Coach
```
1. Admin exécute: node create-coach.js
2. Script demande: nom, email, password
3. Création directe en base avec role='coach'
4. Coach peut se connecter via /login
5. Accès complet au dashboard coach
```

## 🚨 Mesures de Sécurité

### ✅ Implémentées

1. **Séparation des rôles** :
   - Pas de sélecteur de rôle dans l'inscription
   - Attribution automatique du rôle athlète

2. **Protection des routes frontend** :
   - Composant `CoachOnlyRoute`
   - Redirection automatique selon le rôle

3. **Validation côté serveur** :
   - JWT avec rôle inclus dans le payload
   - Middleware d'authentification

4. **Hashage des mots de passe** :
   - Bcrypt avec 10 rounds de sel

5. **Script de création coach sécurisé** :
   - Accès direct à la base de données
   - Validation des données

### 🔄 À Améliorer (Recommandations)

1. **Middleware de rôle côté backend** :
   ```typescript
   // middleware/roleCheck.ts
   export const requireCoach = (req, res, next) => {
     if (req.user.role !== 'coach') {
       return res.status(403).json({ message: 'Forbidden: Coach access required' });
     }
     next();
   };
   ```

2. **Route admin pour création de coachs** :
   ```typescript
   // Nécessite un super-admin
   router.post('/admin/coaches', requireAdmin, createCoach);
   ```

3. **Audit logs** :
   - Logger les tentatives d'accès non autorisées
   - Tracer les actions sensibles

4. **Rate limiting** :
   - Limiter les tentatives de connexion
   - Prévenir les attaques par force brute

5. **Validation d'email** :
   - Confirmer l'email avant activation
   - Prévenir les inscriptions frauduleuses

## 📊 Matrice des Permissions

| Fonctionnalité | Athlète | Coach |
|----------------|---------|-------|
| S'inscrire | ✅ | ❌ |
| Se connecter | ✅ | ✅ |
| Voir son profil | ✅ | ✅ |
| Voir ses séances | ✅ | ✅ |
| Créer des séances | ❌ | ✅ |
| Voir tous les athlètes | ❌ | ✅ |
| Modifier un athlète | ❌ | ✅ |
| Enregistrer performances | ✅ | ✅ |
| Voir analytics globales | ❌ | ✅ |
| Envoyer messages | ✅ | ✅ |

## 🔍 Vérification

### Tester la sécurité

```bash
# 1. Créer un compte athlète via /register
# 2. Se connecter
# 3. Essayer d'accéder à /coach/* → Devrait rediriger vers /dashboard

# 4. Créer un compte coach
cd backend
node create-coach.js

# 5. Se connecter avec le compte coach
# 6. Vérifier l'accès complet au dashboard coach
```

## 📝 Notes Importantes

⚠️ **Jamais** exposer la fonctionnalité de création de coach via l'interface publique
⚠️ Toujours valider le rôle côté serveur (ne pas se fier au frontend)
⚠️ Utiliser HTTPS en production
⚠️ Renouveler régulièrement le JWT_SECRET
⚠️ Implémenter une politique de mots de passe forts
