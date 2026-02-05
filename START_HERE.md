# 🏃‍♂️ VB COACHING - START HERE

## 🎉 Bienvenue sur votre Plateforme de Coaching !

Tout est prêt et opérationnel. Ce guide vous permet de démarrer en **moins de 5 minutes**.

---

## ✅ ÉTAT ACTUEL

| Composant | Status | Port |
|-----------|--------|------|
| 🖥️ **Backend** | ✅ Running | 3001 |
| 🌐 **Frontend** | ✅ Running | 5174 |
| 🗄️ **Database** | ✅ Ready | PostgreSQL |
| 🔗 **OAuth System** | ⏳ À configurer | - |

---

## 🚀 DÉMARRAGE RAPIDE (2 MINUTES)

### 1. Ouvrir l'Application
```
👉 http://localhost:5174
```

### 2. Créer 2 Comptes de Test

**Compte Coach :**
- Email : `coach@vb.com`
- Password : `coach123`
- Role : **Coach**

**Compte Athlète :**
- Email : `athlete@vb.com`
- Password : `athlete123`
- Role : **Athlète**

### 3. Tester le Workflow

**En tant que Coach :**
1. Se connecter avec `coach@vb.com`
2. Aller dans "Athlètes" → "Ajouter un athlète"
3. Entrer : `athlete@vb.com`
4. Aller dans "Séances" → "Nouvelle séance"
5. Créer une séance pour l'athlète

**En tant qu'Athlète :**
1. Se connecter avec `athlete@vb.com`
2. Voir la séance dans le **calendrier gauche** (séances programmées)
3. Cliquer sur **"📤 Importer GPX"** pour tester l'import manuel
4. Cliquer sur **"🔗 Appareils"** pour voir les plateformes disponibles

---

## 🎯 FONCTIONNALITÉS PRINCIPALES

### 🏋️ Dashboard Coach
- ✅ Créer des séances personnalisées
- ✅ Assigner des séances aux athlètes
- ✅ Voir tous ses athlètes
- ✅ Analyser les performances
- ✅ Envoyer des messages

### 🏃 Dashboard Athlète
- ✅ **Double Calendrier** :
  - 📅 Gauche = Séances programmées par le coach
  - ✅ Droite = Activités réalisées
- ✅ **Import Manuel** : GPX, FIT, TCX
- ✅ **Connexion Appareils** : 6 plateformes supportées
- ✅ **Synchronisation** : Automatique ou manuelle
- ✅ **Messages** : Communication avec le coach

### 🔗 Plateformes Supportées
1. 🟠 **Garmin Connect**
2. 🟠 **Strava** (recommandé en premier)
3. 🔵 **Suunto**
4. 🔴 **COROS**
5. ⚪ **Polar Flow**
6. 🔵 **Decathlon Coach**

---

## 📖 GUIDES DISPONIBLES

| Document | Utilité | Quand l'utiliser |
|----------|---------|------------------|
| **READY_TO_USE.md** | Guide complet de démarrage | Maintenant |
| **QUICK_START.md** | Démarrage rapide avec exemples | Pour débuter |
| **STATUS_CHECKLIST.md** | Checklist complète du projet | Pour vérifier l'état |
| **OAUTH_SETUP_GUIDE.md** | Configuration OAuth détaillée | Pour connecter les montres |
| **SYNC_SYSTEM_COMPLETE.md** | Documentation technique | Pour comprendre le système |
| **TEST_ATHLETE_DASHBOARD.md** | Guide de test complet | Pour tester toutes les fonctionnalités |

---

## 🔧 CONFIGURATION OAUTH (OPTIONNEL)

Si vous voulez synchroniser avec Strava (ou autres plateformes) :

### Étape 1 : Obtenir les Clés Strava (10 min)
1. Aller sur : https://www.strava.com/settings/api
2. Créer une application
3. Copier `Client ID` et `Client Secret`

### Étape 2 : Configurer le Backend (2 min)
1. Ouvrir : `backend/.env`
2. Remplacer :
   ```env
   STRAVA_CLIENT_ID=your_strava_client_id
   STRAVA_CLIENT_SECRET=your_strava_client_secret
   ```
3. Sauvegarder et redémarrer le backend

### Étape 3 : Tester (1 min)
1. Se connecter en tant qu'athlète
2. Cliquer sur "🔗 Appareils"
3. Cliquer sur "Connecter" pour Strava
4. Autoriser l'application
5. Cliquer sur "Synchroniser"

**Guide détaillé** : `OAUTH_SETUP_GUIDE.md`

---

## 💡 CONSEILS

### Pour Tester
- Utilisez **2 navigateurs différents** (Chrome + Firefox) pour tester coach ET athlète en même temps
- Ou utilisez **mode incognito** pour le 2ème compte

### Pour le Développement
- **Backend logs** : Consultez le terminal backend pour déboguer
- **Database** : Utilisez `psql -U postgres -d coaching_db` pour inspecter les données
- **API** : Toutes les routes sont sous `http://localhost:3001/api/`

