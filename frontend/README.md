# Frontend - Coach Running Platform

Interface React pour la plateforme de coaching de course à pieds.

## Démarrage Rapide

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer le serveur de développement
npm run dev
```

L'application sera disponible à `http://localhost:5173`

## Scripts

- `npm run dev` - Démarrer le serveur de développement
- `npm run build` - Compiler pour la production
- `npm run preview` - Prévisualiser la build de production
- `npm run lint` - Vérifier la qualité du code

## Architecture

```
src/
├── components/
│   ├── Calendar.tsx      # Calendrier des séances
│   ├── SessionForm.tsx   # Formulaire de création de séance
│   ├── AthleteList.tsx   # Liste des athlètes
│   └── Dashboard.tsx     # Vue d'ensemble
├── pages/
│   ├── LoginPage.tsx     # Page de connexion
│   ├── RegisterPage.tsx  # Page d'inscription
│   ├── CoachDashboard.tsx    # Dashboard du coach
│   └── AthleteDashboard.tsx  # Dashboard de l'athlète
├── services/
│   └── api.ts            # Client Axios + endpoints API
├── store/
│   └── authStore.ts      # Store Zustand pour l'auth
├── styles/
│   ├── Auth.css          # Styles des pages d'auth
│   └── Dashboard.css     # Styles du dashboard
├── types/
│   └── index.ts          # Types TypeScript
├── App.tsx               # Composant root
└── main.tsx              # Point d'entrée
```

## Technologies

- **React 18** - Framework UI
- **TypeScript** - Typage statique
- **Vite** - Build tool
- **React Router v6** - Routage
- **Axios** - Client HTTP
- **Zustand** - State management
- **CSS** - Styling

## Authentification

### Flux
1. Utilisateur remplit formulaire login/register
2. Données envoyées au backend API
3. Si succès, token JWT stocké dans localStorage
4. Token automatiquement envoyé avec chaque requête API

### Protected Routes
```typescript
function ProtectedRoute({ children }) {
  const user = useAuthStore(state => state.user);
  return user ? children : <Navigate to="/login" />;
}
```

## État Global (Zustand)

### Auth Store
```typescript
const { user, token, login, logout } = useAuthStore();

// Login
login(userData, token);

// Logout
logout();
```

## API Service

```typescript
import { athletesService, sessionsService } from '@/services/api';

// Exemples
await athletesService.getAll();
await sessionsService.create(sessionData);
await performanceService.getAnalytics(athleteId);
```

## Composants Principaux

### Calendar
- Affichage du mois courant
- Indicateurs pour jours avec séances
- Hover pour voir détails

### SessionForm
- Formulaire de création de séance
- Sélection athlète, titre, type, distance, durée, intensité, date
- Validation basique

### AthleteList
- Grille d'affichage des athlètes
- Info : nom, email, âge, level, goals

### Dashboard
- Statistiques : athlètes, séances, séances à venir, séances du jour
- Cartes pour chaque stat

## Pages

### LoginPage
- Form email + password
- Submit envoie requête /auth/login
- Stocke token et user en localStorage
- Redirige vers /dashboard

### RegisterPage
- Form email + name + password + role
- Submit envoie requête /auth/register
- Choisir Coach ou Athlete
- Même flux que login après succès

### CoachDashboard
- 4 onglets : Overview, Calendar, Athletes, Sessions
- Overview : cartes de stats
- Calendar : vue calendrier des séances
- Athletes : liste des athlètes gérés
- Sessions : création de séances + liste

### AthleteDashboard
- 3 onglets : Sessions, Performance, Messages
- Sessions : séances assignées
- Performance : historique des enregistrements
- Messages : (À implémenter)

## Styles

### Palette
- Primaire : #007bff (Bleu)
- Secondaire : #667eea (Violet)
- Succès : #28a745 (Vert)
- Danger : #dc3545 (Rouge)
- Background : #f5f5f5 (Gris clair)

### Responsive
- Grid avec minmax pour adaptativité
- Flexbox pour layouts
- Media queries (à ajouter pour mobile)

## Développement

### Ajouter une nouvelle page
1. Créer fichier dans `src/pages/MaPage.tsx`
2. Ajouter route dans `App.tsx`
3. Créer styles si nécessaire

### Ajouter un nouveau service
1. Ajouter fonction dans `src/services/api.ts`
2. Exporter la fonction

### Ajouter un composant
1. Créer fichier dans `src/components/MonComposant.tsx`
2. Importer et utiliser dans pages/composants

## Configuration

### .env.local
```env
VITE_API_URL=http://localhost:3001/api
```

### vite.config.ts
```typescript
server: {
  proxy: {
    '/api': 'http://localhost:3001'
  }
}
```

## Build & Déploiement

### Build
```bash
npm run build
```

Génère `dist/` prêt pour production.

### Preview
```bash
npm run preview
```

Teste la build de production localement.

### Docker
```bash
docker build -t coaching-frontend .
docker run -p 5173:5173 coaching-frontend
```

## Prochaines Étapes

- [ ] Ajouter graphiques recharts
- [ ] Messagerie temps réel WebSocket
- [ ] Upload fichiers/images
- [ ] Export PDF
- [ ] Notifications toast
- [ ] Mode dark
- [ ] Mobile responsif amélioré
- [ ] Tests unitaires (Vitest)
- [ ] Tests E2E (Cypress/Playwright)

## Troubleshooting

### CORS Error
- Vérifier que backend sur port 3001
- Vérifier corsOptions dans backend

### 404 Not Found
- Vérifier token JWT valide
- Vérifier backend running
- Vérifier URL correcte

### Blanc après build
- Vérifier publicDir dans vite.config.ts
- Vérifier structure des assets

## Support

Consultez le README principal du projet pour plus d'infos.
