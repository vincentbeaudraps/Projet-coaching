# ⚡ FIX RAPIDE - Table performance_records

## 🔧 Problème Corrigé

**Erreur 500** : Table `performance_records` n'existe pas  
**Solution** : Utiliser `athlete_records` à la place

---

## 🚀 Action Immédiate

### 1. Redémarrer le Backend (OBLIGATOIRE)

```bash
# Dans le terminal backend
# Appuyer sur Ctrl+C pour arrêter
cd backend && npm run dev
```

✅ Attendre : `Server running on port 3000`

### 2. Rafraîchir la Page

```
http://localhost:5173/athletes/:id
```

**Ou** : `Cmd+R` / `Ctrl+R` dans le navigateur

---

## ✅ Résultat Attendu

### Avant (Erreur)
```
❌ Erreur 500
❌ "Athlète non trouvé"
❌ Erreur dans console : "performance_records"
```

### Après (Succès)
```
✅ Page charge sans erreur
✅ En-tête athlète visible
✅ 6 cartes statistiques
✅ 4 onglets fonctionnels
✅ Onglet "Performances" affiche les records
```

---

## 🎯 Changement Appliqué

```typescript
// ❌ AVANT
FROM performance_records  // N'existe pas !

// ✅ APRÈS
FROM athlete_records      // Table correcte
```

**Fichier** : `backend/src/routes/athletes.ts`  
**Ligne** : ~1005

---

## 🐛 Si Problème Persiste

### Vérifier les Logs Backend
```bash
# Terminal backend doit afficher :
✅ Server running on port 3000

# PAS d'erreur SQL du type :
❌ relation "performance_records" does not exist
```

### Vérifier la Console Frontend (F12)
```
Network → XHR → 
:3000/api/athletes/.../detailed-stats
Status: 200 ✅ (pas 500 ❌)
```

---

## 📊 Récap des 2 Fixes

### Fix #1 (10 min ago)
```typescript
❌ INTERVAL '${weeks} weeks'
✅ ($2 || ' weeks')::INTERVAL
```

### Fix #2 (Maintenant)
```typescript
❌ FROM performance_records
✅ FROM athlete_records
```

---

## ✅ Checklist Finale

- [x] Code corrigé
- [x] Backend recompilé
- [ ] Backend redémarré ← **FAIRE MAINTENANT**
- [ ] Page rafraîchie
- [ ] Fonctionne sans erreur

---

**Action Requise** : ⚠️ **REDÉMARRER LE BACKEND**

```bash
cd backend && npm run dev
```

*Fix développé le 6 février 2026*
