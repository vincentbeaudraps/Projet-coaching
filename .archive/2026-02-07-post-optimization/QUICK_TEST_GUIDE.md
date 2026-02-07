# 🧪 Guide de Test Rapide - Session du 6 février 2026

**Objectif** : Valider les 2 fonctionnalités implémentées aujourd'hui

---

## ✅ Test 1: Correction CORS - Page Historique

### 🎯 Objectif
Vérifier que les erreurs "Network Error" sur `/athlete/races` sont corrigées.

### 📋 Étapes

1. **Ouvrir la page historique**
   ```
   http://localhost:5173/athlete/races
   ```

2. **Vérifier visuellement**
   - ❌ **AVANT** : Messages rouges en haut à droite "Erreur lors du chargement de l'historique: Network Error"
   - ✅ **APRÈS** : Aucun message d'erreur rouge

3. **Ouvrir DevTools** (F12)
   - Aller dans l'onglet **Network**
   - Filtrer par "XHR/Fetch"
   - Recharger la page (Cmd+R)

4. **Vérifier les requêtes**
   - ✅ `GET /api/athletes/me/records` → Status **200 OK**
   - ✅ `GET /api/notifications` → Status **200 OK** (ou 404 si pas de notifs)
   - ✅ Aucune requête avec Status **0** (blocked)

5. **Vérifier les statistiques affichées**
   - ✅ Carte "COURSES" : Nombre affiché
   - ✅ Carte "VDOT MOYEN" : Valeur affichée (ou 0.0 si pas de courses)
   - ✅ Carte "MEILLEUR VDOT" : Valeur affichée
   - ✅ Carte "DISTANCE TOTALE" : Valeur affichée

### ✅ Résultat Attendu
- Aucun message d'erreur rouge
- Toutes les requêtes API passent (200 OK)
- Les statistiques s'affichent correctement
- Le tableau affiche "Aucune course trouvée" (si pas de données) ou liste les courses

---

## ✅ Test 2: Volume Annuel Manuel

### 🎯 Objectif
Tester la saisie, l'affichage et la suppression des volumes annuels.

### 📋 Étapes

#### A. Accéder à la fonctionnalité

1. **Ouvrir le dashboard athlète**
   ```
   http://localhost:5173/athlete/profile
   ```

2. **Localiser la carte "Volume Annuel"**
   - Troisième ligne du dashboard
   - Icône : 📈
   - Titre : "Volume annuel"

#### B. Ajouter un volume annuel

3. **Cliquer sur le bouton**
   ```
   + Ajouter un volume annuel
   ```

4. **Remplir le formulaire modal**
   - **Année** : `2025`
   - **Volume (km)** : `2800`
   - **Notes** : `Préparation marathon` (optionnel)

5. **Valider**
   - Cliquer sur "💾 Enregistrer"
   - ✅ Message vert : "Volume annuel enregistré avec succès"
   - ✅ Modal se ferme automatiquement

6. **Vérifier l'affichage**
   - ✅ Le volume apparaît dans la liste
   - ✅ Format : `2025 | 2800 km | 🗑️`
   - ✅ Bouton suppression visible

#### C. Tester la mise à jour (UPDATE)

7. **Ajouter à nouveau un volume pour la même année**
   - Cliquer sur "+ Ajouter un volume annuel"
   - Année : `2025` (même année)
   - Volume : `3000` (nouveau volume)
   - Cliquer "Enregistrer"

8. **Vérifier**
   - ✅ Un seul volume pour 2025 (pas de doublon)
   - ✅ Volume affiché : `3000 km` (mis à jour)

#### D. Tester l'affichage prioritaire

9. **Ajouter un volume pour l'année courante**
   - Année : `2026`
   - Volume : `500`
   - Enregistrer

10. **Vérifier l'affichage en haut de la carte**
    - ✅ Affiche : `500 km`
    - ✅ Label : `Cette année (manuel)`
    - ✅ Si aucun volume manuel → Affiche calcul auto + `(auto)`

#### E. Tester la suppression

11. **Cliquer sur l'icône 🗑️** à côté d'un volume

12. **Confirmer la suppression**
    - Popup de confirmation : `Supprimer le volume pour l'année 2025 ?`
    - Cliquer "OK"

13. **Vérifier**
    - ✅ Message vert : "Volume supprimé avec succès"
    - ✅ Le volume disparaît de la liste
    - ✅ Si c'était le volume de l'année courante → Bascule sur calcul auto

#### F. Tester avec plusieurs volumes

14. **Ajouter plusieurs volumes**
    - 2023 : 2000 km
    - 2024 : 2300 km
    - 2025 : 2800 km
    - 2026 : 500 km (en cours)

15. **Vérifier**
    - ✅ Liste affiche les 5 derniers volumes
    - ✅ Triés par année décroissante (2026 en haut)
    - ✅ Chaque volume a son bouton 🗑️

---

## ✅ Test 3: Vérification Backend (Optionnel)

### 📋 Test API Direct

1. **Récupérer le token JWT**
   - Se connecter sur `http://localhost:5173/login`
   - F12 → Application → Local Storage
   - Copier la valeur de `auth-storage` → `state.token`

