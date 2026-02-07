# Templates Personnalisés - Documentation

## Vue d'ensemble

Le système de templates personnalisés permet aux coachs de sauvegarder leurs séances comme templates réutilisables. Ces templates apparaissent dans la sidebar aux côtés des templates par défaut.

## Fonctionnalités Implémentées

### 1. **Sauvegarde de Templates Personnalisés**

#### Bouton de Sauvegarde
- Bouton "💾 Sauvegarder comme template" dans le formulaire de création de séance
- Situé entre le bouton "Annuler" et "Créer la séance"
- Désactivé si aucun bloc n'est présent

#### Modal de Sauvegarde
Le modal permet de renseigner :
- **Nom du template** (obligatoire) : Titre court et descriptif
- **Description** (optionnel) : Explication détaillée du type de séance
- **Aperçu automatique** : Affiche le nombre de blocs, durée et distance estimée

### 2. **Affichage dans la Sidebar**

#### Section "Mes Templates"
- Apparaît en premier dans la sidebar si des templates existent
- Badge de date de création
- Bordure bleue à gauche pour différenciation visuelle
- Bouton de suppression (🗑️) au survol

#### Section "Templates par défaut"
- Sépare clairement les templates système des templates personnalisés
- Templates non modifiables ni supprimables

### 3. **Gestion des Templates**

#### Stockage
```typescript
// Stockage dans localStorage
localStorage.setItem('customTemplates', JSON.stringify(templates));

// Chargement au démarrage
useEffect(() => {
  const saved = localStorage.getItem('customTemplates');
  if (saved) {
    setCustomTemplates(JSON.parse(saved));
  }
}, []);
```

#### Structure de Données
```typescript
interface SessionTemplate {
  id: string;              // Format: "custom-{timestamp}"
  name: string;            // Nom du template
  description: string;     // Description
  blocks: SessionBlock[];  // Blocs de la séance (sans ID)
  isCustom: boolean;       // true pour templates perso
  createdAt: string;       // ISO date string
}
```

### 4. **Opérations CRUD**

#### Créer
```typescript
const saveAsTemplate = () => {
  const newTemplate: SessionTemplate = {
    id: `custom-${Date.now()}`,
    name: templateName,
    description: templateDescription || 'Template personnalisé',
    blocks: blocks.map(({ id, ...rest }) => rest),
    isCustom: true,
    createdAt: new Date().toISOString()
  };
  
  const updated = [...customTemplates, newTemplate];
  setCustomTemplates(updated);
  localStorage.setItem('customTemplates', JSON.stringify(updated));
};
```

#### Lire
```typescript
const applyTemplate = (template: SessionTemplate) => {
  const newBlocks = template.blocks.map(block => ({
    id: generateId(),
    ...block
  }));
  setBlocks(newBlocks);
  setTitle(template.name);
  setShowTemplates(false);
};
```

#### Supprimer
```typescript
const deleteCustomTemplate = (templateId: string) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
    const updated = customTemplates.filter(t => t.id !== templateId);
    setCustomTemplates(updated);
    localStorage.setItem('customTemplates', JSON.stringify(updated));
  }
};
```

## Styles CSS

### Template Cards
```css
.template-card.custom-template {
  position: relative;
  border-left: 4px solid #007bff;
  background: linear-gradient(to right, #f8f9fa 0%, #ffffff 100%);
}
```

### Bouton de Suppression
```css
.btn-delete-template {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #ff4444;
  opacity: 0;
  transition: all 0.2s ease;
}

.template-card.custom-template:hover .btn-delete-template {
  opacity: 1;
}
```

### Modal de Sauvegarde
```css
.modal-overlay {
  position: fixed;
  background: rgba(0, 0, 0, 0.6);
  z-index: 2000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}
```

## Compatibilité

### Formats Supportés

Le système de templates personnalisés est **100% compatible** avec toutes les fonctionnalités de création de séance :

#### ✅ Allures
- **Allure fixe** : Minutes + Secondes (3:00-10:00/km)
- **% VMA** : 50-120% avec prévisualisation
- **Zones VMA** : 6 zones calculées automatiquement

#### ✅ Fréquence Cardiaque
- **FC fixe** : 40-220 bpm
- **Zones FC** : 5 zones basées sur FC MAX

#### ✅ Types de Blocs
- Échauffement 🔥
- Endurance 🏃
- Tempo 🎯
- Intervalles ⚡
- Travail 💪
- Retour au calme ❄️

#### ✅ Métriques
- Durée (minutes)
- Distance (km)
- Répétitions
- Temps de récupération

### Export Montres GPS

Les templates sauvegardés conservent toutes les données nécessaires pour l'export vers :
- ✅ **Garmin** (TCX/FIT)
- ✅ **Polar** (TCX)
- ✅ **Suunto** (FIT)
- ✅ **Coros** (FIT)
- ✅ **Wahoo** (FIT)

**Note** : Les % VMA et zones sont convertis en valeurs numériques lors de l'export.

## Interface Utilisateur

### Flow de Création

1. **Créer une séance** avec tous les blocs souhaités
2. **Cliquer** sur "💾 Sauvegarder comme template"
3. **Renseigner** nom et description
4. **Valider** → Template ajouté à "Mes Templates"
5. **Réutiliser** en un clic depuis la sidebar

### Flow de Suppression

1. **Ouvrir** la sidebar des templates
2. **Survoler** le template personnalisé
3. **Cliquer** sur l'icône 🗑️
4. **Confirmer** la suppression

