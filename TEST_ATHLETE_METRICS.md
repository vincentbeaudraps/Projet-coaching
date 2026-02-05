# 🧪 Guide de Test - Système de Métriques Athlètes

## ✅ Test Rapide (5 minutes)

### Test 1 : Ouverture du Modal ✨
1. **Lancer l'application** (si pas déjà lancée)
   ```bash
   # Terminal 1 - Backend
   cd backend && npm run dev
   
   # Terminal 2 - Frontend
   cd frontend && npm run dev
   ```

2. **Se connecter** en tant que coach
   - Email : `coach@example.com`
   - Password : `password123`

3. **Aller sur "🏃 Mes Athlètes"**
   - Menu principal → Cliquer sur "🏃 Mes Athlètes"

4. **Ouvrir le modal de métriques**
   - Sur une carte athlète → Cliquer sur **"⚙️ Gérer les métriques"**
   - ✅ Le modal doit s'ouvrir avec le formulaire

---

### Test 2 : Renseigner les Métriques 📝

Dans le modal ouvert :

1. **Section ❤️ Données Cardiaques**
   - FC Max : `180`
   - FC Repos : `60`

2. **Section 🏃 Performance**
   - VMA : `16.5`
   - VO2 Max : `55.0`
   - Allure Seuil : `4:30`

3. **Section ⚖️ Physique**
   - Poids : `72.5`

4. **Section 📝 Notes**
   - Écrire : `Test initial - Évaluation après 1 mois d'entraînement`

5. **Cliquer sur "💾 Enregistrer les métriques"**
   - ✅ Message de succès : "Métriques mises à jour avec succès !"
   - ✅ Le modal reste ouvert pour voir les zones

---

### Test 3 : Vérifier les Zones Calculées 🎯

Après enregistrement, descendre dans le modal :

#### ❤️ Zones d'Entraînement Cardiaques
Devrait afficher 5 zones colorées :
- 🔵 **Récupération** : 90-96 bpm (50-60%)
- 🟢 **Endurance fondamentale** : 96-150 bpm (60-75%)
- 🟡 **Tempo** : 150-162 bpm (75-85%)
- 🟠 **Seuil** : 162-170 bpm (85-92%)
- 🔴 **VO2 Max** : 170-180 bpm (92-100%)

✅ **Vérifier** : Les valeurs sont cohérentes avec FC Max=180 et FC Repos=60

#### 🏃 Allures d'Entraînement (VMA)
Devrait afficher 5 cartes avec allures :
- **100% VMA** : ~3:38 /km (16.50 km/h)
- **95% VMA** : ~3:50 /km (15.67 km/h)
- **85% VMA** : ~4:17 /km (14.02 km/h)
- **75% VMA** : ~4:51 /km (12.37 km/h)
- **65% VMA** : ~5:35 /km (10.72 km/h)

✅ **Vérifier** : Les calculs sont cohérents avec VMA=16.5 km/h

---

### Test 4 : Historique 📊

1. **Cliquer sur "📊 Afficher l'historique"**
   - ✅ L'historique s'affiche sous forme de liste

2. **Vérifier l'entrée**
   - Date : Aujourd'hui (5 fév 2026)
   - Métriques : FC Max 180, VMA 16.5, Poids 72.5, VO2 55.0
   - Note : "Test initial - Évaluation après 1 mois..."

3. **Fermer le modal** (cliquer sur ✕)

---

### Test 5 : Affichage sur la Carte Athlète 🎴

Retour sur la page "Mes Athlètes" :

1. **Vérifier les badges de métriques**
   - La carte de l'athlète doit maintenant afficher :
   ```
   [❤️ 180 bpm] [🏃 VMA: 16.5] [⚖️ 72.5 kg]
   ```

2. ✅ **Les métriques sont visibles** en un coup d'œil

---

### Test 6 : Modification des Métriques 🔄

1. **Réouvrir le modal** de métriques du même athlète
   - ✅ Le formulaire doit être **pré-rempli** avec les valeurs précédentes

2. **Modifier une valeur**
   - VMA : `16.5` → `17.0`
   - Ajouter note : `Amélioration après 2 semaines de fractionné`

3. **Enregistrer**
   - ✅ Message de succès
   - ✅ Les zones VMA sont recalculées avec la nouvelle valeur

4. **Afficher l'historique**
   - ✅ Devrait montrer **2 entrées** maintenant
   - La plus récente (VMA 17.0) en haut
   - L'ancienne (VMA 16.5) en dessous

---

## 🧪 Tests Avancés (10 minutes)

### Test 7 : Zones Sans FC Repos

1. Ouvrir métriques d'un **nouvel athlète** (sans métriques)
2. Renseigner uniquement :
   - FC Max : `185`
   - (Laisser FC Repos vide)
3. Enregistrer
4. ✅ Les zones doivent s'afficher avec FC Repos par défaut (60 bpm)

---

### Test 8 : Allures Sans VMA

1. Ouvrir métriques d'un athlète
2. Renseigner tout SAUF la VMA
3. Enregistrer
4. ✅ La section "Allures VMA" **ne doit PAS s'afficher**

---

### Test 9 : Validation des Champs

#### Test 9.1 : Valeurs hors limites
1. Essayer de saisir :
   - FC Max : `250` (> 220)
   - ✅ Le navigateur doit empêcher la saisie

#### Test 9.2 : Format allure incorrect
1. Allure Seuil : Essayer `99:99`
   - ✅ Devrait être rejeté par le pattern

#### Test 9.3 : Valeurs décimales
1. VMA : `16.5` ✅
2. VMA : `16.555` → Devrait accepter mais arrondir
3. Poids : `72.5` ✅

