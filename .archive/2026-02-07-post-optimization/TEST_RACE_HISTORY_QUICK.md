# 🧪 Test Rapide - Historique des Courses

## 🎯 Objectifs
1. Vérifier le nouveau calcul VDOT
2. Tester la page Historique des courses
3. Valider les filtres et le tri

---

## Test 1 : Nouveau Calcul VDOT ✅

### Étapes
1. Aller sur `http://localhost:5175/athlete/profile`
2. Cliquer sur "+ Ajouter un record"
3. Remplir le formulaire :
   - Distance : **10km**
   - Temps : **00:35:50**
   - Date : **2025-03-30**
   - Lieu : **Valenciennes**
   - Nom : **Les Foulées Valenciennoises**

### Résultats Attendus
- ✅ Allure calculée : **3:35/km**
- ✅ **VDOT : 59.1** (au lieu de ~57.6 avec l'ancienne formule)

### Vérification Rapide
```
10km en 35:50 → VDOT ≈ 59.1 ✅
5km en 17:02 → VDOT ≈ 60.0 ✅
Semi en 1:17:48 → VDOT ≈ 55.5 ✅
```

---

## Test 2 : Page Historique des Courses ✅

### Accès
1. Dans le header, cliquer sur **"📊 Historique des courses"**
2. OU naviguer vers `http://localhost:5175/athlete/races`

### Vérifications

#### A. Statistiques Résumées
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 🏃 Courses  │ │ 📈 VDOT moy │ │ 🏆 Best     │ │ 🗺️ Distance │
│     18      │ │    55.7     │ │    60.1     │ │   168 km    │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```
- [ ] 4 cartes affichées
- [ ] Valeurs calculées correctement
- [ ] Icônes visibles

#### B. Filtres
```
[Toutes les distances ▼]  [Toutes les années ▼]
```
- [ ] Dropdown "Distance" fonctionne
- [ ] Dropdown "Année" fonctionne
- [ ] Filtrage en temps réel

#### C. Tableau
```
┌────────────────────────────────────────────────────────────────┐
│ Nom │ Résultats │ Pace │ Date │ Distance │ VDOT │ Note │ Actions │
├────────────────────────────────────────────────────────────────┤
│ ... │   ...     │ ...  │ ...  │   ...    │ ...  │  📝  │ ✏️ 🗑️ │
└────────────────────────────────────────────────────────────────┘
```
- [ ] Toutes les colonnes visibles
- [ ] Données affichées correctement
- [ ] Badges colorés (vert/violet/orange/rouge)

---

## Test 3 : Filtres ✅

### A. Filtre par Distance
1. Sélectionner **"10km"** dans le dropdown
2. Vérifier que seules les courses 10km s'affichent
3. Changer pour **"Semi-Marathon"**
4. Vérifier que seules les semis s'affichent
5. Remettre **"Toutes les distances"**

**✅ Résultat attendu** : Le tableau se met à jour instantanément

### B. Filtre par Année
1. Sélectionner **"2025"**
2. Vérifier que seules les courses de 2025 s'affichent
3. Changer pour **"2024"**
4. Vérifier que seules les courses de 2024 s'affichent
5. Remettre **"Toutes les années"**

**✅ Résultat attendu** : Le tableau se met à jour instantanément

### C. Filtres Combinés
1. Sélectionner **"10km"** + **"2025"**
2. Vérifier que seules les 10km de 2025 s'affichent

**✅ Résultat attendu** : Filtrage combiné fonctionne

---

## Test 4 : Tri ✅

### A. Tri par Date
1. Cliquer sur la colonne **"Date ↕"**
2. Observer : tri croissant (plus ancien → plus récent)
3. Cliquer à nouveau
4. Observer : tri décroissant (plus récent → plus ancien)

**✅ Résultat attendu** : Flèche ↑ ou ↓ s'affiche

### B. Tri par VDOT
1. Cliquer sur la colonne **"VDOT ↕"**
2. Observer : tri décroissant (meilleur VDOT en haut)
3. Cliquer à nouveau
4. Observer : tri croissant (plus faible VDOT en haut)

**✅ Résultat attendu** : Courses triées par performance

### C. Tri par Pace
1. Cliquer sur la colonne **"Pace ↕"**
2. Observer : tri croissant (allure la plus rapide en haut)
3. Cliquer à nouveau
4. Observer : tri décroissant (allure la plus lente en haut)

**✅ Résultat attendu** : Courses triées par allure

---

## Test 5 : Responsive ✅

### A. Desktop (>1200px)
- [ ] 4 cartes statistiques côte à côte
- [ ] Tableau complet visible
- [ ] Toutes les colonnes visibles
- [ ] Actions (✏️ 🗑️) alignées à droite

### B. Tablette (768-1024px)
- [ ] 2 cartes statistiques par ligne
- [ ] Tableau : scroll horizontal
- [ ] Filtres sur 2 lignes

### C. Mobile (<768px)
- [ ] 1 carte statistique par ligne
- [ ] Filtres full width (1 par ligne)
- [ ] Tableau : scroll horizontal
- [ ] Header responsive

**Test manuel** : Réduire la fenêtre progressivement

---

## Test 6 : UI/UX ✅

### A. Hover Effects
1. Survoler une ligne du tableau
2. Observer : fond gris clair
3. Survoler une carte statistique
4. Observer : légère élévation (transform: translateY(-2px))
5. Survoler un bouton filtre
6. Observer : bordure violette

**✅ Résultat attendu** : Transitions fluides (0.2s)

### B. Badges Distance
- [ ] 🟢 5km = Vert (#10b981)
- [ ] 🟣 10km = Violet (#8b5cf6)
- [ ] 🟠 Semi = Orange (#f59e0b)
- [ ] 🔴 Marathon = Rouge (#ef4444)
- [ ] ⚪ Autre = Gris (#6b7280)

### C. Navigation
1. Cliquer sur "📊 Historique des courses" dans le header
2. Vérifier : onglet est surligné (actif)
3. Naviguer vers "👤 Profil"
4. Vérifier : "Profil" est maintenant actif
5. Retourner sur "📊 Historique"

**✅ Résultat attendu** : Navigation fluide, highlight correct

---

## Test 7 : Cas Limites ✅

### A. Aucune Course
1. Si la base est vide, vérifier :
   - [ ] Message "Aucune course trouvée"
   - [ ] Statistiques à 0
   - [ ] Pas de ligne dans le tableau

### B. Une Seule Course
1. Ajouter 1 course
2. Vérifier :
   - [ ] Statistiques correctes (1 course, VDOT = celui de la course)
   - [ ] 1 ligne dans le tableau
   - [ ] Filtres fonctionnent

### C. Filtre Sans Résultat
1. Filtrer par "Marathon" si vous n'en avez pas
2. Vérifier : message "Aucune course trouvée"
3. Statistiques : compteurs à 0

**✅ Résultat attendu** : UI ne plante pas

---

## 🐛 Bugs à Signaler

Si vous rencontrez un de ces problèmes, noter :

- [ ] VDOT négatif ou > 100
- [ ] Statistiques NaN ou Infinity
- [ ] Filtres ne fonctionnent pas
- [ ] Tri ne fonctionne pas
- [ ] Tableau vide alors qu'il y a des courses
- [ ] Badges de mauvaise couleur
- [ ] Actions (edit/delete) ne font rien (normal pour l'instant)
- [ ] Crash sur mobile
- [ ] Header ne s'affiche pas

---

## ✅ Checklist Complète

```
Page & Navigation
✅ Page accessible via /athlete/races
✅ Lien dans header fonctionne
✅ Header highlight correct

Statistiques
✅ 4 cartes affichées
✅ Valeurs calculées correctement
✅ Hover effects fonctionnent

Filtres
✅ Dropdown Distance fonctionne
✅ Dropdown Année fonctionne
✅ Filtrage en temps réel
✅ Filtres combinés fonctionnent

Tri
✅ Tri par Date fonctionne
✅ Tri par VDOT fonctionne
✅ Tri par Pace fonctionne
✅ Indicateur de tri (↑ ↓) s'affiche

Tableau
✅ Toutes les colonnes visibles
✅ Badges colorés correctement
✅ Format date correct (fr-FR)
✅ Format temps correct (hh:mm:ss)
✅ Pace correct (mm:ss/km)

Responsive
✅ Desktop (4 colonnes stats)
✅ Tablette (2 colonnes stats)
✅ Mobile (1 colonne stats)
✅ Scroll horizontal tableau

VDOT
✅ Calcul correct (formule Jack Daniels)
✅ Cohérence avec tables officielles
✅ Valeurs réalistes (30-80)
```

---

## 📸 Screenshots Attendus

### Desktop
```
┌─────────────────────────────────────────────────────────────────┐
│  VB COACHING    📅 📊 Historique des courses 👤 🔗    🔔 User  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 Historique des courses                                      │
│  18 courses enregistrées                                        │
│                                                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                          │
│  │ 🏃 18│ │📈55.7│ │🏆60.1│ │🗺️168│                          │
│  └──────┘ └──────┘ └──────┘ └──────┘                          │
│                                                                 │
│  [Toutes distances ▼] [Toutes années ▼]                       │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Tableau avec 18 lignes...                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Affichage de 18 sur 18 courses                                │
└─────────────────────────────────────────────────────────────────┘
```

---

**Durée estimée** : 10-15 minutes  
**Navigateur** : Chrome/Firefox/Safari  
**Résolution testée** : 1920x1080, 1024x768, 375x667
