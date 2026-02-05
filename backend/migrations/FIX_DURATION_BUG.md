# Fix Activity Duration Bug

## Problème identifié

La durée des activités importées via GPX était incorrectement stockée **en minutes au lieu de secondes** dans la base de données.

### Cause du bug

Dans le fichier `backend/src/utils/gpxParser.ts`, ligne 70, la durée était calculée comme suit :

```typescript
// ❌ AVANT (incorrect)
const duration = startTime && endTime 
  ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60) 
  : 0;
```

La valeur était divisée par 1000 (millisecondes → secondes) **puis encore par 60** (secondes → minutes), mais était ensuite traitée comme des secondes dans l'application.

### Symptôme

Une course de 14.65 km avec une durée réelle de ~69 minutes (4140 secondes) était affichée comme "1min 09s" au lieu de "1h 09min".

## Solution appliquée

### 1. Correction du parser GPX

**Fichier modifié :** `backend/src/utils/gpxParser.ts`

```typescript
// ✅ APRÈS (correct)
const duration = startTime && endTime 
  ? Math.floor((endTime.getTime() - startTime.getTime()) / 1000) 
  : 0;
```

Les calculs de vitesse et d'allure ont également été mis à jour pour utiliser correctement la durée en secondes.

### 2. Migration des données existantes

**Fichier créé :** `backend/migrations/fix_activity_duration.sql`

Pour corriger les activités déjà en base de données, nous multiplions la durée par 60 pour toutes les activités importées via GPX.

### 3. Script de migration automatique

**Fichier créé :** `backend/migrations/run-duration-fix.ts`

Script TypeScript qui :
- Identifie les activités affectées
- Affiche un aperçu des changements
- Demande confirmation
- Applique la migration de manière transactionnelle

## Comment exécuter la migration

### Méthode 1 : Script automatique (recommandé)

```bash
cd backend
npx tsx migrations/run-duration-fix.ts
```

### Méthode 2 : SQL manuel

```bash
cd backend
psql -U postgres -d coaching_db -f migrations/fix_activity_duration.sql
```

## Vérification

Après la migration, vérifiez qu'une activité s'affiche correctement :

```sql
SELECT title, duration, distance, avg_pace, start_date
FROM completed_activities
WHERE source = 'gpx'
ORDER BY start_date DESC
LIMIT 5;
```

La durée devrait maintenant être en secondes (ex: 4140 pour 1h09min).

## Impact

- ✅ Nouvelles importations GPX : Durée correcte dès l'import
- ✅ Activités existantes : Nécessitent la migration
- ✅ Activités manuelles : Non affectées (déjà en secondes)
- ✅ Calculs d'allure : Maintenant corrects

## Tests à effectuer

1. Importer un nouveau fichier GPX
2. Vérifier l'affichage de la durée dans la modal d'activité
3. Vérifier que l'allure moyenne est cohérente
4. Vérifier les statistiques du dashboard

## Date de correction

5 février 2026
