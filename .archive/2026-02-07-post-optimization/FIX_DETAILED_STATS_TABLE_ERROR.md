# 🔧 FIX: Correction Table dans Detailed Stats

## ❌ PROBLÈME IDENTIFIÉ

L'erreur 500 sur `/api/athletes/:id/detailed-stats` vient de l'utilisation de **mauvaises tables et colonnes** dans les requêtes SQL.

### Requêtes Actuelles (INCORRECTES)
```sql
-- ❌ Utilise performance_records avec des colonnes qui n'existent pas
FROM performance_records pr
WHERE pr.date >= ...  -- ❌ Colonne 'date' n'existe pas (c'est 'recorded_at')
pr.avg_pace           -- ❌ Colonne n'existe pas
pr.elevation_gain     -- ❌ Colonne n'existe pas
pr.perceived_effort   -- ❌ Colonne n'existe pas
```

### Structure Réelle des Tables

**performance_records** (petite table, performances ponctuelles)
- recorded_at (pas 'date')
- actual_distance, actual_duration
- avg_heart_rate, max_heart_rate
- session_id (FK vers training_sessions)
- **PAS** de: date, avg_pace, elevation_gain, perceived_effort, activity_type

**completed_activities** (vraie table d'activités!)
- start_date ✅
- distance, duration ✅
- avg_pace, elevation_gain, perceived_effort ✅
- activity_type ✅
- avg_heart_rate, max_heart_rate ✅

## ✅ SOLUTION

Remplacer `performance_records` par `completed_activities` dans TOUTES les requêtes de la route `detailed-stats`.

### Changements à Faire

**Fichier**: `backend/src/routes/athletes.ts`
**Route**: `GET /:athleteId/detailed-stats` (ligne ~958)

#### 1. Charge hebdomadaire (Query 1)
```typescript
// AVANT (❌)
FROM performance_records pr
LEFT JOIN training_sessions ts ON pr.session_id = ts.id
WHERE pr.athlete_id = $1 
  AND pr.date >= CURRENT_DATE - ($2 || ' weeks')::INTERVAL

// APRÈS (✅)
FROM completed_activities ca
WHERE ca.athlete_id = $1 
  AND ca.start_date >= CURRENT_DATE - ($2 || ' weeks')::INTERVAL
```

#### 2. Activités récentes (Query 2)
```typescript
// AVANT (❌)
FROM performance_records pr
LEFT JOIN training_sessions ts ON pr.session_id = ts.id
WHERE pr.athlete_id = $1 
  AND pr.date >= CURRENT_DATE - INTERVAL '30 days'

// APRÈS (✅)
FROM completed_activities ca
WHERE ca.athlete_id = $1 
  AND ca.start_date >= CURRENT_DATE - INTERVAL '30 days'
```

#### 3. Statistiques globales (Query 4)
```typescript
// AVANT (❌)
FROM performance_records pr
LEFT JOIN training_sessions ts ON pr.session_id = ts.id

// APRÈS (✅)
FROM completed_activities ca
```

#### 4. Distribution zones (Query 5)
```typescript
// AVANT (❌)
FROM performance_records pr
LEFT JOIN training_sessions ts ON pr.session_id = ts.id
WHERE pr.athlete_id = $1 
  AND pr.date >= CURRENT_DATE - INTERVAL '30 days'

// APRÈS (✅)
FROM completed_activities ca
WHERE ca.athlete_id = $1 
  AND ca.start_date >= CURRENT_DATE - INTERVAL '30 days'
```

## 📋 COLONNES À MAPPER

| Ancienne Référence | Nouvelle Référence |
|---|---|
| `pr.date` | `ca.start_date` |
| `COALESCE(pr.actual_distance, ts.distance)` | `ca.distance` |
| `COALESCE(pr.actual_duration, ts.duration)` | `ca.duration` |
| `pr.avg_heart_rate` | `ca.avg_heart_rate` |
| `pr.max_heart_rate` | `ca.max_heart_rate` |
| `pr.avg_pace` | `ca.avg_pace` |
| `pr.elevation_gain` | `ca.elevation_gain` |
| `pr.perceived_effort` | `ca.perceived_effort` |
| `pr.notes` | `ca.notes` |
| `ts.activity_type` | `ca.activity_type` |
| `ts.training_zone` | `ca.training_zone` |

## ⚡ ACTION IMMÉDIATE

1. **Modifier** `backend/src/routes/athletes.ts`
2. **Remplacer** les 4 requêtes SQL dans la route `detailed-stats`
3. **Supprimer** tous les LEFT JOIN vers `training_sessions`
4. **Renommer** les alias `pr` → `ca` (completed_activities)
5. **Sauvegarder** et le backend redémarrera automatiquement (nodemon)
6. **Tester** la page sur le frontend

## 🎯 RÉSULTAT ATTENDU

✅ Page `/athletes/:id` charge sans erreur 500
✅ Graphiques affichent les données réelles
✅ Anomalies détectées si données disponibles
✅ Pas d'erreur SQL dans les logs backend
