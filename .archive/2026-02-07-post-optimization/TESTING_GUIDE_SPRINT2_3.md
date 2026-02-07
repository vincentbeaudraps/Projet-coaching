# 🧪 GUIDE DE TEST - SPRINTS 2 & 3

**Date** : 6 février 2026  
**Version** : 1.0  
**Durée estimée** : 30-45 minutes

---

## 🎯 OBJECTIF

Tester toutes les fonctionnalités implémentées dans les Sprints 2 et 3 :
- ✅ Export PDF (3 types)
- ✅ Feedback post-séance
- ✅ Objectifs
- ✅ Plans d'entraînement

---

## 🚀 PRÉPARATION

### 1. Lancer l'application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 2. Se connecter

- **Coach** : `coach@test.com` / `password123`
- **Athlète** : `athlete@test.com` / `password123`

---

## 📄 TEST 1: EXPORT PDF (Sprint 2)

### Prérequis
- Avoir un athlète avec quelques séances et activités

### Étapes

1. **Se connecter en tant que Coach**

2. **Aller sur le dashboard Coach**

3. **Tester Export Bilan Hebdomadaire** :
   - Cliquer sur "Exporter PDF" (menu dropdown)
   - Sélectionner "📊 Bilan Hebdomadaire"
   - Attendre génération
   - Vérifier le PDF téléchargé:
     - ✅ Header violet avec titre
     - ✅ Nom de l'athlète
     - ✅ 4 boxes statistiques (distance, temps, séances, allure)
     - ✅ Tableau activités de la semaine
     - ✅ Tableau séances planifiées
     - ✅ Footer avec date et numéro page

4. **Tester Export Fiche Athlète** :
   - Cliquer sur "Exporter PDF" → "👤 Fiche Athlète"
   - Vérifier le PDF:
     - ✅ Header violet avec nom athlète
     - ✅ Infos personnelles (âge, VMA, FC max, poids, taille)
     - ✅ 4 boxes stats globales
     - ✅ Tableau 10 dernières activités
     - ✅ Footer avec date

5. **Tester Export Plan d'Entraînement** :
   - Cliquer sur "Exporter PDF" → "📅 Plan d'Entraînement"
   - Vérifier le PDF:
     - ✅ Header vert
     - ✅ Dates début → fin
     - ✅ Objectif (si renseigné)
     - ✅ Tableau toutes les séances
     - ✅ Footer avec date

### Résultats Attendus

✅ 3 fichiers PDF générés:
- `rapport_semaine_X_NomAthlete.pdf`
- `fiche_athlete_NomAthlete.pdf`
- `plan_entrainement_NomAthlete_2026-XX-XX.pdf`

### Critères de Succès
- [ ] PDFs téléchargés sans erreur
- [ ] Design professionnel (headers colorés, boxes)
- [ ] Données correctes affichées
- [ ] Pagination fonctionne si > 1 page
- [ ] Footer présent sur toutes les pages

---

## 💬 TEST 2: FEEDBACK POST-SÉANCE (Sprint 2)

### Prérequis
- Avoir un athlète avec une séance planifiée

### Étapes

1. **Se connecter en tant qu'Athlète**

2. **Aller sur Dashboard Athlète**

3. **Trouver une séance à compléter**
   - Chercher une séance future ou passée

4. **Soumettre Feedback** :
   - Cliquer sur "Ajouter Feedback" (ou icône 💬)
   - Modal s'ouvre

5. **Remplir le formulaire** :
   - ⭐ **Ressenti général** : Cliquer 4 étoiles
     - Vérifier label change : "Bon"
   - ⭐ **Difficulté perçue** : Cliquer 3 étoiles
     - Vérifier label : "Moyen"
   - ⭐ **Niveau de fatigue** : Cliquer 5 étoiles
     - Vérifier label : "Excellent"

6. **Ajouter données performance** (optionnel) :
   - Distance: `10.5` km
   - Durée: `50` min
   - FC moyenne: `155` bpm
   - Allure moyenne: `4'45/km`

7. **Ajouter notes** :
   ```
   Très bonne séance ! Météo parfaite. 
   Légère douleur genou droit à 8km mais passée rapidement.
   ```

8. **Envoyer** :
   - Cliquer "Envoyer le feedback"
   - Vérifier message succès
   - Modal se ferme