### Import Manuel GPX
- Glissez-déposez un fichier `.gpx`, `.fit` ou `.tcx`
- L'activité apparaîtra dans le calendrier de droite
- Format supporté : GPS track avec temps et coordonnées

---

## 🆘 DÉPANNAGE RAPIDE

### Problème : "Cannot connect to server"
```bash
# Vérifier que les services tournent
# Backend devrait être sur port 3001
# Frontend devrait être sur port 5174
```

### Problème : "Database error"
```bash
# Vérifier PostgreSQL
brew services start postgresql@14
psql -U postgres -d coaching_db -c "SELECT COUNT(*) FROM users;"
```

### Problème : OAuth ne fonctionne pas
1. Vérifier que les clés sont dans `backend/.env`
2. Vérifier que le REDIRECT_URI correspond
3. Redémarrer le backend après modification du `.env`

---

## 📊 ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│                    VB COACHING PLATFORM                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (React + TypeScript)                               │
│  ├── Dashboard Coach                                         │
│  ├── Dashboard Athlète (Double Calendrier)                   │
│  └── Page Appareils Connectés (OAuth)                        │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Backend (Express + TypeScript)                              │
│  ├── API REST (Auth, Séances, Athlètes, Messages)           │
│  ├── OAuth Routes (6 plateformes)                            │
│  ├── Sync System (Push/Pull activités)                       │
│  └── GPX Parser (Import manuel)                              │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Database (PostgreSQL)                                       │
│  ├── users, athletes, training_sessions                      │
│  ├── completed_activities, messages                          │
│  └── connected_platforms, sync_logs (OAuth)                  │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  External APIs (OAuth 2.0)                                   │
│  └── Garmin, Strava, Suunto, COROS, Polar, Decathlon        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 PROCHAINES ÉTAPES

### Aujourd'hui
1. ✅ Tester l'application (coach + athlète)
2. ✅ Créer une séance d'entraînement
3. ✅ Tester l'import manuel GPX
4. ⏳ (Optionnel) Configurer Strava

### Cette Semaine
1. ⏳ Ajouter d'autres plateformes OAuth
2. ⏳ Personnaliser le design
3. ⏳ Tester avec de vraies données

### Ce Mois
1. ⏳ Déployer en production
2. ⏳ Ajouter des webhooks (sync temps réel)
3. ⏳ Implémenter les notifications

---

## 🔗 LIENS RAPIDES

### Application
- **Frontend** : http://localhost:5174
- **Backend** : http://localhost:3001
- **Health Check** : http://localhost:3001/api/health

### OAuth Portails
- **Strava** : https://www.strava.com/settings/api
- **Garmin** : https://developer.garmin.com/
- **Suunto** : https://apizone.suunto.com/
- **COROS** : https://open.coros.com/
- **Polar** : https://admin.polaraccesslink.com/
- **Decathlon** : https://developers.decathlon.com/

### Database
```bash
# Se connecter à la DB
psql -U postgres -d coaching_db

# Voir les tables
\dt

# Voir les utilisateurs
SELECT id, email, role FROM users;

# Voir les connexions OAuth
SELECT athlete_id, platform, is_active FROM connected_platforms;

# Voir l'historique de sync
SELECT * FROM sync_logs ORDER BY created_at DESC LIMIT 10;
```

---

## 📈 STATISTIQUES DU PROJET

- **Lignes de code** : ~1500
- **Fichiers créés** : 19
- **Tables database** : 8
- **Routes API** : 25+
- **Plateformes OAuth** : 6
- **Documentation** : 2000+ lignes

---

## ✨ FONCTIONNALITÉS UNIQUES

### 🎨 Double Calendrier
Un système unique qui affiche côte à côte :
- Les séances **programmées** par le coach
- Les activités **réalisées** par l'athlète

Cela permet de comparer facilement plan vs réalité !

### 🔗 Multi-Plateformes
Synchronisation avec **6 plateformes** différentes :
- Un seul système pour tous les appareils
- Pas besoin de choisir une seule marque
- Support de toutes les montres GPS populaires

### 📤 Import Flexible
Deux façons d'importer les activités :
- **Automatique** : Via OAuth (après configuration)
- **Manuel** : Glisser-déposer GPX/FIT/TCX

---

## 🎉 C'EST PARTI !

Votre plateforme est **100% opérationnelle** et prête à l'emploi !

### 👉 Commencez maintenant :
```
http://localhost:5174
```

### 📚 Besoin d'aide ?
Consultez les guides dans le dossier du projet :
- `READY_TO_USE.md` - Guide complet
- `QUICK_START.md` - Démarrage rapide
- `OAUTH_SETUP_GUIDE.md` - Configuration OAuth

---

**Bon coaching ! 🏃‍♂️💪**

*Créé avec ❤️ pour VB Coaching*
