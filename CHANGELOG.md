# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-02-05

### 🎉 Nouvelles Fonctionnalités Majeures

#### 📊 Système de Métriques Athlètes
- Gestion de 7 métriques physiologiques (FC Max, VMA, VO2 Max, Poids, etc.)
- Calcul automatique de 5 zones d'entraînement cardiaques (méthode Karvonen)
- Calcul de 5 allures d'entraînement basées sur la VMA
- Interface modal responsive avec visualisations temps réel
- Historique illimité des modifications avec notes
- Badges métriques sur cartes athlètes

#### 🏃 Constructeur de Séances Avancé (Session Builder)
- 6 templates pré-définis prêts à l'emploi
- Création modulaire par blocs (6 types disponibles)
- Paramètres détaillés : durée, distance, intensité, allure, FC
- Support des répétitions et récupération pour intervalles
- Estimations temps réel (durée/distance totale)
- Réorganisation intuitive des blocs (monter/descendre/dupliquer)

#### 🔄 Synchronisation Montres GPS
- Connexion OAuth Strava et Garmin Connect
- Import automatique des activités
- Webhook Strava pour synchronisation temps réel
- Upload manuel de fichiers GPX
- Gestion des tokens avec refresh automatique

#### 📅 Calendrier Double Vue
- Calendrier des séances planifiées avec codes couleur
- Calendrier des activités complétées
- Filtrage par athlète
- Modal enrichi style Strava pour les activités

#### 🎨 Refonte Interface Utilisateur
- Design professionnel VB Coaching (logo, branding)
- Header responsive avec navigation
- Page d'accueil, Tarifs, Témoignages
- Page profil athlète dédiée
- Animations et transitions fluides

#### 🔐 Système d'Invitations
- Génération de codes d'invitation uniques
- Gestion complète (créer/supprimer/consulter)
- Expiration configurable
- Attribution automatique au coach

#### 📊 Modal Activité Enrichi
- Interface 2 colonnes (style Strava)
- Statistiques principales agrandies
- Graphiques d'allure par kilomètre (barres colorées)
- Zones d'entraînement cardiaques visuelles
- Tableau de splits détaillé
- Feedback athlète (difficulté + ressenti)

### 🛠️ Améliorations Techniques

#### Backend
- Nouvelle table `athlete_metrics_history` pour historique
- Colonnes `blocks` et `notes` sur `training_sessions`
- Nouvelle table `connected_platforms` pour OAuth
- Nouvelle table `invitation_codes`
- Routes API : `/api/platforms/*`, `/api/invitations/*`, `/api/athletes/*/metrics*`
- Parser GPX amélioré (élévation lissée)
- Utilitaire d'export Garmin (.fit)

#### Frontend
- 8 nouveaux composants React
- 10 nouvelles pages
- Types TypeScript étendus
- Responsive design (desktop/tablet/mobile)
- Animations CSS avancées

#### Base de Données
- 5 nouvelles migrations SQL
- 3 nouvelles tables
- 12 nouvelles colonnes
- Index optimisés

### 🐛 Corrections de Bugs

- **Durée activités GPX** : Affichage correct (1h au lieu de 1min)
- **Profils athlètes** : Auto-création pour utilisateurs existants
- **Erreur ParsePace** : Ordre des hooks React corrigé
- **Élévation négative** : Algorithme de lissage implémenté
- **404 /api/athletes/me** : Endpoint corrigé

### 📚 Documentation

- Ajout de 8 documents de documentation détaillés
- Nettoyage : suppression de 40+ fichiers redondants
- Guides de démarrage rapide et tests

### 📦 Statistiques

- **~45 fichiers créés**
- **~20 fichiers modifiés**
- **~8000 lignes de code ajoutées**
- **~2000 lignes de documentation**

---

## [1.0.0] - 2026-01-15

### Première Version

- Dashboard coach et athlète
- Gestion de base des athlètes
- Création de séances simples
- Calendrier basique
- Authentification JWT
- Base de données PostgreSQL

---

**Légende**
- 🎉 Nouvelles fonctionnalités
- 🛠️ Améliorations
- 🐛 Corrections de bugs
- 📚 Documentation
- 🗑️ Suppressions
