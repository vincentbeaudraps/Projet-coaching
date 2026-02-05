# 🚀 Guide de Démarrage Rapide - VB Coaching Platform

## ✅ État Actuel du Système

### Services Démarrés
- ✅ **Backend**: Running on http://localhost:3001
- ✅ **Frontend**: Running on http://localhost:5174
- ✅ **Database**: PostgreSQL (coaching_db) - Tables créées
- ✅ **Migration**: Tables `connected_platforms` et `sync_logs` appliquées

---

## 📋 Prochaines Étapes

### 1. Tester le Système de Base (Sans OAuth)

Vous pouvez déjà tester les fonctionnalités principales :

1. **Ouvrir l'application** : http://localhost:5174

2. **Créer un compte coach** :
   - Inscription avec email/password
   - Role: Coach

3. **Créer un compte athlète** :
   - Inscription avec email/password
   - Role: Athlète

4. **Workflow Coach** :
   - Se connecter en tant que coach
   - Ajouter un athlète (utiliser l'email de l'athlète créé)
   - Créer une séance d'entraînement pour cet athlète
   - Programmer la date de la séance

5. **Workflow Athlète** :
   - Se connecter en tant qu'athlète
   - Voir les séances programmées dans le calendrier gauche
   - **Tester l'import manuel** : Cliquer sur "📤 Importer GPX"
   - **Voir la page appareils** : Cliquer sur "🔗 Appareils" dans le header

---

### 2. Configurer OAuth (Recommandé : Strava d'abord)

#### Option A : Configuration Strava (Le Plus Simple)

1. **Créer une application Strava** :
   - Aller sur : https://www.strava.com/settings/api
   - Cliquer sur "Create & Manage Your App"
   - Remplir :
     - **Application Name** : VB Coaching
     - **Category** : Training
     - **Website** : http://localhost:5174
     - **Authorization Callback Domain** : localhost

2. **Récupérer les clés** :
   - Une fois créé, vous verrez `Client ID` et `Client Secret`

3. **Configurer le .env** :
   ```bash
   # Éditer backend/.env
   STRAVA_CLIENT_ID=votre_client_id_ici
   STRAVA_CLIENT_SECRET=votre_client_secret_ici
   ```

4. **Redémarrer le backend** :
   ```bash
   # Dans le terminal backend (Ctrl+C puis)
   npm run dev
   ```

5. **Tester la connexion** :
   - Se connecter en tant qu'athlète
   - Cliquer sur "🔗 Appareils"
   - Cliquer sur "Connecter" pour Strava
   - Autoriser l'application
   - Voir le statut "✓ Connecté"

#### Option B : Configuration Complète (Toutes les Plateformes)

Suivre le guide détaillé : `OAUTH_SETUP_GUIDE.md`

---

### 3. Tester la Synchronisation Complète

Une fois Strava configuré :

1. **Uploader une activité sur Strava** (via l'app mobile ou le site)

2. **Dans VB Coaching** :
   - Aller dans "🔗 Appareils"
   - Cliquer sur "Synchroniser" pour Strava
   - Voir l'activité apparaître dans le calendrier de droite

3. **Créer une séance d'entraînement** :
   - En tant que coach, créer une séance
   - L'athlète la verra dans son calendrier gauche
   - (Export vers Strava nécessite une configuration avancée)

---

## 🛠️ Commandes Utiles

### Vérifier l'état des services

```bash
# Backend
cd backend
npm run dev                  # Port 3001

# Frontend  
cd frontend
npm run dev                  # Port 5174

# Database
psql -U postgres -d coaching_db -c "SELECT * FROM connected_platforms;"
psql -U postgres -d coaching_db -c "SELECT * FROM sync_logs;"
```

### Réinitialiser la base de données

```bash
# Si vous voulez tout recommencer
psql -U postgres -d coaching_db -c "TRUNCATE users, athletes, training_sessions, completed_activities, connected_platforms, sync_logs CASCADE;"
```

---

## 📁 Structure des Fichiers Importants

```
Projet-coaching/
├── backend/
│   ├── .env                              # ⚙️ Configuration OAuth (MODIFIER ICI)
│   ├── src/
│   │   ├── routes/platforms.ts           # Routes OAuth et sync
│   │   ├── config/platforms.ts           # Config des plateformes
│   │   └── utils/platformSync.ts         # Logique push/pull
│   └── migrations/
│       └── add_connected_platforms.sql   # ✅ Appliqué
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── AthleteDashboard.tsx      # Dashboard double calendrier
│       │   ├── ConnectedDevicesPage.tsx  # Page connexion OAuth
│       │   └── OAuthCallbackPage.tsx     # Callback OAuth
│       └── services/api.ts               # API platformsService
│
├── OAUTH_SETUP_GUIDE.md                  # Guide détaillé OAuth
├── SYNC_SYSTEM_COMPLETE.md               # Doc technique complète
└── QUICK_START.md                        # Ce fichier
```

---

## 🎯 Scénarios de Test

### Scénario 1 : Workflow Coach → Athlète (Sans OAuth)

1. Login coach → Créer séance → Assigner à athlète
2. Login athlète → Voir séance dans calendrier gauche
3. Athlète importe GPX manuellement
4. Activité apparaît dans calendrier droit

### Scénario 2 : Import Manuel GPX

1. Login athlète
2. Cliquer "📤 Importer GPX"
3. Sélectionner un fichier `.gpx`, `.fit` ou `.tcx`
4. Voir l'activité dans le calendrier droit

### Scénario 3 : Connexion Strava (Après Config)

1. Login athlète
2. Cliquer "🔗 Appareils"
3. Cliquer "Connecter" pour Strava
4. Autoriser dans la popup OAuth
5. Voir "✓ Connecté"
6. Cliquer "Synchroniser"
7. Voir activités Strava dans calendrier droit

---

## ❓ Dépannage

### Le frontend ne démarre pas
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Le backend ne démarre pas
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Erreur "Cannot connect to database"
```bash
# Vérifier que PostgreSQL est démarré
brew services start postgresql@14

# Vérifier la connexion
psql -U postgres -d coaching_db -c "SELECT 1"
```

### Erreur OAuth "Invalid client"
- Vérifier que les clés dans `.env` sont correctes
- Vérifier que le `REDIRECT_URI` correspond exactement
- Redémarrer le backend après modification du `.env`

### Les activités ne s'affichent pas
```bash
# Vérifier les logs de sync
psql -U postgres -d coaching_db -c "SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 5;"
```

---

## 📚 Documentation Complémentaire

- **Configuration OAuth détaillée** : `OAUTH_SETUP_GUIDE.md`
- **Documentation technique** : `SYNC_SYSTEM_COMPLETE.md`
- **Guide de test** : `TEST_ATHLETE_DASHBOARD.md`
- **Index de la doc** : `INDEX_SYNC.md`

---

## 🎉 Prêt à Démarrer !

Votre plateforme VB Coaching est opérationnelle :

1. ✅ Frontend : http://localhost:5174
2. ✅ Backend : http://localhost:3001
3. ✅ Base de données : Configurée
4. ⏳ OAuth : À configurer selon vos besoins

**Commencez par tester sans OAuth, puis ajoutez Strava quand vous serez prêt !**

---

## 💡 Conseils

- **Démarrage rapide** : Testez d'abord l'import manuel GPX
- **OAuth progressif** : Commencez par Strava uniquement
- **Tests** : Utilisez 2 navigateurs (coach + athlète) ou mode incognito
- **Logs** : Consultez la console backend pour déboguer

**Bon coaching ! 🏃‍♂️💪**
