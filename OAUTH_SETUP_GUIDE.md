# Guide de Configuration des Plateformes OAuth

Ce guide vous explique comment obtenir les clés API pour chaque plateforme supportée.

## 📋 Vue d'ensemble

VB Coaching peut se connecter automatiquement à 6 plateformes :
- ✅ Garmin Connect
- ✅ Strava
- ✅ Suunto
- ✅ COROS
- ✅ Polar Flow
- ✅ Decathlon Coach

---

## 🟢 1. Garmin Connect

### Inscription Développeur
1. Allez sur : https://developer.garmin.com/
2. Créez un compte développeur Garmin
3. Acceptez les conditions d'utilisation

### Création de l'Application
1. Allez dans **Dashboard** > **Add Application**
2. Remplissez les informations :
   - **App Name** : VB Coaching
   - **Application Type** : Web
   - **Description** : Plateforme de coaching sportif
   - **Redirect URI** : `http://localhost:3000/oauth/garmin/callback`
   - **Scopes** : `ACTIVITY_IMPORT`, `ACTIVITY_EXPORT`

3. Notez vos identifiants :
   ```
   Consumer Key (Client ID)
   Consumer Secret (Client Secret)
   ```

### Configuration .env
```bash
GARMIN_CLIENT_ID=votre_consumer_key
GARMIN_CLIENT_SECRET=votre_consumer_secret
GARMIN_REDIRECT_URI=http://localhost:3000/oauth/garmin/callback
```

### Liens Utiles
- Documentation API : https://developer.garmin.com/gc-developer-program/overview/
- Console : https://developer.garmin.com/console

---

## 🟠 2. Strava

### Inscription Développeur
1. Allez sur : https://www.strava.com/settings/api
2. Connectez-vous avec votre compte Strava

### Création de l'Application
1. Cliquez sur **Create New App**
2. Remplissez les informations :
   - **Application Name** : VB Coaching
   - **Category** : Training
   - **Club** : (optionnel)
   - **Website** : http://localhost:3000
   - **Authorization Callback Domain** : localhost
   - **Authorization Callback URL** : `http://localhost:3000/oauth/strava/callback`

3. Notez vos identifiants :
   ```
   Client ID
   Client Secret
   ```

### Configuration .env
```bash
STRAVA_CLIENT_ID=votre_client_id
STRAVA_CLIENT_SECRET=votre_client_secret
STRAVA_REDIRECT_URI=http://localhost:3000/oauth/strava/callback
```

### Liens Utiles
- Documentation API : https://developers.strava.com/docs/getting-started/
- Playground : https://developers.strava.com/playground/

---

## 🔴 3. Suunto

### Inscription Développeur
1. Allez sur : https://apizone.suunto.com/
2. Créez un compte développeur
3. Acceptez les conditions

### Création de l'Application
1. Allez dans **My Applications** > **Create New Application**
2. Remplissez :
   - **Name** : VB Coaching
   - **Description** : Coaching platform
   - **Redirect URI** : `http://localhost:3000/oauth/suunto/callback`
   - **Scopes** : `workout`, `activity`

3. Notez vos identifiants :
   ```
   Client ID
   Client Secret
   ```

### Configuration .env
```bash
SUUNTO_CLIENT_ID=votre_client_id
SUUNTO_CLIENT_SECRET=votre_client_secret
SUUNTO_REDIRECT_URI=http://localhost:3000/oauth/suunto/callback
```

### Liens Utiles
- Documentation : https://apizone.suunto.com/getting-started
- API Explorer : https://apizone.suunto.com/api-explorer

---

## ⚪ 4. COROS

### Inscription Développeur
1. Allez sur : https://open.coros.com/
2. Créez un compte développeur COROS
3. Envoyez une demande d'accès API (peut prendre quelques jours)

### Création de l'Application
1. Une fois approuvé, allez dans **Applications**
2. Créez une nouvelle application :
   - **Name** : VB Coaching
   - **Type** : Web Application
   - **Redirect URI** : `http://localhost:3000/oauth/coros/callback`
   - **Permissions** : Training Write, Activity Read

3. Notez vos identifiants :
   ```
   Client ID
   Client Secret
   ```

### Configuration .env
```bash
COROS_CLIENT_ID=votre_client_id
COROS_CLIENT_SECRET=votre_client_secret
COROS_REDIRECT_URI=http://localhost:3000/oauth/coros/callback
```

### Notes
⚠️ L'API COROS nécessite une approbation manuelle. Comptez 3-7 jours ouvrés.