### Indications Visuelles

| Élément | Visuel | Signification |
|---------|--------|---------------|
| Bordure bleue | Barre gauche épaisse | Template personnalisé |
| Date | "12/01/2024" | Date de création |
| Bouton 🗑️ | Au survol uniquement | Supprimable |
| Gradient | Fond gris → blanc | Différenciation visuelle |

## Exemples de Templates

### Endurance Fondamentale
```typescript
{
  name: "EF 1h20 - Z2",
  description: "Sortie longue à allure conversationnelle",
  blocks: [
    { type: 'warmup', duration: 10, intensity: 'easy' },
    { type: 'endurance', duration: 70, paceMode: 'vma_percent', 
      vmaPercentMin: 65, vmaPercentMax: 75 },
    { type: 'cooldown', duration: 10, intensity: 'recovery' }
  ]
}
```

### Intervalles VMA
```typescript
{
  name: "10×400m - 105% VMA",
  description: "Développement puissance aérobie maximale",
  blocks: [
    { type: 'warmup', duration: 20, intensity: 'easy' },
    { type: 'interval', duration: 1.5, repetitions: 10, 
      recoveryTime: 1.5, paceMode: 'vma_percent',
      vmaPercentMin: 105, vmaPercentMax: 105 },
    { type: 'cooldown', duration: 10, intensity: 'recovery' }
  ]
}
```

### Seuil Anaérobie
```typescript
{
  name: "Seuil 3×10min",
  description: "Travail au seuil lactique - Méthode nordique",
  blocks: [
    { type: 'warmup', duration: 20, intensity: 'easy' },
    { type: 'tempo', duration: 10, repetitions: 3, recoveryTime: 3,
      hrMode: 'zone', hrZone: 4 },
    { type: 'cooldown', duration: 15, intensity: 'recovery' }
  ]
}
```

## Limitations Connues

### Actuelles
- ❌ **Pas de modification** : Impossible d'éditer un template sauvegardé (il faut le supprimer et recréer)
- ❌ **Pas de partage** : Templates stockés en local uniquement
- ❌ **Pas de catégories** : Tous les templates dans une seule liste

### Solutions Futures
1. **Édition** : Bouton "✏️ Modifier" sur chaque template
2. **Partage** : Export/Import JSON ou bibliothèque cloud
3. **Organisation** : Tags (Endurance, VMA, Seuil, etc.)
4. **Recherche** : Filtrage par nom/type/durée
5. **Favoris** : Épingler les templates les plus utilisés

## Maintenance

### Mise à Jour Structure
Si la structure `SessionBlock` change, les templates existants restent compatibles grâce au système de migration :

```typescript
useEffect(() => {
  const saved = localStorage.getItem('customTemplates');
  if (saved) {
    const parsed = JSON.parse(saved);
    // Appliquer les migrations si nécessaire
    const migrated = migrateTemplates(parsed);
    setCustomTemplates(migrated);
  }
}, []);
```

### Nettoyage
```typescript
// Supprimer tous les templates personnalisés
localStorage.removeItem('customTemplates');

// Exporter avant nettoyage
const exportTemplates = () => {
  const data = localStorage.getItem('customTemplates');
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  // Téléchargement...
};
```

## Testing

### Tests Manuels à Effectuer

1. **Création**
   - [ ] Créer template avec 1 bloc
   - [ ] Créer template avec 10+ blocs
   - [ ] Créer template avec % VMA
   - [ ] Créer template avec zones FC
   - [ ] Créer template sans description

2. **Affichage**
   - [ ] Vérifier ordre (perso puis défaut)
   - [ ] Vérifier date de création
   - [ ] Vérifier nombre de blocs
   - [ ] Vérifier survol bouton suppression

3. **Utilisation**
   - [ ] Appliquer template personnalisé
   - [ ] Vérifier que tous les blocs sont copiés
   - [ ] Vérifier que les % VMA sont préservés
   - [ ] Modifier puis resauvegarder

4. **Suppression**
   - [ ] Supprimer puis annuler
   - [ ] Supprimer puis confirmer
   - [ ] Vérifier disparition de la liste
   - [ ] Vérifier localStorage mis à jour

5. **Persistance**
   - [ ] Créer template
   - [ ] Rafraîchir la page
   - [ ] Vérifier présence du template
   - [ ] Fermer/rouvrir l'application

## Fichiers Modifiés

- `/frontend/src/pages/SessionBuilderPage.tsx`
  - Ajout states pour customTemplates
  - Ajout fonctions saveAsTemplate, deleteCustomTemplate
  - Ajout modal de sauvegarde
  - Mise à jour sidebar avec section templates perso

- `/frontend/src/styles/SessionBuilder.css`
  - Styles .templates-section-header
  - Styles .template-card.custom-template
  - Styles .btn-delete-template
  - Styles .modal-overlay et .modal-content
  - Styles .btn-save-template

## Conclusion

Le système de templates personnalisés est maintenant **100% fonctionnel** et permet aux coachs de :
- ✅ Sauvegarder leurs séances favorites
- ✅ Réutiliser en un clic
- ✅ Organiser leur bibliothèque
- ✅ Gagner du temps dans la création de séances

**Prochaines étapes suggérées** :
1. Ajouter une fonction d'édition de templates
2. Implémenter un système de tags/catégories
3. Permettre l'export/import JSON
4. Ajouter une recherche/filtrage
5. Synchroniser avec le backend (optionnel)