---

### Test 10 : Responsiveness 📱

#### Desktop (>1200px)
1. Ouvrir modal sur grand écran
2. ✅ Formulaire : 3 colonnes côte à côte
3. ✅ Zones cardiaques : 5 colonnes
4. ✅ Modal : 1200px largeur max

#### Tablet (768-1200px)
1. Réduire fenêtre navigateur à ~900px
2. ✅ Formulaire : 2 colonnes
3. ✅ Zones : 3 colonnes

#### Mobile (<768px)
1. Réduire fenêtre à ~400px ou tester sur téléphone
2. ✅ Formulaire : 1 colonne (vertical)
3. ✅ Zones : 1 colonne (vertical)
4. ✅ Modal : 95% largeur

---

### Test 11 : Permissions 🔒

#### En tant que Coach
1. Se connecter comme coach
2. Ouvrir métriques de SES athlètes
3. ✅ Modification autorisée

#### En tant qu'Athlète (si implémenté)
1. Se connecter comme athlète
2. Essayer de modifier ses propres métriques
3. ❌ Devrait être refusé (seul le coach peut modifier)

---

### Test 12 : Performance ⚡

1. Créer métriques pour **5 athlètes différents**
2. Ouvrir chaque modal
3. ✅ Ouverture instantanée (<500ms)
4. ✅ Calculs zones instantanés
5. ✅ Historique charge rapidement

---

## 🐛 Vérifications d'Erreurs

### Erreur 1 : Modal ne s'ouvre pas
**Symptôme** : Clic sur bouton → rien ne se passe

**Vérifications** :
```bash
# 1. Console navigateur (F12)
# Chercher erreurs JavaScript

# 2. Vérifier import
# frontend/src/pages/AthletesManagementPage.tsx
import AthleteMetrics from '../components/AthleteMetrics';

# 3. Vérifier state
const [selectedAthleteForMetrics, setSelectedAthleteForMetrics] = ...
```

### Erreur 2 : 403 Forbidden
**Symptôme** : Erreur lors de l'enregistrement

**Solution** :
```bash
# Vérifier que l'athlète appartient bien au coach connecté
SELECT coach_id FROM athletes WHERE id = 'athlete-id';
```

### Erreur 3 : Zones ne s'affichent pas
**Cause** : Valeurs FC Max ou FC Repos manquantes

**Solution** :
- Renseigner les deux valeurs cardiaques
- Minimum requis : FC Max (FC Repos optionnel, default 60)

### Erreur 4 : Allures VMA incorrectes
**Symptôme** : Calculs semblent faux

**Formule à vérifier** :
```
Allure (min/km) = 60 / VMA (km/h)
Exemple : 60 / 16.5 = 3.636 min/km = 3:38 /km
```

---

## ✅ Checklist de Validation Finale

Avant de valider le système, vérifier :

### Backend ✅
- [ ] Migration SQL appliquée sans erreur
- [ ] Endpoint PUT `/api/athletes/:id/metrics` fonctionne
- [ ] Endpoint GET `/api/athletes/:id/metrics-history` fonctionne
- [ ] Vérification des permissions (coach uniquement)
- [ ] Sauvegarde dans l'historique

### Frontend ✅
- [ ] Modal s'ouvre et se ferme correctement
- [ ] Formulaire pré-rempli si métriques existantes
- [ ] Zones cardiaques calculées correctement
- [ ] Allures VMA calculées correctement
- [ ] Historique s'affiche et se masque
- [ ] Badges métriques sur cartes athlètes
- [ ] Messages de succès/erreur
- [ ] Responsive (desktop/tablet/mobile)

### UX/UI ✅
- [ ] Design cohérent avec le reste de l'app
- [ ] Animations fluides
- [ ] Tooltips informatifs (ⓘ)
- [ ] Boutons avec emojis clairs
- [ ] Couleurs zones cardiaques distinctes
- [ ] Lisibilité sur tous les supports

---

## 🎯 Résultats Attendus

Après tous les tests, vous devriez avoir :

1. ✅ **6 athlètes** avec métriques renseignées
2. ✅ **Zones cardiaques** affichées pour chacun
3. ✅ **Allures VMA** calculées automatiquement
4. ✅ **Historique** avec plusieurs entrées
5. ✅ **Badges** visibles sur toutes les cartes
6. ✅ **Aucune erreur** dans la console

---

## 📸 Captures d'Écran à Faire

Pour documentation :

1. **Modal fermé** - Carte athlète avec badges métriques
2. **Modal ouvert** - Formulaire de saisie
3. **Zones cardiaques** - 5 zones colorées
4. **Allures VMA** - 5 cartes avec allures
5. **Historique** - Liste des modifications
6. **Mobile** - Vue responsive

---

## 🚀 Commande de Test Rapide

Pour relancer rapidement l'environnement de test :

```bash
# Dans le dossier racine du projet
cd "/Users/vincent/Projet site coaching/Projet-coaching"

# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend (nouveau terminal)
cd frontend && npm run dev

# Ouvrir navigateur
# http://localhost:5173
```

---

## 📞 Support

Si problème rencontré :
1. Vérifier les **logs backend** (terminal backend)
2. Vérifier la **console navigateur** (F12)
3. Consulter `ATHLETE_METRICS_SYSTEM.md` (documentation complète)
4. Vérifier la migration SQL appliquée

---

**Bonne chance pour les tests ! 🎉**

**Temps estimé** : 5-15 minutes  
**Difficulté** : ⭐⭐☆☆☆ (Facile)
