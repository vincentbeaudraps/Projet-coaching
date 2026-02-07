# 🐛 Fix: Erreur Notifications - req.userId undefined

**Date**: 6 février 2026  
**Statut**: ✅ CORRIGÉ

---

## 🐛 Problème Identifié

### Symptômes
Sur **toutes les pages** (incluant `/athlete/profile`), des erreurs répétées dans les logs backend :

```
Error fetching notifications: TypeError: Cannot read properties of undefined (reading 'userId')
    at file:///Users/vincent/.../backend/src/routes/notifications.ts:12:33

Error fetching unread count: TypeError: Cannot read properties of undefined (reading 'userId')
    at file:///Users/vincent/.../backend/src/routes/notifications.ts:41:33
```

### Cause Racine

**Incohérence entre le middleware d'authentification et les routes notifications**

| Composant | Code | Variable utilisée |
|-----------|------|-------------------|
| **Middleware** `auth.ts` | `req.userId = user.id` | `req.userId` ✅ |
| **Routes** `notifications.ts` | `const userId = (req as any).user.userId` | `req.user.userId` ❌ |

Le middleware définit `req.userId` mais les routes cherchent `req.user.userId` → **undefined**

---

## 🔧 Solution Appliquée

### Fichier Modifié
`backend/src/routes/notifications.ts`

### Corrections (6 occurrences)

#### 1. GET /api/notifications
```typescript
// AVANT ❌
const userId = (req as any).user.userId;

// APRÈS ✅
const userId = req.userId;
```

#### 2. GET /api/notifications/unread-count
```typescript
// AVANT ❌
const userId = (req as any).user.userId;

// APRÈS ✅
const userId = req.userId;
```

#### 3. PUT /api/notifications/:id/read
```typescript
// AVANT ❌
const userId = (req as any).user.userId;

// APRÈS ✅
const userId = req.userId;
```

#### 4. PUT /api/notifications/read-all
```typescript
// AVANT ❌
const userId = (req as any).user.userId;

// APRÈS ✅
const userId = req.userId;
```

#### 5. DELETE /api/notifications/:id
```typescript
// AVANT ❌
const userId = (req as any).user.userId;

// APRÈS ✅
const userId = req.userId;
```

#### 6. DELETE /api/notifications
```typescript
// AVANT ❌
const userId = (req as any).user.userId;

// APRÈS ✅
const userId = req.userId;
```

---

## ✅ Vérification

### Test 1: Backend Logs
```bash
# Avant
Error fetching notifications: TypeError... (x100)
Error fetching unread count: TypeError... (x100)

# Après
Server running on port 3000
✅ Aucune erreur
```

### Test 2: Page Athlete Profile
```
# URL
http://localhost:5173/athlete/profile

# Avant
❌ Messages d'erreur rouges
❌ Logs backend pollués

# Après
✅ Page charge normalement
✅ Aucun message d'erreur
✅ Logs propres
```

### Test 3: Appel API Notifications
```bash
# Terminal
TOKEN="<votre_token>"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/notifications

# Résultat attendu
{
  "notifications": [],
  "total": 0,
  "unreadCount": 0
}
```

---

## 📊 Impact

### Endpoints Affectés (Maintenant Fonctionnels)
- ✅ `GET /api/notifications`
- ✅ `GET /api/notifications/unread-count`
- ✅ `PUT /api/notifications/:id/read`
- ✅ `PUT /api/notifications/read-all`
- ✅ `DELETE /api/notifications/:id`
- ✅ `DELETE /api/notifications`

### Pages Concernées
- ✅ `/athlete/profile` - Plus d'erreurs en console
- ✅ `/athlete/races` - Plus d'erreurs en console
- ✅ `/athlete/sessions` - Plus d'erreurs en console
- ✅ `/coach` - Plus d'erreurs en console
- ✅ **Toutes les pages** - Header avec notifications fonctionne

---

## 🔍 Analyse Technique

### Pourquoi cette erreur ?

1. **Le Header appelle `/api/notifications` en boucle**
   - Composant `Header.tsx` charge les notifications au mount
   - Polling potentiel ou re-renders multiples

2. **Middleware auth.ts est correct**
   ```typescript
   export function authenticateToken(req: Request, res: Response, next: NextFunction) {
     jwt.verify(token, secret, (err: any, user: any) => {
       if (err) return res.status(403).json({ message: 'Invalid token' });
       req.userId = user.id;  // ✅ Définit req.userId
       req.userRole = user.role;
       next();
     });
   }
   ```

3. **Routes notifications étaient incorrectes**
   ```typescript
   // ❌ Tentait d'accéder à req.user.userId (n'existe pas)
   const userId = (req as any).user.userId;
   
   // ✅ Devrait accéder à req.userId (défini par middleware)
   const userId = req.userId;
   ```

### Pourquoi `(req as any).user.userId` ?

Probablement copié-collé depuis un autre projet où :
- Middleware différent : `req.user = decoded` 
- Structure JWT différente : `{ userId: '...', role: '...' }`

Dans notre projet :
- Middleware actuel : `req.userId = user.id`
- Structure JWT : `{ id: '...', role: '...' }`

---

## 🚨 Leçons Apprises

### 1. Cohérence du Code
❌ **Ne pas** utiliser des conventions différentes dans le même projet
✅ **Définir** une convention unique pour l'authentification

### 2. Type Safety
❌ **Éviter** `(req as any)` qui masque les erreurs TypeScript
✅ **Utiliser** types stricts avec déclaration d'extension:
```typescript
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}
```

### 3. Tests
❌ **Ne pas** déployer sans tester les endpoints authentifiés
✅ **Ajouter** des tests pour chaque route protégée

---

## 📝 Commandes Utiles

### Redémarrer Backend
```bash
cd backend
pkill -f nodemon
npm run dev
```

### Vérifier Logs en Temps Réel
```bash
cd backend
# Voir output nodemon dans terminal actif
```

### Tester Notifications
```bash
# 1. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"athlete@test.com","password":"password"}'

# 2. Copier le token
TOKEN="<token_from_step_1>"

# 3. GET notifications
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/notifications

# 4. GET unread count
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/notifications/unread-count
```

---

## ✅ Checklist Finale

- [x] 6 routes notifications corrigées
- [x] Backend redémarré
- [x] Logs propres (aucune erreur répétée)
- [x] Page `/athlete/profile` fonctionne
- [x] Toutes les pages chargent sans erreur console
- [x] Header notifications opérationnel
- [x] Documentation créée

---

## 🎯 Résumé

| Aspect | Avant | Après |
|--------|-------|-------|
| **Routes** | `req.user.userId` ❌ | `req.userId` ✅ |
| **Logs** | 100+ erreurs | 0 erreur |
| **Pages** | Messages rouges | Fonctionnelles |
| **API** | 500 Internal Error | 200 OK |
| **Header** | Notifications KO | Notifications OK |

---

**Problème résolu** : L'incohérence entre le middleware d'authentification et les routes notifications est corrigée. Toutes les pages chargent maintenant sans erreur. ✅
