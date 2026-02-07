# 🧪 Guide de Test - Dashboard Enrichi Athlète

## Prérequis

1. **Backend démarré** : `cd backend && npm run dev`
2. **Frontend démarré** : `cd frontend && npm run dev`
3. **Compte athlète** : Avoir un compte avec rôle `athlete`

---

## 🚀 Test 1 : Accès au Dashboard

### Étapes
1. Se connecter avec un compte **athlète**
2. Naviguer vers : `http://localhost:5173/athlete/profile`

### Résultat Attendu
✅ Page se charge sans erreur  
✅ Header avec profil visible  
✅ 6 cartes dashboard affichées :
   - Records personnels
   - VDOT
   - Courses à venir
   - Volume annuel
   - Stats d'entraînement
   - Physique

---

## 📝 Test 2 : Édition du Profil

### Étapes
1. Sur le dashboard, cliquer **"✏️ Modifier mon profil"**
2. Remplir les champs :
   - Poids : `72.5`
   - Taille : `178`
   - VMA : `16.2`
   - FC max : `192`
   - FC repos : `48`
   - Ville : `Lyon`
3. Cliquer **"💾 Enregistrer"**

### Résultat Attendu
✅ Modal se ferme  
✅ Toast de succès affiché : *"Profil mis à jour avec succès"*  
✅ Données mises à jour visibles immédiatement sur le dashboard  
✅ IMC recalculé automatiquement (si poids/taille renseignés)

### Vérification Backend
```bash
# Dans psql ou un client PostgreSQL
SELECT weight, height, vma, max_heart_rate, city 
FROM athletes 
WHERE user_id = 'votre-user-id';
```

---

## 🏆 Test 3 : Affichage Records (via API)

### Prérequis
Ajouter un record via API directement pour tester l'affichage :

```bash
# Avec curl (remplacer TOKEN par votre JWT)
curl -X POST http://localhost:3001/api/athletes/me/records \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "distance_type": "10km",
    "distance_km": 10,
    "time_seconds": 2400,
    "pace": "4:00",
    "location": "Parc de la Tête d'Or",
    "date_achieved": "2025-11-15"
  }'
```

### Étapes
1. Rafraîchir le dashboard (`F5`)
2. Vérifier la carte **"Records personnels"**

### Résultat Attendu
✅ Record apparaît dans la liste  
✅ Distance : `10km`  
✅ Temps : `40:00`  
✅ Allure : `4:00 /km`  
✅ VDOT calculé automatiquement  
✅ Date et lieu affichés

---

## 🏁 Test 4 : Affichage Courses à Venir

### Prérequis
Ajouter une course via API :

```bash
curl -X POST http://localhost:3001/api/athletes/me/races \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Semi-Marathon de Lyon",
    "location": "Lyon",
    "date": "2026-04-15",
    "distance_km": 21.1,
    "distance_label": "Semi-Marathon",
    "elevation_gain": 150,
    "target_time": "1:30:00",
    "registration_status": "confirmed"
  }'
```

### Étapes
1. Rafraîchir le dashboard
2. Vérifier la carte **"Courses à venir"**

### Résultat Attendu
✅ Course apparaît  
✅ Badge distance : `Semi-Marathon`  
✅ Countdown : `J-68` (calculé depuis date actuelle)  
✅ Nom : `Semi-Marathon de Lyon`  
✅ Date formatée en français  
✅ Lieu : `📍 Lyon`  
✅ Dénivelé : `⛰️ D+: 150m`  
✅ Objectif : `🎯 Objectif: 1:30:00`

---

## 📈 Test 5 : Statistiques Annuelles

### Prérequis
Avoir des activités dans la table `activities` pour plusieurs années.

Si aucune donnée, ajouter manuellement :
```sql
INSERT INTO activities (id, athlete_id, date, distance, duration, type) VALUES
  ('uuid1', 'athlete-id', '2023-01-15', 10.5, 3000, 'running'),
  ('uuid2', 'athlete-id', '2023-03-20', 8.2, 2400, 'running'),
  ('uuid3', 'athlete-id', '2024-02-10', 12.0, 3600, 'running');
```

### Étapes
1. Rafraîchir le dashboard
2. Vérifier la carte **"Volume annuel"**

### Résultat Attendu
✅ Grande valeur affichée : `XX km` (année en cours)  
✅ Graphique en barres avec hauteurs proportionnelles  
✅ Labels années sous chaque barre  
✅ Hover sur barre affiche tooltip avec km exact

---

