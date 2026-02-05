# 📊 Système de Métriques Athlètes - Documentation Complète

## 🎯 Vue d'Ensemble

Le système de métriques permet aux coachs de suivre et gérer les données physiologiques et de performance de leurs athlètes. Ces métriques sont essentielles pour personnaliser les programmes d'entraînement et calculer les zones d'effort optimales.

---

## 📋 Métriques Disponibles

### 1. ❤️ **Données Cardiaques**
- **FC Max (max_heart_rate)** : Fréquence cardiaque maximale en BPM
  - Utilisée pour calculer les zones d'entraînement
  - Plage : 100-220 BPM
  
- **FC Repos (resting_heart_rate)** : Fréquence cardiaque au repos en BPM
  - Indicateur de condition physique
  - Plage : 30-100 BPM

### 2. 🏃 **Performance**
- **VMA (vma)** : Vitesse Maximale Aérobie en km/h
  - Métrique clé pour les coureurs
  - Permet de calculer les allures d'entraînement
  - Plage : 8-25 km/h
  
- **VO2 Max (vo2max)** : Consommation maximale d'oxygène en ml/kg/min
  - Indicateur de capacité aérobie
  - Plage : 20-90 ml/kg/min
  
- **Allure Seuil (lactate_threshold_pace)** : Allure au seuil lactique (format MM:SS)
  - Exemple : "4:30" pour 4min30/km

### 3. ⚖️ **Physique**
- **Poids (weight)** : Poids corporel en kg
  - Important pour le suivi de la composition corporelle
  - Plage : 30-200 kg

---

## 🗄️ Structure de la Base de Données

### Table `athletes` (colonnes ajoutées)
```sql
ALTER TABLE athletes ADD COLUMN:
- max_heart_rate INT
- vma DECIMAL(4,2)              -- Ex: 16.50 km/h
- resting_heart_rate INT
- weight DECIMAL(5,2)            -- Ex: 72.50 kg
- vo2max DECIMAL(5,2)            -- Ex: 55.00 ml/kg/min
- lactate_threshold_pace VARCHAR(10)  -- Ex: "4:30"
- metrics_updated_at TIMESTAMP
```

### Table `athlete_metrics_history` (nouvelle)
```sql
CREATE TABLE athlete_metrics_history (
  id TEXT PRIMARY KEY,
  athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  max_heart_rate INT,
  vma DECIMAL(4,2),
  resting_heart_rate INT,
  weight DECIMAL(5,2),
  vo2max DECIMAL(5,2),
  lactate_threshold_pace VARCHAR(10),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT
);
```
Cette table conserve un historique de toutes les modifications des métriques.

---

## 🛠️ Fichiers Modifiés/Créés

### Backend
- ✅ `backend/migrations/add_athlete_metrics.sql` - Migration base de données
- ✅ `backend/src/routes/athletes.ts` - Endpoints API ajoutés :
  - `PUT /api/athletes/:athleteId/metrics` - Mise à jour des métriques
  - `GET /api/athletes/:athleteId/metrics-history` - Historique

### Frontend
- ✅ `frontend/src/types/index.ts` - Types TypeScript étendus
- ✅ `frontend/src/components/AthleteMetrics.tsx` - Composant modal (419 lignes)
- ✅ `frontend/src/styles/AthleteMetrics.css` - Styles du modal (720 lignes)
- ✅ `frontend/src/components/AthleteList.tsx` - Bouton "Gérer les métriques"
- ✅ `frontend/src/pages/AthletesManagementPage.tsx` - Intégration du modal
- ✅ `frontend/src/styles/AthletesManagement.css` - Styles des badges métriques

---

## 🎨 Interface Utilisateur

### 1. **Modal de Gestion des Métriques**
Le composant `AthleteMetrics` offre :