9. **Vérifier notification Coach** :
   - Se déconnecter
   - Se connecter en tant que Coach
   - Vérifier cloche notifications (badge rouge)
   - Ouvrir dropdown : voir "💬 Nouveau feedback reçu"

10. **Coach commente le feedback** :
    - Aller sur la séance concernée
    - Ouvrir feedback (icône 💬)
    - Voir les 3 ratings + notes athlète
    - Ajouter commentaire coach :
      ```
      Excellent travail ! Continue comme ça.
      Surveille le genou, on adaptera si besoin.
      ```
    - Enregistrer

11. **Vérifier notification Athlète** :
    - Se reconnecter en tant qu'Athlète
    - Vérifier cloche : "💬 Commentaire du coach"
    - Ouvrir feedback : voir commentaire coach

### Résultats Attendus

✅ Feedback créé avec succès  
✅ Ratings affichés avec étoiles dorées  
✅ Labels dynamiques corrects  
✅ Données performance enregistrées  
✅ Notes athlète visibles  
✅ 2 notifications envoyées (coach + athlète)  
✅ Commentaire coach visible côté athlète

### Critères de Succès
- [ ] Modal fullscreen responsive
- [ ] Étoiles interactives (hover effect)
- [ ] Validation: 3 ratings obligatoires
- [ ] Données optionnelles acceptées
- [ ] Textarea notes scrollable
- [ ] Notifications reçues des 2 côtés
- [ ] Feedback peut être mis à jour

---

## 🎯 TEST 3: OBJECTIFS (Sprint 3)

### Étapes

1. **Se connecter en tant que Coach**

2. **Créer un objectif** :

   **Via API** (Terminal):
   ```bash
   curl -X POST http://localhost:3000/api/goals \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "athleteId": "ATHLETE_ID",
       "title": "Marathon de Paris 2026",
       "description": "Objectif sub 3h30",
       "goalType": "race",
       "targetValue": "3:30:00",
       "targetDate": "2026-04-12",
       "priority": 5,
       "raceName": "Marathon de Paris",
       "raceDistance": 42.195,
       "raceLocation": "Paris, France"
     }'
   ```

   **Via Postman/Interface** :
   - Endpoint: `POST /api/goals`
   - Body: voir ci-dessus
   - Vérifier réponse 201

3. **Lister les objectifs** :
   ```bash
   curl http://localhost:3000/api/goals/athlete/ATHLETE_ID \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   - Vérifier objectif créé apparaît
   - Vérifier tous les champs

4. **Mettre à jour progression** :
   ```bash
   curl -X PATCH http://localhost:3000/api/goals/GOAL_ID \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"progress": 60}'
   ```
   - Vérifier progression mise à jour

5. **Marquer complété** :
   ```bash
   curl -X PATCH http://localhost:3000/api/goals/GOAL_ID \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"status": "completed"}'
   ```
   - Vérifier notification athlète : "🎉 Objectif atteint !"

6. **Statistiques objectifs** :
   ```bash
   curl http://localhost:3000/api/goals/stats/athlete/ATHLETE_ID \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   - Vérifier:
     - `totalGoals`
     - `activeGoals`
     - `completedGoals`
     - `avgProgress`
     - `overdueGoals`

### Résultats Attendus

✅ Objectif créé avec ID  
✅ Tous les champs enregistrés (race, distance, lieu)  
✅ Progression 0-100%  
✅ Statut modifiable  
✅ Notification envoyée si complété  
✅ Stats calculées correctement

### Critères de Succès
- [ ] CRUD complet fonctionne
- [ ] Validation types objectifs
- [ ] Priorité 1-5 respectée
- [ ] Progress 0-100% validé
- [ ] Association athlete_id + coach_id
- [ ] Notifications objectif atteint

---

## 📅 TEST 4: PLANS D'ENTRAÎNEMENT (Sprint 3)

### Test 4.1: Création Manuelle

1. **Créer un plan manuel** :
   ```bash
   curl -X POST http://localhost:3000/api/training-plans \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "athleteId": "ATHLETE_ID",
       "goalId": "GOAL_ID",
       "name": "Préparation Marathon Paris",
       "description": "Plan 16 semaines",
       "startDate": "2026-01-06",
       "endDate": "2026-04-28",
       "planType": "marathon",
       "weeklyVolumeProgression": [30,33,36,40,44,48,52,56,60,64,68,72,70,60,50,40],
       "notes": "Progression prudente avec taper final"
     }'
   ```

