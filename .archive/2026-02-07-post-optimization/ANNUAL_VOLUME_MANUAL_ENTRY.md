# ✅ Volume Annuel Manuel - Implémentation Complète

**Date**: 6 février 2026  
**Statut**: ✅ IMPLÉMENTÉ

## 🎯 Objectif

Permettre aux athlètes de saisir manuellement leur volume annuel de course à pied (en kilomètres), en complément du calcul automatique basé sur les séances d'entraînement.

---

## 📋 Changements Effectués

### 1. Base de Données ✅

**Fichier**: `backend/migrations/add_annual_volume.sql`

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

**Contraintes**:
- Clé unique sur `(athlete_id, year)` : Un seul volume par année par athlète
- Suppression en cascade si l'athlète est supprimé
- Type TEXT pour id et athlete_id (cohérent avec le schéma existant)

**Migration exécutée**: ✅

---

### 2. Backend API ✅

**Fichier**: `backend/src/routes/athletes.ts`

**3 nouveaux endpoints ajoutés**:

#### GET `/api/athletes/me/annual-volumes`
- Récupère tous les volumes annuels de l'athlète connecté
- Triés par année décroissante
- Authentification JWT requise

#### POST `/api/athletes/me/annual-volumes`
- Ajoute ou met à jour un volume annuel
- **Body**:
  ```json
  {
    "year": 2026,
    "volume_km": 2500.5,
    "notes": "Objectif: 3000 km" // optionnel
  }
  ```
- Si l'année existe déjà → UPDATE
- Sinon → INSERT

#### DELETE `/api/athletes/me/annual-volumes/:year`
- Supprime le volume pour une année spécifique
- Authentification JWT requise

---

### 3. Frontend Service ✅

**Fichier**: `frontend/src/services/api.ts`

**3 nouvelles méthodes dans `athletesService`**:

```typescript
// Annual Volumes (Manual Entry)
getAnnualVolumes: () => api.get('/athletes/me/annual-volumes'),
saveAnnualVolume: (data: { year: number; volume_km: number; notes?: string }) => 
  api.post('/athletes/me/annual-volumes', data),
deleteAnnualVolume: (year: number) => 
  api.delete(`/athletes/me/annual-volumes/${year}`),
```

---

### 4. Frontend UI ✅

**Fichier**: `frontend/src/pages/AthleteEnrichedDashboard.tsx`

#### Nouveaux States
```typescript
const [annualVolumes, setAnnualVolumes] = useState<AnnualVolume[]>([]);
const [addVolumeMode, setAddVolumeMode] = useState(false);
const [volumeForm, setVolumeForm] = useState({
  year: new Date().getFullYear(),
  volume_km: '',
  notes: ''
});
```

#### Nouvelle Interface
```typescript
interface AnnualVolume {
  id: string;
  athlete_id: string;
  year: number;
  volume_km: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

#### Chargement des Données
```typescript
// Dans loadDashboardData()
const volumesRes = await athletesService.getAnnualVolumes();
setAnnualVolumes(volumesRes.data || []);
```

#### Nouvelles Fonctions
- `handleAddVolume()` : Enregistre un volume annuel
- `handleDeleteVolume(year)` : Supprime un volume annuel

#### Carte "Volume Annuel" Mise à Jour

**AVANT** (Automatique uniquement):
```tsx
<div className="stat-value-large">
  {yearlyStats[yearlyStats.length - 1]?.total_km || 0} km
</div>
<div className="stat-label">Cette année</div>
```

**APRÈS** (Priorité manuel > auto):
```tsx
{annualVolumes.find(v => v.year === new Date().getFullYear()) ? (
  <>
    <div className="stat-value-large">
      {annualVolumes.find(v => v.year === new Date().getFullYear())?.volume_km} km
    </div>
    <div className="stat-label">Cette année (manuel)</div>
  </>
) : (
  <>
    <div className="stat-value-large">
      {yearlyStats[yearlyStats.length - 1]?.total_km || 0} km
    </div>
    <div className="stat-label">Cette année (auto)</div>
  </>
)}
```

#### Liste des Volumes
```tsx
<div className="volume-list">
  {annualVolumes.sort((a, b) => b.year - a.year).slice(0, 5).map(volume => (
    <div key={volume.year} className="volume-item">
      <div className="volume-year-label">{volume.year}</div>
      <div className="volume-km-value">{volume.volume_km} km</div>
      <button onClick={() => handleDeleteVolume(volume.year)}>🗑️</button>
    </div>
  ))}
</div>
<button onClick={() => setAddVolumeMode(true)}>
  + Ajouter un volume annuel