#### Formulaire de Saisie (3 sections)
```
┌─────────────────────────────────────────────┐
│  ⚙️ Métriques de [Nom Athlète]        ✕    │
├─────────────────────────────────────────────┤
│                                             │
│  ❤️ Données Cardiaques                     │
│  ┌─────────────┐  ┌─────────────┐         │
│  │ FC Max      │  │ FC Repos    │         │
│  │ [180] bpm   │  │ [60] bpm    │         │
│  └─────────────┘  └─────────────┘         │
│                                             │
│  🏃 Performance                             │
│  ┌─────────────┐  ┌─────────────┐         │
│  │ VMA         │  │ VO2 Max     │         │
│  │ [16.5] km/h │  │ [55.0]      │         │
│  └─────────────┘  └─────────────┘         │
│  ┌─────────────┐                           │
│  │ Allure Seuil│                           │
│  │ [4:30]      │                           │
│  └─────────────┘                           │
│                                             │
│  ⚖️ Physique                                │
│  ┌─────────────┐                           │
│  │ Poids       │                           │
│  │ [72.5] kg   │                           │
│  └─────────────┘                           │
│                                             │
│  📝 Notes                                   │
│  ┌──────────────────────────────────────┐  │
│  │ Notes sur cette mise à jour...       │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  [💾 Enregistrer les métriques]            │
└─────────────────────────────────────────────┘
```

#### Zones d'Entraînement Cardiaques (calculées automatiquement)
Basées sur la méthode de la Réserve Cardiaque (HRR) :
- **Zone 1 - Récupération** : 50-60% (Bleu)
- **Zone 2 - Endurance fondamentale** : 60-75% (Vert)
- **Zone 3 - Tempo** : 75-85% (Jaune)
- **Zone 4 - Seuil** : 85-92% (Orange)
- **Zone 5 - VO2 Max** : 92-100% (Rouge)

#### Allures d'Entraînement VMA (calculées automatiquement)
- **100% VMA** : Vitesse maximale
- **95% VMA** : Intervalles courts
- **85% VMA** : Seuil anaérobie
- **75% VMA** : Endurance active
- **65% VMA** : Récupération active

#### Historique des Métriques
- Liste chronologique inversée (plus récent en haut)
- Affichage des changements avec notes
- Limite : 50 dernières entrées

### 2. **Affichage dans la Liste des Athlètes**
```
┌────────────────────────────────────────┐
│  👤 Jean Dupont                        │
│  jean.dupont@example.com               │
│  ────────────────────────────────────  │
│  Âge: 25                               │
│  Niveau: Intermédiaire                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  [❤️ 180 bpm] [🏃 VMA: 16.5] [⚖️ 72kg]│
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  [👁️ Voir profil] [⚙️ Gérer métriques]│
│  [🗑️ Supprimer]                        │
└────────────────────────────────────────┘
```

---

## 🔌 API Endpoints

### 1. Mise à Jour des Métriques
```http
PUT /api/athletes/:athleteId/metrics
Authorization: Bearer <token>
Content-Type: application/json

{
  "max_heart_rate": 180,
  "vma": 16.5,
  "resting_heart_rate": 60,
  "weight": 72.5,
  "vo2max": 55.0,
  "lactate_threshold_pace": "4:30",
  "notes": "Nouvelle évaluation après 3 mois d'entraînement"
}
```

**Réponse** :
```json
{
  "id": "athlete-123",
  "user_id": "user-456",
  "coach_id": "coach-789",
  "max_heart_rate": 180,
  "vma": 16.5,
  "resting_heart_rate": 60,
  "weight": 72.5,
  "vo2max": 55.0,
  "lactate_threshold_pace": "4:30",
  "metrics_updated_at": "2026-02-05T14:30:00Z",
  ...
}
```

### 2. Récupération de l'Historique
```http
GET /api/athletes/:athleteId/metrics-history
Authorization: Bearer <token>
```

**Réponse** :
```json
[
  {
    "id": "history-001",
    "athlete_id": "athlete-123",
    "max_heart_rate": 180,
    "vma": 16.5,
    "weight": 72.5,
    "recorded_at": "2026-02-05T14:30:00Z",
    "notes": "Nouvelle évaluation après 3 mois"
  },
  {
    "id": "history-002",
    "athlete_id": "athlete-123",
    "max_heart_rate": 178,
    "vma": 16.0,
    "weight": 73.0,
    "recorded_at": "2025-11-01T10:00:00Z",
    "notes": "Évaluation initiale"
  }
]
```

---

## 🧮 Calculs Automatiques

### 1. Zones Cardiaques (Méthode Karvonen - HRR)
```typescript
const hrr = max_heart_rate - resting_heart_rate; // Réserve cardiaque
const zone_min = resting_heart_rate + (hrr * percent_min);
const zone_max = resting_heart_rate + (hrr * percent_max);
```

