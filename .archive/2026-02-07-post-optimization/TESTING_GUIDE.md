# Guide de Test - Templates Personnalisés & Zones Cardio

## 🎯 Objectifs de Test

Ce guide permet de valider les 5 fonctionnalités majeures ajoutées :
1. ✅ Style des calendriers avec zones cardio (Z1-Z5)
2. ✅ Badges optimisés (taille réduite)
3. ✅ Validation création de séances (compatible montres GPS)
4. ✅ Pourcentages de VMA
5. ✅ Templates personnalisés réutilisables

## 📋 Prérequis

### 1. Lancer l'Application

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### 2. Compte de Test

- **Coach** : Avoir un compte coach avec au moins 1 athlète
- **Athlète** : Avoir FC MAX et VMA renseignées
  - FC MAX : ~190 bpm
  - VMA : ~16 km/h

### 3. Données de Test

Créer quelques séances et activités pour voir les calendriers remplis.

---

## 🧪 Tests Fonctionnels

### Test 1 : Zones Cardio sur Calendrier (Séances Planifiées)

#### Objectif
Vérifier que les séances affichent la bonne zone avec couleur appropriée.

#### Étapes
1. Aller sur Dashboard Coach
2. Créer une séance d'endurance (Z2)
   - Bloc : 60 min à 70% VMA
   - Sauvegarder pour une date visible
3. Observer le calendrier

