# 🚀 Quick Start - Dashboard Athlète Enrichi

## En 3 Minutes Chrono ⏱️

### 1. Démarrer le Backend (Terminal 1)
```bash
cd backend
npm run dev
```
✅ Backend écoute sur `http://localhost:3001`

### 2. Démarrer le Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
✅ Frontend disponible sur `http://localhost:5173`

### 3. Se Connecter
1. Ouvrir `http://localhost:5173/login`
2. Se connecter avec un compte **athlète**
3. Accéder à `/athlete/profile`

---

## 🎯 Test Rapide (5 min)

### Test 1 : Éditer le Profil
1. Cliquer **"✏️ Modifier mon profil"**
2. Remplir :
   - Poids : `72`
   - Taille : `178`
   - VMA : `16`
3. Cliquer **"💾 Enregistrer"**
4. ✅ Voir le toast de succès

### Test 2 : Ajouter un Record
1. Sur la carte "Records", cliquer **"+ Ajouter un record"**
2. Remplir :
   - Type : `10km`
   - Temps : `2400` (40 minutes en secondes)
   - Date : `2025-11-15`
3. Observer l'**allure auto-calculée** : `4:00 /km`
4. Cliquer **"🏆 Ajouter le record"**
5. ✅ Record apparaît dans la liste avec VDOT calculé

### Test 3 : Ajouter une Course
1. Sur la carte "Courses", cliquer **"+ Ajouter une course"**
2. Remplir :
   - Nom : `Semi-Marathon de Lyon`
   - Date : `2026-04-15`
   - Distance : `21.1`
   - Label : `Semi-Marathon`
3. Cliquer **"🏁 Ajouter la course"**
4. ✅ Course apparaît avec countdown `J-68`

---

## 📱 URLs Importantes

| Page | URL | Rôle |
|------|-----|------|
| Login | `http://localhost:5173/login` | Tous |
| Dashboard Athlète | `http://localhost:5173/athlete/profile` | Athlète |
| Dashboard Coach | `http://localhost:5173/dashboard` | Coach |

---

## 🔧 Troubleshooting

### Problème : "Athlete profile not found"
**Solution** : L'utilisateur doit avoir un profil athlète dans la BDD
```sql
-- Vérifier
SELECT * FROM athletes WHERE user_id = 'votre-user-id';

-- Si vide, créer
INSERT INTO athletes (id, user_id, coach_id) 
VALUES (gen_random_uuid(), 'user-id', 'coach-id');
```

### Problème : "Token expired"
**Solution** : Se reconnecter

### Problème : Dashboard vide
**Solution** : Normal si aucune donnée. Ajouter des records/courses via les modals.

---

## 🎨 Fonctionnalités Clés

| Fonctionnalité | Status | Action |
|----------------|--------|--------|
| Édition profil | ✅ | Bouton "Modifier mon profil" |
| Ajout records | ✅ | Bouton "+ Ajouter un record" |
| Ajout courses | ✅ | Bouton "+ Ajouter une course" |
| Calcul VDOT | ✅ | Automatique sur records |
| Calcul IMC | ✅ | Automatique si poids+taille |
| Countdown | ✅ | Automatique sur courses |
| Stats annuelles | ✅ | Carte "Volume annuel" |

---

## 📚 Documentation Complète

- **Guide complet** : `ATHLETE_DASHBOARD_FINAL_COMPLETE.md`
- **Tests détaillés** : `TEST_ATHLETE_ENRICHED_DASHBOARD.md`
- **Implémentation** : `ATHLETE_ENRICHED_DASHBOARD_COMPLETE.md`

---

## ✅ Checklist Validation

- [ ] Backend démarré
- [ ] Frontend démarré
- [ ] Connexion réussie
- [ ] Dashboard s'affiche
- [ ] Modal profil fonctionne
- [ ] Modal record fonctionne
- [ ] Modal course fonctionne
- [ ] Calculs automatiques corrects
- [ ] Toast confirmations visibles

---

**🎉 Prêt à l'emploi en 3 minutes !**