**Exemple** : FC Max = 180, FC Repos = 60
- HRR = 180 - 60 = 120
- Zone Endurance (60-75%) = 60 + (120 × 0.6) à 60 + (120 × 0.75) = **132-150 BPM**

### 2. Allures VMA
```typescript
const pace_min_per_km = 60 / vma_km_h;
const minutes = Math.floor(pace_min_per_km);
const seconds = Math.round((pace_min_per_km - minutes) * 60);
```

**Exemple** : VMA = 16 km/h
- Allure VMA 100% = 60 / 16 = 3.75 min/km = **3:45 /km**
- Allure VMA 85% (Seuil) = 60 / (16 × 0.85) = 4.41 min/km = **4:25 /km**

---

## 🚀 Guide d'Utilisation

### Pour les Coachs

#### 1. Accéder aux Métriques d'un Athlète
1. Aller sur **"🏃 Mes Athlètes"** dans le menu
2. Cliquer sur **"⚙️ Gérer les métriques"** sur la carte de l'athlète
3. Le modal s'ouvre avec le formulaire

#### 2. Renseigner les Métriques
1. **Obligatoires** : Aucune (toutes optionnelles)
2. **Recommandées** :
   - **FC Max** + **FC Repos** → Calcul des zones cardiaques
   - **VMA** → Calcul des allures d'entraînement
3. Ajouter des **notes** pour expliquer le contexte
4. Cliquer sur **"💾 Enregistrer les métriques"**

#### 3. Consulter les Zones Calculées
- Les zones s'affichent automatiquement sous le formulaire
- **Zones Cardiaques** : Bandes colorées avec BPM et %
- **Allures VMA** : Cartes avec allure (min/km) et vitesse (km/h)

#### 4. Voir l'Historique
1. Cliquer sur **"📊 Afficher l'historique"**
2. Voir toutes les modifications passées
3. Chaque entrée affiche date, métriques modifiées et notes

---

## 🎯 Cas d'Usage

### Cas 1 : Nouvel Athlète
**Situation** : Premier contact avec un athlète

**Actions** :
1. Créer le profil athlète
2. Ouvrir "Gérer les métriques"
3. Renseigner les métriques connues (FC Max, poids, niveau estimé)
4. Ajouter note : "Évaluation initiale - à affiner"
5. Planifier un test VMA dans 2 semaines

### Cas 2 : Après un Test VMA
**Situation** : L'athlète vient de faire un test VMA

**Actions** :
1. Ouvrir les métriques de l'athlète
2. Mettre à jour :
   - VMA : 16.5 km/h
   - FC Max observée : 182 BPM
3. Ajouter note : "Test piste 6×400m - Conditions : 15°C, vent nul"
4. Consulter les nouvelles allures d'entraînement calculées
5. Adapter les séances futures

### Cas 3 : Suivi de Progression
**Situation** : Réévaluation après 3 mois d'entraînement

**Actions** :
1. Ouvrir les métriques
2. Mettre à jour toutes les métriques
3. Comparer avec l'historique (bouton "Afficher l'historique")
4. Observer la progression :
   - VMA : 15.8 → 16.5 (+0.7 km/h) ✅
   - FC Repos : 65 → 60 (-5 BPM) ✅
   - Poids : 75 → 72.5 kg (-2.5 kg) ✅
5. Ajuster les objectifs

---

## 🔒 Sécurité

### Contrôles d'Accès
- **Mise à jour** : Uniquement le coach de l'athlète
- **Lecture** : Coach ou athlète lui-même
- **Vérification** : `WHERE athlete_id = $1 AND coach_id = $2`

### Validation des Données
```typescript
// Frontend
max_heart_rate: min="100" max="220"
resting_heart_rate: min="30" max="100"
vma: min="8" max="25" step="0.1"
weight: min="30" max="200" step="0.1"
lactate_threshold_pace: pattern="[0-9]{1,2}:[0-5][0-9]"
```

---

## 📱 Responsive Design

### Desktop (>1200px)
- Modal : 1200px largeur
- Formulaire : 3 colonnes (Cardiaque | Performance | Physique)
- Zones : 5 colonnes

### Tablet (768-1200px)
- Modal : 90% largeur
- Formulaire : 2 colonnes
- Zones : 3 colonnes

### Mobile (<768px)
- Modal : 95% largeur
- Formulaire : 1 colonne
- Zones : 1 colonne

---

## 🧪 Tests