## 🎯 Test 6 : Calcul VDOT

### Formule Testée
```typescript
calculateVDOT(timeSeconds, distanceKm)
```

### Cas de Test

| Distance | Temps    | VDOT Attendu |
|----------|----------|--------------|
| 5 km     | 20:30    | ~50-52       |
| 10 km    | 40:00    | ~52-54       |
| 21.1 km  | 1:30:00  | ~54-56       |
| 42.2 km  | 3:00:00  | ~56-58       |

### Vérification
1. Ajouter un record avec ces valeurs
2. Vérifier que le VDOT calculé est dans la plage attendue
3. Comparer avec calculateur VDOT en ligne : https://runsmartproject.com/calculator/

---

## 📱 Test 7 : Responsive Mobile

### Étapes
1. Ouvrir DevTools (`F12`)
2. Mode Responsive (`Cmd+Shift+M` ou `Ctrl+Shift+M`)
3. Tester résolutions :
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)

### Résultat Attendu
✅ Grid passe en 1 colonne sur mobile  
✅ Textes lisibles  
✅ Boutons cliquables (taille suffisante)  
✅ Modal profil scrollable  
✅ Pas de débordement horizontal

---

## ❌ Test 8 : Gestion Erreurs

### Test 8.1 : Données Vides
1. Nouveau compte athlète sans données
2. Accéder au dashboard

**Attendu** :
- ✅ Dashboard se charge
- ✅ Cartes vides avec messages appropriés
- ✅ Boutons "Ajouter" visibles

### Test 8.2 : Erreur API
1. Arrêter le backend
2. Essayer de sauvegarder le profil

**Attendu** :
- ✅ Toast d'erreur : *"Erreur lors de la mise à jour du profil"*
- ✅ Formulaire reste ouvert
- ✅ Données non perdues

### Test 8.3 : Token Expiré
1. Modifier le token dans localStorage (invalide)
2. Rafraîchir la page

**Attendu** :
- ✅ Redirection vers `/login`

---

## 🔍 Checklist Complète

### Interface
- [ ] Header profil s'affiche
- [ ] Photo placeholder si pas d'image
- [ ] Badges colorés visibles
- [ ] Stats inline (âge, poids, VMA, FC)
- [ ] Bouton "Modifier profil" cliquable
- [ ] 6 cartes dashboard présentes
- [ ] Cards ont hover effect (translateY + glow)
- [ ] Scrolling fluide

### Modal Édition
- [ ] Modal s'ouvre au clic
- [ ] Formulaire pré-rempli avec données existantes
- [ ] Tous les champs éditables
- [ ] Select genre fonctionne
- [ ] Date picker fonctionne
- [ ] Textarea redimensionnable
- [ ] Bouton "Annuler" ferme modal
- [ ] Bouton "Enregistrer" sauvegarde et ferme
- [ ] Clic overlay ferme modal

### Records
- [ ] Liste records affichée
- [ ] Temps formaté correctement (HH:MM:SS)
- [ ] VDOT calculé affiché
- [ ] Date formatée en français
- [ ] Bouton "Ajouter" présent (pas encore fonctionnel)

### Courses
- [ ] Liste courses affichée
- [ ] Countdown calculé (J-X)
- [ ] Date future positive, passée négative
- [ ] Toutes les infos affichées
- [ ] Bouton "Ajouter" présent

### Volume & Stats
- [ ] Graphique volume avec barres
- [ ] Hauteurs proportionnelles
- [ ] Année en cours mise en avant
- [ ] Stats entraînement correctes
- [ ] Icons affichés

### Physique
- [ ] IMC auto-calculé si poids+taille
- [ ] Toutes métriques affichées
- [ ] Format correct (1 décimale)

---

## 🐛 Bugs Connus

Aucun pour le moment ! 🎉

---

## 📞 Support

**En cas de problème** :

1. Vérifier console navigateur (`F12` → Console)
2. Vérifier logs backend (terminal backend)
3. Vérifier que les tables BDD existent :
   ```sql
   \dt -- liste les tables
   \d athletes -- détails table athletes
   \d athlete_records
   \d races
   ```

---

## ✅ Validation Finale

Si tous les tests passent :
- ✅ Dashboard fonctionnel
- ✅ Édition profil opérationnelle
- ✅ Affichage données API
- ✅ Calculs automatiques corrects
- ✅ Responsive mobile/desktop
- ✅ Gestion erreurs en place

**→ Prêt pour ajout des modals records/courses ! 🚀**