2. **Vérifier le plan** :
   - Réponse 201
   - `weeksTotal` calculé automatiquement (16)
   - `weeklyVolumeProgression` stocké en JSON
   - Notification athlète : "📅 Nouveau plan d'entraînement"

### Test 4.2: Génération Automatique

1. **Générer un plan auto** :
   ```bash
   curl -X POST http://localhost:3000/api/training-plans/generate \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "athleteId": "ATHLETE_ID",
       "planType": "marathon",
       "goalId": "GOAL_ID",
       "startDate": "2026-03-01",
       "raceDate": "2026-06-15",
       "currentWeeklyVolume": 30,
       "targetWeeklyVolume": 80
     }'
   ```

2. **Vérifier la réponse** :
   ```json
   {
     "plan": {
       "id": "...",
       "name": "Plan marathon - NomAthlete",
       "weeksTotal": 15,
       "weeklyVolumeProgression": "[30,35,40,45,50,55,60,65,70,75,80,75,70,65,56]",
       ...
     },
     "weeklyVolumes": [30,35,40,45,50,55,60,65,70,75,80,75,70,65,56]
   }
   ```

3. **Analyser la progression** :
   - ✅ Phase build (semaines 1-13) : +5 km/semaine
   - ✅ Pic à semaine 11 : 80 km
   - ✅ Phase taper (semaines 13-15) : -30% progressif
   - ✅ Semaine course : 56 km

### Test 4.3: Lister et Mettre à Jour

1. **Lister les plans** :
   ```bash
   curl http://localhost:3000/api/training-plans/athlete/ATHLETE_ID \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

2. **Mettre à jour progression** :
   ```bash
   curl -X PATCH http://localhost:3000/api/training-plans/PLAN_ID \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"weeksCompleted": 5}'
   ```

3. **Récupérer séances du plan** :
   ```bash
   curl http://localhost:3000/api/training-plans/PLAN_ID/sessions \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   - Vérifier: séances entre `start_date` et `end_date`

### Résultats Attendus

✅ Plan créé (manuel ou auto)  
✅ Durée calculée automatiquement  
✅ Progression JSON valide  
✅ Générateur respecte algorithme (build + taper)  
✅ Association avec objectif  
✅ Séances filtrées par dates plan

### Critères de Succès
- [ ] CRUD complet plans
- [ ] Calcul `weeksTotal` automatique
- [ ] JSON `weeklyVolumeProgression` valide
- [ ] Générateur: pic à 85% + taper -30%
- [ ] Association goal_id fonctionne
- [ ] Notifications envoyées

---

## 🧪 TEST 5: SCÉNARIO COMPLET

### Scénario: Coach prépare athlète pour marathon

**Temps estimé** : 10-15 minutes

1. **Coach crée un objectif** :
   - Type: Race
   - Marathon de Paris, 42.195 km
   - Date: 12 avril 2026
   - Priorité: 5/5

2. **Coach génère un plan automatique** :
   - Type: Marathon
   - Départ: 1er mars 2026
   - Course: 12 avril 2026
   - Volume actuel: 40 km/semaine
   - Volume cible: 90 km/semaine
   - ✅ Vérifie: 6 semaines générées avec progression

3. **Coach crée des séances manuelles** :
   - Semaine 1: 3 séances (endurance, fractionné, sortie longue)
   - Associées au plan

4. **Athlète complète une séance** :
   - Va sur dashboard
   - Clique "Compléter" sur séance
   - Soumet feedback:
     - Ressenti: 4/5
     - Difficulté: 3/5
     - Fatigue: 2/5
     - Notes: "Super séance, en forme !"

5. **Coach consulte feedback** :
   - Reçoit notification
   - Lit feedback
   - Commente: "Continue comme ça !"

6. **Coach export bilan hebdo** :
   - Exporte PDF
   - Vérifie: séance complétée apparaît

7. **Coach met à jour progression** :
   - Objectif: 20% progression
   - Plan: 1 semaine complétée

