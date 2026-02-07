# 🎯 Corrections Finales - Volume Annuel & Erreurs /athlete/races

**Date**: 6 février 2026  
**Statut**: ✅ VOLUME ANNUEL IMPLÉMENTÉ | 🔍 ERREURS /races EN INVESTIGATION

---

## ✅ PARTIE 1: Volume Annuel Manuel - TERMINÉ

### 📝 Résumé de l'implémentation

**Objectif**: Permettre aux athlètes de saisir manuellement leur volume annuel de course (en kilomètres), en complément du calcul automatique.

### 🗄️ Base de Données

**Fichier**: `backend/migrations/add_annual_volume.sql`

- ✅ Table `annual_volume` créée
- ✅ Contrainte unique sur `(athlete_id, year)`
- ✅ Cascade delete si athlète supprimé
- ✅ Migration exécutée avec succès

```sql
CREATE TABLE IF NOT EXISTS annual_volume (
  id TEXT PRIMARY KEY,
  athlete_id TEXT NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  volume_km DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(athlete_id, year)
);
```

### 🔌 API Backend

**Fichier**: `backend/src/routes/athletes.ts`

✅ **3 nouveaux endpoints**:

1. `GET /api/athletes/me/annual-volumes` - Liste tous les volumes
2. `POST /api/athletes/me/annual-volumes` - Ajoute/met à jour un volume
3. `DELETE /api/athletes/me/annual-volumes/:year` - Supprime un volume

### 🎨 Interface Frontend

**Fichiers modifiés**:
- `frontend/src/pages/AthleteEnrichedDashboard.tsx` (+110 lignes)
- `frontend/src/services/api.ts` (+6 lignes)
- `frontend/src/styles/AthleteEnrichedDashboard.css` (+55 lignes)

**Fonctionnalités**:
- ✅ Affichage prioritaire: Manuel > Auto
- ✅ Liste des 5 dernières années
- ✅ Modal d'ajout avec validation
- ✅ Bouton de suppression par année
- ✅ Gestion gracieuse des erreurs
- ✅ Design cohérent avec le reste du dashboard

### 📊 Logique d'affichage

```
Volume affiché pour l'année courante:
├─ Volume manuel existe pour 2026?
│  ├─ OUI → Affiche 2500 km (manuel) ✅
│  └─ NON → Affiche calcul auto depuis training_sessions
```

### 🎯 Cas d'usage

**Scénario 1**: Athlète sans séances enregistrées
- Peut saisir manuellement ses volumes historiques
- Ex: 2023 = 2000 km, 2024 = 2300 km, 2025 = 2800 km

**Scénario 2**: Athlète avec séances enregistrées
- Calcul auto: 1500 km (depuis Janvier)
- Peut ajouter volume manuel si calcul incorrect
- Ex: Séances manquantes → Saisie manuelle 1800 km

**Scénario 3**: Mise à jour
- Volume 2026 déjà saisi: 2000 km
- Athlète modifie → 2200 km
- Backend détecte doublon et fait UPDATE (pas INSERT)

---

## 🔍 PARTIE 2: Erreurs sur /athlete/races - EN COURS

### ❌ Symptômes observés

**Page**: `http://localhost:5175/athlete/races`
**Erreur**: Messages d'erreur rouges affichés ("Network Error")

### 🧪 Hypothèses à tester

#### Hypothèse 1: Table `athlete_records` manquante
- ❌ REJETÉE: Table existe et est correctement structurée
- Vérifié via `psql -c "\d athlete_records"`

#### Hypothèse 2: Endpoint API non fonctionnel
- **À tester**: `GET /api/athletes/me/records`
- **Statut**: En investigation

#### Hypothèse 3: Erreur d'authentification
- **À vérifier**: Token JWT valide?
- **Statut**: À tester

#### Hypothèse 4: Données corrompues
- **À vérifier**: Y a-t-il des records dans la table?
- **Statut**: À tester

### 🔧 Actions à effectuer

1. ✅ Vérifier structure table `athlete_records`
2. ⏳ Tester endpoint API directement (curl)
3. ⏳ Vérifier logs backend (console)
4. ⏳ Vérifier Network tab (DevTools)
5. ⏳ Vérifier données dans la table