2. **Tester GET**
   ```bash
   TOKEN="<votre_token>"
   
   curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/athletes/me/annual-volumes
   ```
   
   **Résultat attendu** : JSON array des volumes
   ```json
   [
     {
       "id": "vol_123",
       "athlete_id": "ath_456",
       "year": 2025,
       "volume_km": "2800.00",
       "notes": "Préparation marathon",
       "created_at": "2026-02-06T...",
       "updated_at": "2026-02-06T..."
     }
   ]
   ```

3. **Tester POST**
   ```bash
   curl -X POST \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"year":2024,"volume_km":2500,"notes":"Reprise"}' \
     http://localhost:3000/api/athletes/me/annual-volumes
   ```
   
   **Résultat attendu** : 201 Created + JSON du volume créé

4. **Tester DELETE**
   ```bash
   curl -X DELETE \
     -H "Authorization: Bearer $TOKEN" \
     http://localhost:3000/api/athletes/me/annual-volumes/2024
   ```
   
   **Résultat attendu** : 200 OK + `{"message":"Annual volume deleted successfully"}`

---

## 🔍 Vérification Base de Données (Optionnel)

### 📋 Requêtes SQL

```bash
# Se connecter à la BDD
psql -U vincent -d coaching_db

# Vérifier la structure de la table
\d annual_volume

# Lister tous les volumes
SELECT * FROM annual_volume ORDER BY year DESC;

# Compter les volumes par athlète
SELECT athlete_id, COUNT(*) as nb_volumes 
FROM annual_volume 
GROUP BY athlete_id;

# Quitter
\q
```

---

## ✅ Checklist Finale

### Correction CORS
- [ ] Page `/athlete/races` charge sans erreur rouge
- [ ] Network tab : Toutes requêtes OK (200)
- [ ] Statistiques affichées correctement
- [ ] Console : Aucune erreur CORS

### Volume Annuel Manuel
- [ ] Modal s'ouvre au clic sur "+"
- [ ] Formulaire avec 3 champs (année, volume, notes)
- [ ] Enregistrement réussi (message vert)
- [ ] Volume apparaît dans la liste
- [ ] Mise à jour fonctionne (pas de doublon)
- [ ] Affichage prioritaire (manuel > auto)
- [ ] Suppression fonctionne (confirmation + message)
- [ ] Liste triée par année décroissante
- [ ] Boutons 🗑️ visibles et fonctionnels
- [ ] Style cohérent avec le reste du dashboard

### Backend API
- [ ] GET /api/athletes/me/annual-volumes → 200 OK
- [ ] POST /api/athletes/me/annual-volumes → 201 Created
- [ ] DELETE /api/athletes/me/annual-volumes/:year → 200 OK
- [ ] CORS headers présents dans les réponses

### Base de Données
- [ ] Table `annual_volume` existe
- [ ] Contrainte UNIQUE (athlete_id, year) fonctionne
- [ ] Données insérées correctement
- [ ] Cascade delete fonctionne

---

## 🐛 Bugs Potentiels à Surveiller

### Volume Annuel
1. **Doublon d'années** : Si un athlète peut créer 2 volumes pour la même année
   - ❌ Bug : Contrainte UNIQUE ne fonctionne pas
   - ✅ Fix : Vérifier migration SQL

2. **Volume négatif** : Si on peut saisir un volume < 0
   - ❌ Bug : Pas de validation frontend
   - ✅ Fix : Ajouter `min="0"` sur input

3. **Année future** : Si on peut saisir 2099
   - ⚠️ Non bloquant : À limiter si besoin

4. **Suppression sans confirmation** : Si le volume se supprime directement
   - ❌ Bug : Pas de `confirm()`
   - ✅ Fix : Déjà implémenté

### CORS
1. **Erreur sur production** : Si CORS bloque en prod
   - ⚠️ À prévoir : Changer config pour domaine prod
   - ✅ Fix : Utiliser variables d'environnement

---

## 📞 Support

### Si erreur persiste sur `/athlete/races`
1. Vérifier backend tourne : `lsof -ti:3000`
2. Vérifier frontend tourne : `lsof -ti:5173`
3. Redémarrer backend : `cd backend && npm run dev`
4. Vider cache navigateur : Cmd+Shift+R
5. Vérifier logs backend dans le terminal

### Si volume annuel ne s'enregistre pas
1. F12 → Network → Voir erreur API
2. Vérifier token JWT valide
3. Vérifier table BDD : `psql -c "\d annual_volume"`
4. Vérifier logs backend

### Commandes Utiles
```bash
# Redémarrer backend
cd backend && pkill -f "ts-node" && npm run dev

# Vérifier BDD
psql -U vincent -d coaching_db -c "SELECT * FROM annual_volume;"

# Voir logs en temps réel
cd backend && tail -f logs/app.log  # Si logs activés
```

---

**Temps estimé pour tous les tests** : 15-20 minutes

**Prochaine étape après validation** : Améliorer l'UI avec graphiques Chart.js pour visualiser l'évolution du volume annuel 📊