### Résultat Final

✅ Objectif créé et lié  
✅ Plan généré avec 6 semaines  
✅ Séances créées  
✅ Feedback soumis et commenté  
✅ Notifications échangées  
✅ PDF exporté  
✅ Progression trackée

---

## 📊 CHECKLIST VALIDATION

### Sprint 2: Export PDF
- [ ] Bilan hebdo génère PDF valide
- [ ] Fiche athlète génère PDF valide
- [ ] Plan entraînement génère PDF valide
- [ ] Headers colorés affichés
- [ ] Boxes statistiques présentes
- [ ] Tables lisibles
- [ ] Footer sur toutes pages
- [ ] Noms fichiers corrects

### Sprint 2: Feedback
- [ ] Formulaire s'ouvre (modal)
- [ ] 3 ratings fonctionnent (étoiles)
- [ ] Labels dynamiques affichés
- [ ] Données performance acceptées
- [ ] Notes enregistrées
- [ ] Notification coach envoyée
- [ ] Coach peut commenter
- [ ] Notification athlète envoyée
- [ ] Feedback peut être mis à jour

### Sprint 3: Objectifs
- [ ] Création objectif réussie
- [ ] 7 types supportés
- [ ] Priorité 1-5 fonctionne
- [ ] Progression 0-100% validée
- [ ] Statuts modifiables
- [ ] Notification complétion envoyée
- [ ] Statistiques calculées
- [ ] Association athlete + coach

### Sprint 3: Plans
- [ ] Création manuelle réussie
- [ ] Génération auto fonctionne
- [ ] Algorithme progression correct
- [ ] Phase build + taper respectée
- [ ] WeeksTotal calculé auto
- [ ] Association goal_id
- [ ] Séances filtrées par dates
- [ ] Notifications envoyées

---

## 🐛 BUGS POTENTIELS À SURVEILLER

### Export PDF
- [ ] Erreur si aucune donnée
- [ ] Pagination cassée si trop de séances
- [ ] Caractères spéciaux dans noms
- [ ] Dates mal formatées

### Feedback
- [ ] Modal ne se ferme pas
- [ ] Étoiles ne changent pas
- [ ] Validation échoue si données manquantes
- [ ] Commentaire coach non visible

### Objectifs
- [ ] Date cible dans le passé
- [ ] Progression > 100%
- [ ] Priorité hors range 1-5
- [ ] Association athlete_id invalide

### Plans
- [ ] Date fin < date début
- [ ] Générateur: division par zéro
- [ ] JSON progression mal formaté
- [ ] Séances non filtrées

---

## ✅ RAPPORT DE TEST

### Template à remplir après tests

**Date** : ___________  
**Testeur** : ___________  
**Environnement** : Dev / Staging / Prod

| Fonctionnalité | Status | Notes |
|----------------|--------|-------|
| Export PDF Bilan | ☐ OK ☐ KO | |
| Export PDF Fiche | ☐ OK ☐ KO | |
| Export PDF Plan | ☐ OK ☐ KO | |
| Feedback Création | ☐ OK ☐ KO | |
| Feedback Commentaire | ☐ OK ☐ KO | |
| Objectif CRUD | ☐ OK ☐ KO | |
| Objectif Stats | ☐ OK ☐ KO | |
| Plan Création | ☐ OK ☐ KO | |
| Plan Génération | ☐ OK ☐ KO | |
| Notifications | ☐ OK ☐ KO | |

**Bugs trouvés** : ___________  
**Suggestions** : ___________  
**Validé pour Production** : ☐ OUI ☐ NON

---

## 🎯 NEXT STEPS APRÈS TESTS

Si **TOUS LES TESTS PASSENT** ✅ :
1. Mettre à jour CHANGELOG.md
2. Tag version `v1.0.0`
3. Déployer en staging
4. Tests utilisateurs finaux
5. Déploiement production

Si **DES BUGS SONT TROUVÉS** ❌ :
1. Créer issues GitHub
2. Prioriser (Critical, High, Medium, Low)
3. Fix les Critical en priorité
4. Re-tester
5. Repeat until green ✅

---

**Bon courage pour les tests ! 🚀**

---

**Auteur** : AI Assistant  
**Date** : 6 février 2026  
**Version** : 1.0