#### Résultat Attendu
- ✅ Badge "Z2" affiché en **bleu** (#4299e1)
- ✅ Fond avec gradient bleu subtil
- ✅ Tooltip affiche "Zone 2 - Endurance"
- ✅ Badge compact (20px de hauteur)

#### Variations à Tester
- **Z1** (Récupération) : Vert #48bb78
- **Z2** (Endurance) : Bleu #4299e1
- **Z3** (Tempo) : Orange #ed8936
- **Z4** (Seuil) : Rouge #f56565
- **Z5** (Maximum) : Violet #9f7aea

---

### Test 2 : Zones Cardio sur Activités Réalisées

#### Objectif
Vérifier le calcul automatique de zone basé sur FC moyenne.

#### Étapes
1. Aller sur Dashboard Athlète
2. Ajouter une activité manuelle
   - Type : Course
   - Durée : 45 min
   - Distance : 8 km
   - FC moyenne : 150 bpm (pour athlète avec FC MAX 190)
3. Observer le calendrier des activités

#### Résultat Attendu
- ✅ Badge "Z3" affiché (150/190 = 79% → Zone 3)
- ✅ Couleur orange #ed8936
- ✅ Affichage distance "8.0 km"
- ✅ Affichage durée "45 min"
- ✅ Pas d'affichage FC (pour compacité)

#### Formule de Calcul
```
% FC MAX = (FC moyenne / FC MAX) × 100

Z1: < 60%
Z2: 60-70%
Z3: 70-80%
Z4: 80-90%
Z5: > 90%
```

---

### Test 3 : Création de Séance avec % VMA

#### Objectif
Valider le système de pourcentages VMA avec prévisualisation.

#### Étapes
1. Aller sur "Créer une Séance"
2. Sélectionner un athlète avec VMA = 16 km/h
3. Ajouter un bloc "Travail"
4. Cliquer sur bouton "% VMA" dans la section Allure
5. Saisir :
   - % VMA MIN : 85%
   - % VMA MAX : 95%

#### Résultat Attendu
- ✅ Inputs acceptent uniquement 50-120
- ✅ Prévisualisation s'affiche :
  ```
  🏃 VMA 16 km/h
  📏 85% VMA = 4:24/km
  📏 95% VMA = 3:56/km
  ```
- ✅ Calcul correct : `speedKmh = 16 × (85/100) = 13.6 km/h`
- ✅ Conversion : `pace = 3600 / 13.6 = 265 secondes = 4:25/km`

#### Validation des Limites
- ❌ Saisir 45% → Rejeté
- ❌ Saisir 125% → Rejeté
- ✅ Saisir 100% → Accepté (= VMA exacte)

---

### Test 4 : Création de Séance avec Zones VMA

#### Objectif
Valider le sélecteur de zones VMA calculées.

#### Étapes
1. Créer une séance pour athlète VMA 16 km/h
2. Ajouter un bloc "Intervalles"
3. Cliquer sur bouton "Zone VMA"
4. Sélectionner "Z4 - Seuil (85-90% VMA)"

#### Résultat Attendu
- ✅ Menu déroulant affiche 6 zones :
  ```
  Z1 - Récupération active (60-70% VMA)
  Z2 - Endurance fondamentale (70-75% VMA)
  Z3 - Tempo (75-85% VMA)
  Z4 - Seuil (85-90% VMA)
  Z5 - VO2max (90-100% VMA)
  Z6 - Sprint (>100% VMA)
  ```
- ✅ Après sélection, confirmation visuelle verte
- ✅ Zone sauvegardée dans le bloc

---

### Test 5 : Validation Numérique Allure Fixe

#### Objectif
Vérifier le nouveau système de saisie séparée Minutes:Secondes.

#### Étapes
1. Créer une séance
2. Ajouter un bloc
3. Mode Allure : "Allure fixe" (par défaut)
4. Saisir :
   - MIN : 4 minutes : 30 secondes
   - MAX : 4 minutes : 45 secondes

#### Résultat Attendu
- ✅ Champs séparés pour minutes et secondes
- ✅ Minutes : 3-10 uniquement
- ✅ Secondes : 0-59 uniquement
- ✅ Stockage interne : 270 secondes (4:30) et 285 secondes (4:45)
- ✅ Affichage formaté : "4:30/km - 4:45/km"

#### Cas Limites
- ❌ Minutes = 2 → Rejeté
- ❌ Secondes = 65 → Rejeté
- ✅ Minutes = 10, Secondes = 0 → Accepté (10:00/km)

---

### Test 6 : Sauvegarde Template Personnalisé

#### Objectif
Créer et sauvegarder un template personnalisé.

#### Étapes
1. Créer une séance complète :
   ```
   Titre : "Sortie longue progressive"
   Blocs :
   - Échauffement : 15 min à 70% VMA
   - Endurance : 60 min à 75-80% VMA
   - Accélération : 15 min à 85-90% VMA
   - Retour au calme : 10 min récupération
   ```

2. Cliquer sur "💾 Sauvegarder comme template"

3. Dans le modal :
   - Nom : "Sortie longue 1h40"
   - Description : "Build progressif avec accélération finale"
   - Cliquer "💾 Sauvegarder"

#### Résultat Attendu
- ✅ Modal s'affiche avec animation slideUp
- ✅ Aperçu automatique :
  ```
  📊 Cette séance contient :
  • 4 bloc(s) d'entraînement
  • Durée estimée : 100 minutes
  • Distance estimée : 16.5 km
  ```
- ✅ Message de confirmation après sauvegarde
- ✅ Modal se ferme automatiquement

---

### Test 7 : Affichage Templates dans Sidebar

#### Objectif
Vérifier l'organisation des templates personnalisés vs défaut.

#### Étapes
1. Ouvrir "Créer une Séance"
2. Cliquer "📋 Afficher les templates"
3. Observer la sidebar

#### Résultat Attendu

**Section "💾 Mes Templates" :**
- ✅ Apparaît EN PREMIER (au-dessus des templates par défaut)
- ✅ Template "Sortie longue 1h40" visible
- ✅ Bordure bleue à gauche (#007bff)
- ✅ Gradient de fond gris → blanc
- ✅ Date affichée : "06/02/2026"
- ✅ Nombre de blocs : "4 blocs"

**Section "📋 Templates par défaut" :**
- ✅ Apparaît APRÈS les templates perso
- ✅ 6 templates système visibles
- ✅ Pas de bordure bleue
- ✅ Pas de date
- ✅ Pas de bouton suppression

---

### Test 8 : Bouton Suppression Template

#### Objectif
Vérifier l'interaction de suppression.

#### Étapes
1. Dans la sidebar templates
2. Survoler le template personnalisé "Sortie longue 1h40"
3. Observer le bouton 🗑️ apparaître
4. Cliquer dessus
5. Confirmer la suppression

#### Résultat Attendu
- ✅ Bouton invisible au repos (opacity: 0)
- ✅ Bouton visible au survol (opacity: 1)
- ✅ Bouton rouge #ff4444
- ✅ Position : Coin supérieur droit
- ✅ Message de confirmation : "Êtes-vous sûr de vouloir supprimer ce template ?"
- ✅ Après confirmation : Template disparaît immédiatement
- ✅ localStorage mis à jour

---

### Test 9 : Application d'un Template Personnalisé

#### Objectif
Réutiliser un template sauvegardé.

#### Étapes
1. Créer une nouvelle séance
2. Ouvrir sidebar templates
3. Cliquer sur template "Sortie longue 1h40"

#### Résultat Attendu
- ✅ Sidebar se ferme automatiquement
- ✅ Titre auto-rempli : "Sortie longue 1h40"
- ✅ 4 blocs créés avec :
  - Type correct (Échauffement, Endurance, etc.)
  - Durées correctes (15, 60, 15, 10 min)
  - % VMA corrects (70%, 75-80%, 85-90%)
  - Descriptions complètes
- ✅ Estimation visible : "100 min" et "16.5 km"

---

### Test 10 : Persistance localStorage

#### Objectif
Vérifier que les templates survivent au rafraîchissement.

#### Étapes
1. Créer et sauvegarder un template "Test Persistence"
2. Rafraîchir la page (F5 ou Cmd+R)
3. Retourner sur "Créer une Séance"
4. Ouvrir sidebar templates

#### Résultat Attendu
- ✅ Template "Test Persistence" toujours présent
- ✅ Même date de création
- ✅ Même nombre de blocs
- ✅ Toutes les données intactes

#### Vérification Console
```javascript
// Dans DevTools Console
localStorage.getItem('customTemplates')
// Doit retourner un JSON valide avec tous les templates
```

---

### Test 11 : Compatibilité Export Montres GPS

#### Objectif
Vérifier que les données sont exportables (simulation).

#### Étapes
1. Créer une séance avec :
   - % VMA : 85-90%
   - Zones VMA : Z4
   - Zones FC : Z4
2. Sauvegarder la séance
3. Vérifier les données dans la base

#### Résultat Attendu

**Conversion % VMA → Allure :**
```javascript
// Pour VMA 16 km/h
85% VMA = 13.6 km/h = 4:25/km = 265 sec/km ✅
90% VMA = 14.4 km/h = 4:10/km = 250 sec/km ✅
```

**Conversion Zones VMA → Plages :**
```javascript
// Zone 4 : 85-90% VMA
Min: 16 × 0.85 = 13.6 km/h ✅
Max: 16 × 0.90 = 14.4 km/h ✅
```

**Conversion Zones FC → BPM :**
```javascript
// Zone 4 : 80-90% FC MAX (190 bpm)
Min: 190 × 0.80 = 152 bpm ✅
Max: 190 × 0.90 = 171 bpm ✅
```

**Format TCX/FIT :**
- ✅ Durée en secondes : 600s (10 min)
- ✅ Distance en mètres : 5000m (5 km)
- ✅ Pace en sec/km : 270 (4:30/km)
- ✅ HR en bpm : 152-171

---

### Test 12 : Responsive Mobile

#### Objectif
Vérifier l'affichage sur petits écrans.

#### Étapes
1. Ouvrir DevTools (F12)
2. Activer mode responsive
3. Tester iPhone 12 (390 × 844)
4. Naviguer dans les templates

#### Résultat Attendu
- ✅ Sidebar : 95% largeur écran
- ✅ Modal : 95% largeur écran
- ✅ Boutons : Empilés verticalement
- ✅ Badges : Compacts mais lisibles
- ✅ Scroll : Fluide sur calendrier

---

## 🎨 Tests Visuels

### Test 13 : Cohérence des Couleurs

Vérifier que les couleurs sont cohérentes partout.

#### Zones Cardio
| Zone | Couleur | Nom | Hex |
|------|---------|-----|-----|
| Z1 | 🟢 Vert | Récupération | #48bb78 |
| Z2 | 🔵 Bleu | Endurance | #4299e1 |
| Z3 | 🟠 Orange | Tempo | #ed8936 |
| Z4 | 🔴 Rouge | Seuil | #f56565 |
| Z5 | 🟣 Violet | Maximum | #9f7aea |

#### Vérifications
- ✅ Mêmes couleurs sur Calendar.tsx
- ✅ Mêmes couleurs sur CompletedActivitiesCalendar.tsx
- ✅ Mêmes couleurs sur TrainingZones.tsx
- ✅ Gradient de fond cohérent avec badge

---

### Test 14 : Taille des Badges

Mesurer les dimensions des badges pour confirmer l'optimisation.

#### Mesures Attendues
```css
.session-badge {
  padding: 4px 6px;      /* Avant : 6px 8px */
  gap: 4px;              /* Avant : 6px */
  margin: 2px;           /* Avant : 3px */
}

.session-zone-badge {
  width: 20px;           /* Avant : 24px */
  height: 20px;          /* Avant : 24px */
  font-size: 9px;        /* Avant : 10px */
}
```

#### Vérification Visuelle
- ✅ Badge n'écrase pas le texte du jour
- ✅ Calendrier reste aligné (pas de déformation)
- ✅ Lisibilité conservée

---

## 🚨 Tests d'Erreurs

### Test 15 : Validation Inputs

Tester les cas limites et erreurs.

#### % VMA Invalides
- ❌ 49% → "Valeur entre 50 et 120 requise"
- ❌ 121% → "Valeur entre 50 et 120 requise"
- ❌ -10% → Rejeté

#### Allure Invalide
- ❌ Minutes = 2 → "Minimum 3 min/km"
- ❌ Secondes = 60 → "Maximum 59 secondes"
- ❌ Minutes = 11 → "Maximum 10 min/km"

#### Template Sans Nom
- ❌ Cliquer "Sauvegarder" sans nom → Bouton désactivé

---

### Test 16 : Athlète Sans Métriques

Vérifier le comportement si FC MAX ou VMA manquante.

#### Étapes
1. Créer un athlète sans FC MAX et sans VMA
2. Créer une séance pour cet athlète
3. Tenter d'utiliser % VMA

#### Résultat Attendu
- ✅ Warning affiché :
  ```
  ⚠️ Métriques manquantes
  Cet athlète n'a pas de FC MAX ou VMA renseignée.
  Les zones d'entraînement ne seront pas disponibles.
  ```
- ✅ Boutons "% VMA" et "Zone VMA" désactivés
- ✅ Bouton "Zone FC" désactivé
- ✅ Seule "Allure fixe" disponible

---

## 📊 Tests de Performance

### Test 17 : Chargement Templates

#### Métrique
Temps entre clic "Afficher templates" et affichage complet.

#### Résultat Attendu
- ✅ < 50ms (sidebar slide)
- ✅ < 100ms (rendu des cartes)
- ✅ Transition fluide (60 FPS)

### Test 18 : Application Template

#### Métrique
Temps entre clic sur template et affichage des blocs.

#### Résultat Attendu
- ✅ < 100ms pour template 10 blocs
- ✅ Sidebar ferme immédiatement
- ✅ Aucun lag visuel

---

## ✅ Checklist Complète

### Calendriers
- [ ] Séances planifiées affichent zone Z1-Z5
- [ ] Activités réalisées affichent zone Z1-Z5
- [ ] Couleurs cohérentes partout
- [ ] Badges optimisés (20px)
- [ ] Tooltips enrichis
- [ ] Gradients de fond subtils

### Création Séances
- [ ] Allure fixe : Minutes + Secondes
- [ ] % VMA : 50-120% avec preview
- [ ] Zones VMA : 6 zones sélectionnables
- [ ] Zones FC : 5 zones sélectionnables
- [ ] Validation stricte des inputs
- [ ] Messages d'erreur clairs

### Templates Personnalisés
- [ ] Bouton sauvegarde visible
- [ ] Modal avec nom + description
- [ ] Aperçu automatique
- [ ] Sauvegarde dans localStorage
- [ ] Affichage section "Mes Templates"
- [ ] Bouton suppression au survol
- [ ] Application en 1 clic
- [ ] Persistance après refresh

### Compatibilité
- [ ] Export TCX fonctionnel
- [ ] Export FIT fonctionnel
- [ ] Conversions correctes (VMA, FC)
- [ ] Format compatible Garmin
- [ ] Format compatible Polar
- [ ] Format compatible Suunto

### Responsive
- [ ] Desktop (> 1024px)
- [ ] Tablet (768-1024px)
- [ ] Mobile (< 768px)
- [ ] Sidebar adaptée
- [ ] Modal adaptée
- [ ] Calendrier scrollable

---

## 🐛 Rapporter un Bug

Si un test échoue, documenter :

1. **Étape qui échoue** : Numéro du test
2. **Comportement observé** : Ce qui se passe
3. **Comportement attendu** : Ce qui devrait se passer
4. **Navigateur** : Chrome/Firefox/Safari + version
5. **Console** : Erreurs JavaScript
6. **Screenshots** : Si applicable

---

## 🎉 Validation Finale

Tous les tests passent ? **Le système est prêt pour production !**

**Score attendu : 18/18 tests réussis ✅**
