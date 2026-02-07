# 🔒 Plan d'Amélioration de la Sécurité

**Score initial : 65/100** ⚠️  
**Score actuel : ~78/100** 🟡  
**Objectif : 90/100** 🎯

---

## ✅ COMPLÉTÉ

### 1. Vérifier toutes les requêtes SQL (Protection Injection SQL)
**Status**: ✅ **FAIT** - Toutes les requêtes utilisent des paramètres `$1, $2...`

### 2. Générer un JWT Secret fort
**Status**: ✅ **FAIT**
- Secret fort 512-bit généré dans `.env.production`
- Template configuré pour production
**Temps réel**: 5 min

### 3. Forcer HTTPS en production
**Status**: ✅ **FAIT**
- Middleware HTTPS ajouté dans `backend/src/index.ts`
- Vérifie `x-forwarded-proto` header
- Redirection 301 vers HTTPS si nécessaire
**Temps réel**: 15 min

### 4. Validation Zod sur routes critiques
**Status**: ✅ **FAIT**
- Schémas Zod créés dans `backend/src/utils/validation.ts`
- Validation appliquée aux routes auth (register, login)
- Schémas prêts pour athletes, sessions, messages, etc.
**Temps réel**: 2 heures

### 5. Helmet Configuration Renforcée
**Status**: ✅ **FAIT**
- CSP strict en production (pas de unsafe-inline)
- HSTS avec preload (1 an)
- Headers de sécurité additionnels (noSniff, xssFilter, referrerPolicy)
**Temps réel**: 30 min

### 6. CORS Dynamique Amélioré
**Status**: ✅ **FAIT**
- Validation callback-based
- Origins différentes dev/prod
- Credentials et méthodes configurées
**Temps réel**: 20 min

### 7. Sanitization XSS
**Status**: ✅ **FAIT**
- Librairie `xss` installée
- Module `backend/src/utils/sanitization.ts` créé
- Fonctions: `sanitizeInput`, `sanitizePlainText`, `sanitizeEmail`, `sanitizeObject`
- Appliqué aux routes auth et athletes
- Middleware global `sanitizeRequest` créé
**Temps réel**: 3 heures

### 8. Chiffrement des données sensibles
**Status**: ✅ **FAIT**
- Module `backend/src/utils/encryption.ts` créé
- AES-256-GCM pour données médicales
- Clé de chiffrement 256-bit générée
- Chiffrement appliqué: `max_heart_rate`, `resting_heart_rate`, `weight`, `vo2max`
- Fonction `decryptAthleteData()` pour lecture
- Clé ajoutée à `.env` et `.env.production`
**Temps réel**: 4 heures

### 9. Middleware de Sécurité Global
**Status**: ✅ **FAIT**
- `backend/src/middleware/security.ts` créé
- `sanitizeRequest`: Sanitize body/query/params
- `additionalSecurityHeaders`: Headers supplémentaires
- Appliqué globalement dans `index.ts`
**Temps réel**: 1 heure

### 10. Console.logs Débogage Supprimés
**Status**: ✅ **FAIT**
- Tous les console.log de debug retirés
- Mot de passe temporaire retiré de la console (risque sécurité)
**Temps réel**: 30 min

---

## 🔴 PRIORITÉ 1 - CRITIQUES (À faire AVANT production)
import crypto from 'crypto';

const algorithm = 'aes-256-gcm';
const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

function encrypt(text: string) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}
```
**Temps**: 3-4 heures

---

## 🟡 PRIORITÉ 3 - MOYENNES (Amélioration continue)

### 9. Logging & Monitoring
- Winston pour logs structurés
- Sentry pour tracking d'erreurs
- Logs d'audit (qui a accédé à quoi)

**Temps**: 2-3 heures

### 10. Rate Limiting en production
- Retirer le skip pour localhost
- Configurer des limites strictes

**Temps**: 30 min

### 11. Validation MIME des fichiers
```typescript
import { fileTypeFromBuffer } from 'file-type';

const buffer = await fs.readFile(file.path);
const type = await fileTypeFromBuffer(buffer);

if (!['image/jpeg', 'image/png', 'application/gpx+xml'].includes(type?.mime)) {
  throw new Error('Invalid file type');
}
```
**Temps**: 1 heure

---

## 🔵 PRIORITÉ 4 - CONFORMITÉ LÉGALE (Avant lancement public)

### 12. RGPD/GDPR
- [ ] Politique de confidentialité
- [ ] Consentement explicite
- [ ] Droit à l'oubli (endpoint DELETE /users/me)
- [ ] Portabilité des données (export JSON)
- [ ] Notification de violation (< 72h)

**Temps**: 1-2 jours (rédaction + développement)

### 13. HDS (Hébergement Données de Santé) - France
⚠️ **ATTENTION**: Si vous traitez des données de santé en France, vous devez :
- Héberger chez un hébergeur certifié HDS
- Avoir une politique de sécurité documentée
- Faire un audit de sécurité annuel

**Coût**: 5000-15000€/an

---

## 📋 Checklist Pre-Production

Avant de mettre en production, vérifier :

- [ ] JWT_SECRET changé (256 bits minimum)
- [ ] HTTPS forcé
- [ ] Rate limiting activé
- [ ] CSRF protection active
- [ ] Validation Zod sur toutes les routes
- [ ] XSS sanitization
- [ ] Logs d'erreurs configurés (Sentry)
- [ ] Monitoring actif
- [ ] Backups automatiques DB
- [ ] Secrets en vault (pas dans .env)
- [ ] npm audit clean
- [ ] Politique de confidentialité
- [ ] CGU/CGV
- [ ] Consentement cookies

---

## 🛠️ Quick Wins (30 minutes chrono)

Améliorations rapides pour gagner +10 points :

1. **Générer JWT secret fort** (5 min)
2. **Ajouter helmet headers** (déjà fait ✅)
3. **Rate limiting strict auth** (déjà fait ✅)
4. **npm audit fix** (5 min)
5. **Valider emails avec regex** (5 min)
6. **Limiter longueur des strings** (10 min)

```bash
# Quick wins script
cd backend
npm audit fix
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 📊 Progression attendue

| Phase | Actions | Score | Temps |
|-------|---------|-------|-------|
| **Actuel** | - | 65/100 | - |
| **Quick Wins** | 1-6 actions rapides | 70/100 | 30 min |
| **Phase 1** | Critiques | 80/100 | 1 jour |
| **Phase 2** | Importantes | 85/100 | 2 jours |
| **Phase 3** | Moyennes | 88/100 | 1 jour |
| **Phase 4** | Légal | 90/100 | 2 jours |
| **Total** | - | **90/100** 🎯 | **6-7 jours** |

---

## 🔍 Audit Professionnel Recommandé

Pour une application manipulant des données de santé :

**Budget**: 2000-5000€  
**Durée**: 1-2 semaines  
**Livrables**:
- Rapport de vulnérabilités
- Tests de pénétration
- Recommandations détaillées
- Certification

**Organismes**:
- ANSSI (France)
- Synacktiv
- Intrinsec
- Advens

---

## 📚 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)
- [RGPD - CNIL](https://www.cnil.fr/fr/reglement-europeen-protection-donnees)
- [HDS Certification](https://esante.gouv.fr/labels-certifications/hds)

---

**Dernière mise à jour**: 7 février 2026  
**Contact sécurité**: À définir