### Test 1 : Création de Métriques
```bash
# 1. Ouvrir la page athlètes
# 2. Cliquer "Gérer les métriques" sur un athlète
# 3. Remplir :
FC Max: 180
FC Repos: 60
VMA: 16.5
Poids: 72.5
# 4. Vérifier que les zones s'affichent correctement
# 5. Enregistrer
# 6. Vérifier que les badges apparaissent sur la carte
```

### Test 2 : Calculs de Zones
```bash
# Input: FC Max = 180, FC Repos = 60
# Expected:
Zone Récupération: 90-96 BPM
Zone Endurance: 132-150 BPM
Zone Tempo: 150-162 BPM
Zone Seuil: 162-170 BPM
Zone VO2 Max: 170-180 BPM
```

### Test 3 : Historique
```bash
# 1. Créer métriques initiales
# 2. Modifier les métriques avec notes
# 3. Afficher l'historique
# 4. Vérifier que 2 entrées apparaissent
# 5. Vérifier ordre chronologique inverse
```

---

## 🐛 Dépannage

### Problème : Modal ne s'ouvre pas
**Solution** : Vérifier que `AthleteMetrics.tsx` est bien importé

### Problème : Zones ne s'affichent pas
**Cause** : FC Max ou FC Repos manquantes
**Solution** : Renseigner les deux valeurs

### Problème : Erreur 403 lors de la sauvegarde
**Cause** : L'utilisateur n'est pas le coach de l'athlète
**Solution** : Vérifier les permissions

### Problème : Historique vide
**Cause** : Aucune note fournie lors des updates
**Solution** : L'historique ne sauvegarde que si des notes sont ajoutées ou si des métriques clés changent

---

## 📊 Base de Données - Statistiques

### Requête : Athlètes avec Métriques Complètes
```sql
SELECT 
  COUNT(*) as total_athletes,
  COUNT(max_heart_rate) as with_fc_max,
  COUNT(vma) as with_vma,
  COUNT(weight) as with_weight
FROM athletes;
```

### Requête : Progression VMA Moyenne
```sql
SELECT 
  athlete_id,
  MIN(vma) as vma_initial,
  MAX(vma) as vma_current,
  MAX(vma) - MIN(vma) as progression
FROM athlete_metrics_history
WHERE vma IS NOT NULL
GROUP BY athlete_id
ORDER BY progression DESC;
```

---

## 🎓 Ressources Complémentaires

### Méthodes de Calcul
- **Zones Cardiaques** : Méthode Karvonen (HRR)
- **VMA** : Test Léger-Boucher ou Cooper
- **VO2 Max** : Formule de Cooper ou test laboratoire

### Valeurs de Référence

#### VMA (Vitesse Maximale Aérobie)
- Débutant : 12-14 km/h
- Intermédiaire : 14-16 km/h
- Avancé : 16-18 km/h
- Expert : 18-22 km/h

#### VO2 Max (ml/kg/min)
- Hommes moyens : 35-40
- Hommes entraînés : 50-60
- Hommes élite : 70-85
- Femmes moyens : 27-30
- Femmes entraînées : 40-50
- Femmes élite : 60-75

---

## ✅ Checklist de Déploiement

- [x] Migration SQL appliquée
- [x] Endpoints backend créés
- [x] Types TypeScript définis
- [x] Composant AthleteMetrics créé
- [x] Styles CSS ajoutés
- [x] Intégration dans AthletesManagementPage
- [x] Badges métriques sur cartes athlètes
- [x] Calculs zones cardiaques
- [x] Calculs allures VMA
- [x] Historique des métriques
- [x] Responsive design
- [x] Documentation complète

---

## 🚀 Prochaines Améliorations Possibles

1. **Graphiques de Progression**
   - Chart.js pour visualiser l'évolution
   - Comparaison avant/après

2. **Export PDF**
   - Fiche athlète complète avec métriques
   - Zones d'entraînement personnalisées

3. **Notifications**
   - Rappel de mise à jour des métriques (tous les 3 mois)
   - Alerte si écart important détecté

4. **Tests Automatisés**
   - Tests de VMA intégrés au calendrier
   - Calcul automatique depuis les activités

5. **Métriques Additionnelles**
   - Puissance critique (FTP)
   - Indice d'endurance
   - Indice de fatigue

---

**Date de création** : 5 février 2026  
**Auteur** : GitHub Copilot  
**Version** : 1.0.0  
**Status** : ✅ Production Ready