### Liens Utiles
- Documentation : https://open.coros.com/documentation
- Developer Portal : https://open.coros.com/console

---

## 🔵 5. Polar Flow

### Inscription Développeur
1. Allez sur : https://admin.polaraccesslink.com/
2. Créez un compte Polar AccessLink
3. Lisez la documentation

### Création de l'Application
1. Contactez Polar pour obtenir l'accès API : https://www.polar.com/accesslink-api/#contact-form
2. Remplissez le formulaire :
   - **Company Name** : Votre entreprise
   - **Application Name** : VB Coaching
   - **Description** : Plateforme de coaching sportif
   - **Redirect URI** : `http://localhost:3000/oauth/polar/callback`

3. Polar vous enverra vos identifiants par email (peut prendre 1-2 semaines)

### Configuration .env
```bash
POLAR_CLIENT_ID=votre_client_id
POLAR_CLIENT_SECRET=votre_client_secret
POLAR_REDIRECT_URI=http://localhost:3000/oauth/polar/callback
```

### Notes
⚠️ Polar nécessite une validation manuelle. Le processus peut être long.

### Liens Utiles
- Documentation : https://www.polar.com/accesslink-api/
- API Reference : https://www.polar.com/accesslink-api/#api-documentation

---

## 🔵 6. Decathlon Coach

### Inscription Développeur
1. Allez sur : https://developers.decathlon.com/
2. Créez un compte développeur Decathlon
3. Acceptez les conditions

### Création de l'Application
1. Allez dans **My Applications** > **Create Application**
2. Remplissez :
   - **Application Name** : VB Coaching
   - **Description** : Platform for sports coaching
   - **Redirect URI** : `http://localhost:3000/oauth/decathlon/callback`
   - **Scopes** : `activities`, `workouts`

3. Notez vos identifiants :
   ```
   Client ID
   Client Secret
   ```

### Configuration .env
```bash
DECATHLON_CLIENT_ID=votre_client_id
DECATHLON_CLIENT_SECRET=votre_client_secret
DECATHLON_REDIRECT_URI=http://localhost:3000/oauth/decathlon/callback
```

### Liens Utiles
- Documentation : https://developers.decathlon.com/products/sport-tracking-data
- Developer Portal : https://developers.decathlon.com/console

---

## 🚀 Mise en Production

### Changement des URLs de Redirection

Pour la production, mettez à jour les Redirect URIs dans chaque plateforme :

```bash
# Développement
http://localhost:3000/oauth/{platform}/callback

# Production
https://votre-domaine.com/oauth/{platform}/callback
```

### Vérification de Configuration

Avant de lancer, vérifiez que toutes les variables sont configurées :

```bash
cd backend
npm run check-env  # Si vous créez ce script
```

---

## 🔐 Sécurité

### Bonnes Pratiques

1. **Ne JAMAIS commiter les clés API** dans Git
2. Utilisez des variables d'environnement
3. Ajoutez `.env` dans `.gitignore`
4. Utilisez un gestionnaire de secrets en production (AWS Secrets Manager, Azure Key Vault, etc.)

### Protection CSRF

Le système utilise des tokens `state` aléatoires pour prévenir les attaques CSRF.

### Refresh Tokens

Les tokens d'accès sont automatiquement renouvelés avant expiration.

---

## 📊 Tableau Récapitulatif

| Plateforme | Délai d'approbation | Difficulté | Documentation |
|------------|---------------------|------------|---------------|
| Strava | Instantané | ⭐ Facile | Excellente |
| Garmin | 1-2 jours | ⭐⭐ Moyenne | Bonne |
| Suunto | 2-3 jours | ⭐⭐ Moyenne | Moyenne |
| Decathlon | Instantané | ⭐ Facile | Bonne |
| COROS | 3-7 jours | ⭐⭐⭐ Difficile | Moyenne |
| Polar | 1-2 semaines | ⭐⭐⭐⭐ Très difficile | Complète |

---

## ✅ Checklist Finale

- [ ] Toutes les clés API obtenues
- [ ] Fichier `.env` configuré
- [ ] Redirect URIs enregistrés
- [ ] Base de données migrée (`connected_platforms` table)
- [ ] Backend redémarré
- [ ] Tests de connexion réussis

---

## 🆘 Support

En cas de problème :
1. Vérifiez les logs backend : `cd backend && npm run dev`
2. Vérifiez la console navigateur (F12)
3. Consultez la documentation de la plateforme
4. Contactez le support développeur de la plateforme

---

**Prêt à connecter vos athlètes ?** 🚀