</button>
```

#### Modal d'Ajout
```tsx
{addVolumeMode && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h2>📈 Ajouter un volume annuel</h2>
      <input type="number" placeholder="Année" />
      <input type="number" placeholder="Volume (km)" />
      <textarea placeholder="Notes" />
      <button onClick={handleAddVolume}>💾 Enregistrer</button>
    </div>
  </div>
)}
```

---

### 5. CSS ✅

**Fichier**: `frontend/src/styles/AthleteEnrichedDashboard.css`

**Nouveaux styles ajoutés**:

```css
/* Volume List */
.volume-list {
  margin: 1.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.volume-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  border-radius: 8px;
  transition: all 0.2s;
}

.volume-item:hover {
  background: #e5e7eb;
}

.volume-year-label {
  font-weight: 600;
  color: #4b5563;
}

.volume-km-value {
  font-weight: 700;
  color: #7c3aed;
  font-size: 1.1rem;
}

.btn-delete-small {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.2s;
}

.btn-delete-small:hover {
  background: #fee2e2;
  transform: scale(1.1);
}
```

---

## 🧪 Tests à Effectuer

### 1. Test Ajout Volume
1. Se connecter en tant qu'athlète
2. Aller sur `/athlete/profile`
3. Carte "Volume annuel" → Cliquer "+" Ajouter un volume annuel
4. Saisir : Année = 2025, Volume = 2800
5. Cliquer "Enregistrer"
6. ✅ Vérifier que le volume apparaît dans la liste

### 2. Test Mise à Jour
1. Ajouter un volume pour 2026 : 1500 km
2. Re-ajouter un volume pour 2026 : 1800 km
3. ✅ Vérifier que seul 1800 km apparaît (pas de doublon)

### 3. Test Suppression
1. Cliquer sur 🗑️ à côté d'un volume
2. Confirmer
3. ✅ Vérifier que le volume disparaît

### 4. Test Affichage Prioritaire
1. Si volume manuel existe pour 2026 → Affiche volume manuel
2. Sinon → Affiche calcul auto depuis `training_sessions`
3. ✅ Vérifier le label "(manuel)" vs "(auto)"

### 5. Test Backend Direct
```bash
# Récupérer token JWT
TOKEN="<votre_token>"

# GET volumes
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/athletes/me/annual-volumes

# POST volume
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"year":2025,"volume_km":3000,"notes":"Test"}' \
  http://localhost:5000/api/athletes/me/annual-volumes

# DELETE volume
curl -X DELETE \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/athletes/me/annual-volumes/2025
```

---

## 📊 Flux de Données

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUX VOLUME ANNUEL                        │
└─────────────────────────────────────────────────────────────┘

1. CHARGEMENT
   AthleteEnrichedDashboard.tsx
   └─ loadDashboardData()
      ├─ getYearlyStats() → Stats auto (training_sessions)
      └─ getAnnualVolumes() → Volumes manuels (annual_volume)

2. AFFICHAGE PRIORITÉ
   annualVolumes[currentYear] existe ?
   ├─ OUI → Affiche volume manuel + "(manuel)"
   └─ NON → Affiche yearlyStats + "(auto)"

3. AJOUT/MODIFICATION
   User clique "+" → Modal s'ouvre
   └─ Saisit année + volume
      └─ handleAddVolume()
         └─ POST /api/athletes/me/annual-volumes
            ├─ Année existe → UPDATE
            └─ Sinon → INSERT

4. SUPPRESSION
   User clique 🗑️
   └─ handleDeleteVolume(year)
      └─ DELETE /api/athletes/me/annual-volumes/:year

5. BACKEND
   athletes.ts
   ├─ GET /me/annual-volumes → SELECT * FROM annual_volume
   ├─ POST /me/annual-volumes → INSERT/UPDATE annual_volume
   └─ DELETE /me/annual-volumes/:year → DELETE FROM annual_volume
```

---

## ✅ Résumé

| Fonctionnalité | Statut | Fichiers Modifiés |
|----------------|--------|-------------------|
| Table BDD | ✅ | `migrations/add_annual_volume.sql` |
| Routes API | ✅ | `backend/src/routes/athletes.ts` |
| Service Frontend | ✅ | `frontend/src/services/api.ts` |
| Interface UI | ✅ | `frontend/src/pages/AthleteEnrichedDashboard.tsx` |
| Styles CSS | ✅ | `frontend/src/styles/AthleteEnrichedDashboard.css` |
| Gestion Erreurs | ✅ | Try/catch silencieux |
| Tests | ⏳ | À effectuer |

---

## 🚀 Prochaine Étape

**Corriger les erreurs sur `/athlete/races`** (messages d'erreur rouges)
