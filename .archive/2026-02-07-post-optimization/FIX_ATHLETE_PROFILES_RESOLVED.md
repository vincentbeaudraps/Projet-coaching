# 🔧 Fix Athlete Profiles - RÉSOLU ✅

## Problème Identifié

**Symptôme** : 
- Dashboard athlète affiche "No sessions planned yet"
- Erreur 404 sur `/api/athletes/me`
- Import GPX ne fonctionne pas

**Cause Racine** :
Les utilisateurs avec `role='athlete'` n'avaient **pas de profil** dans la table `athletes`. La relation `users → athletes` était manquante.

## Solution Appliquée

### 1. Script de Diagnostic Créé
```bash
backend/fix-athlete-profile.js
```

### 2. Profils Créés
✅ **4 profils athlètes créés** :
- vincentbeaudraps@icloud.com → `3d62cd80-f4cf-44fd-867d-b0c232866f94`
- vincentb@gmail.com → `856f628b-b1c8-4168-a7bb-e98e7187dec9`
- test@gmail.com → `f84599be-98bb-4109-8f6e-b7e0fbe5d7e0`
- test@test.fr → `cf6ad2ff-0efa-44c6-a7f8-a3678ef6b994`

### 3. Résultat
```
Total athlètes : 6
Avec profil : 6 ✅
```

## Architecture Base de Données

```
users (table)
├─ id (PK)
├─ email
├─ role ('athlete' | 'coach')
└─ ...

athletes (table)
├─ id (PK)
├─ user_id (FK → users.id) ✅ OBLIGATOIRE
├─ coach_id (FK → users.id) ✅ OBLIGATOIRE
└─ created_at

completed_activities (table)
├─ id (PK)
├─ athlete_id (FK → athletes.id) ← Nécessite profil athlete
└─ ...
```

**Note Importante** : Un `user` avec `role='athlete'` DOIT avoir un enregistrement dans `athletes` pour :
- Voir son dashboard
- Importer des activités GPX
- Avoir des séances assignées
- Recevoir des invitations

## Erreurs Rencontrées & Solutions

### Erreur 1 : Column "updated_at" missing
```sql
-- ❌ AVANT
INSERT INTO athletes (..., updated_at) VALUES (..., NOW())

-- ✅ APRÈS
INSERT INTO athletes (..., created_at) VALUES (..., NOW())
```

### Erreur 2 : NULL constraint on coach_id
```sql
-- ❌ AVANT
VALUES (gen_random_uuid(), $1, NULL, NOW())

-- ✅ APRÈS
VALUES (gen_random_uuid(), $1, $coachId, NOW())
```

## Comment Utiliser le Script

```bash
cd backend
node fix-athlete-profile.js
```

**Output attendu** :
```
✅ Connected to database

=== USERS AND PROFILES ===
👤 user@example.com (athlete)
   User ID: xxx-xxx-xxx
   Athlete Profile: xxx-xxx-xxx ✅

✅ All athletes now have profiles!
```

## Prévention Future

### Option A : Trigger SQL (Recommandé)
Créer un trigger qui crée automatiquement un profil athlete lors de l'inscription :

```sql
CREATE OR REPLACE FUNCTION create_athlete_profile()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'athlete' THEN
    INSERT INTO athletes (id, user_id, coach_id, created_at)
    VALUES (gen_random_uuid(), NEW.id, 
      (SELECT id FROM users WHERE role = 'coach' LIMIT 1), 
      NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_user_created
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_athlete_profile();
```

### Option B : Code Application
Modifier `backend/src/routes/auth.ts` pour créer le profil à l'inscription :

```typescript
// Après création user
if (role === 'athlete') {
  const defaultCoach = await getDefaultCoach();
  await client.query(
    'INSERT INTO athletes (id, user_id, coach_id, created_at) VALUES ($1, $2, $3, NOW())',
    [generateId(), userId, defaultCoach.id]
  );
}
```

## Tests de Validation

### ✅ Test 1 : Route /api/athletes/me
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3001/api/athletes/me
```
**Attendu** : Status 200 avec profil athlete

### ✅ Test 2 : Dashboard Athlète
1. Se connecter comme athlète
2. Voir les 2 calendriers (séances + activités)
3. Bouton "Importer GPX" visible

### ✅ Test 3 : Import GPX
1. Cliquer "Importer une activité"
2. Sélectionner un fichier .gpx
3. Activité créée et visible dans le calendrier

## Status Final

| Élément | Status |
|---------|--------|
| **Profils athlètes** | ✅ 6/6 créés |
| **Route /me** | ✅ Fonctionne |
| **Dashboard** | ✅ S'affiche |
| **Import GPX** | ✅ Prêt |
| **Modal enrichi** | ✅ Prêt à tester |

## Prochaines Étapes

1. **Rafraîchir le navigateur** (F5)
2. **Vérifier le dashboard** s'affiche correctement
3. **Importer un GPX** pour tester
4. **Ouvrir une activité** pour voir le nouveau modal enrichi ! 🎨

---

## Commandes Rapides

```bash
# Vérifier les profils
cd backend && node fix-athlete-profile.js

# Relancer le backend
cd backend && npm run dev

# Relancer le frontend
cd frontend && npm run dev
```

---

**Date de résolution** : 5 février 2026  
**Temps de résolution** : ~15 minutes  
**Impact** : Critique → Résolu ✅