### 📝 Logs à analyser

**Backend**: `/Users/vincent/Projet site coaching/Projet-coaching/backend`
```bash
# Vérifier les logs
tail -f logs/error.log  # Si existant
# ou
# Regarder console où tourne npm run dev
```

**Frontend**: Browser DevTools
```
1. Ouvrir http://localhost:5175/athlete/races
2. F12 → Network tab
3. Filtrer XHR/Fetch
4. Identifier requête en échec
5. Voir Status Code + Response
```

### 🧪 Test Manuel API

```bash
# 1. Se connecter et récupérer token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"athlete@test.com","password":"password"}'

# 2. Tester endpoint records
TOKEN="<votre_token>"
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/athletes/me/records
```

### 🎯 Résultat attendu

```json
[
  {
    "id": "rec_123",
    "athlete_id": "ath_456",
    "distance_type": "10km",
    "distance_km": 10.0,
    "time_seconds": 2350,
    "pace": "3:55",
    "date_achieved": "2026-01-15",
    ...
  }
]
```

---

## 📊 Fichiers Modifiés - Récapitulatif

### Backend (2 fichiers)

1. **`backend/migrations/add_annual_volume.sql`** (NOUVEAU)
   - Table annual_volume
   - Indexes
   - Commentaires

2. **`backend/src/routes/athletes.ts`** (+120 lignes)
   - GET /me/annual-volumes
   - POST /me/annual-volumes
   - DELETE /me/annual-volumes/:year

### Frontend (3 fichiers)

1. **`frontend/src/services/api.ts`** (+6 lignes)
   - getAnnualVolumes()
   - saveAnnualVolume()
   - deleteAnnualVolume()

2. **`frontend/src/pages/AthleteEnrichedDashboard.tsx`** (+110 lignes)
   - Interface AnnualVolume
   - States: annualVolumes, addVolumeMode, volumeForm
   - Fonctions: handleAddVolume(), handleDeleteVolume()
   - Modal d'ajout
   - Liste des volumes

3. **`frontend/src/styles/AthleteEnrichedDashboard.css`** (+55 lignes)
   - .volume-list
   - .volume-item
   - .volume-year-label
   - .volume-km-value
   - .btn-delete-small

---

## ✅ Tests à Effectuer

### Test 1: Volume Annuel Manuel

```bash
# 1. Ouvrir dashboard
http://localhost:5175/athlete/profile

# 2. Carte "Volume annuel" → Cliquer "+"
# 3. Saisir: Année=2025, Volume=2800
# 4. Cliquer "Enregistrer"
# 5. ✅ Vérifier affichage dans la liste

# 6. Re-saisir: Année=2025, Volume=3000
# 7. ✅ Vérifier UPDATE (pas de doublon)

# 8. Cliquer 🗑️ sur un volume
# 9. ✅ Vérifier suppression
```

### Test 2: Erreurs /athlete/races

```bash
# 1. Ouvrir page historique
http://localhost:5175/athlete/races

# 2. Observer si erreur rouge apparaît
# 3. F12 → Network tab
# 4. Identifier requête en échec
# 5. Noter: URL, Status, Response

# 6. Console backend
# 7. Noter: Logs d'erreur si présents
```

---

## 🚀 Prochaines Étapes

1. ✅ **Volume annuel manuel** - TERMINÉ
2. ⏳ **Corriger erreurs /athlete/races** - EN COURS
   - Identifier la source de l'erreur
   - Corriger l'API ou le frontend
   - Tester la correction

3. 🔜 **Améliorations futures**:
   - Graphiques Chart.js pour volume annuel
   - Export PDF du profil athlète
   - Prédictions de performances basées VDOT
   - Upload photo de profil

---

## 📌 Commandes Utiles

```bash
# Backend
cd backend
npm run dev                    # Démarrer
psql -U vincent -d coaching_db # Accéder à la BDD
\d annual_volume               # Structure table

# Frontend  
cd frontend
npm run dev                    # Démarrer

# Tests
curl http://localhost:5000/api/athletes/me/annual-volumes
curl http://localhost:5000/api/athletes/me/records
```

---

**Status global**: Volume annuel ✅ | Erreurs /races 🔍 en investigation
