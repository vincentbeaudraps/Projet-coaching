#!/bin/bash

# Script de nettoyage après optimisation massive du projet
# Date: 7 février 2026

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🧹 Nettoyage Post-Optimisation du Projet Coaching       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Compteurs
FILES_TO_ARCHIVE=0
FILES_TO_DELETE=0
SPACE_SAVED=0

echo -e "${BLUE}📋 Analyse des fichiers à nettoyer...${NC}"
echo ""

# ===================================================================
# 1. FICHIERS DE DOCUMENTATION REDONDANTS
# ===================================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📚 Documentation redondante${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

DOCS_TO_CONSOLIDATE=(
    "COACH_ATHLETE_DETAIL_PAGE_COMPLETE.md"
    "COACH_DETAIL_START_HERE.md"
    "COACH_DETAIL_VISUAL_COMPLETE.md"
    "PROGRESS_REPORT.md"
    "OPTIMIZATION_STATUS.md"
)

echo "  Fichiers de documentation obsolètes détectés:"
for file in "${DOCS_TO_CONSOLIDATE[@]}"; do
    if [ -f "$file" ]; then
        size=$(du -h "$file" | cut -f1)
        echo "    • $file ($size)"
        ((FILES_TO_ARCHIVE++))
    fi
done
echo ""

# ===================================================================
# 2. SCRIPTS DE NETTOYAGE OBSOLÈTES
# ===================================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🛠️  Scripts obsolètes${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

SCRIPTS_OBSOLETE=(
    "analyze-patterns.js"
    "cleanup-project.sh"
    "apply-duration-fix.sh"
)

echo "  Scripts de migration/analyse obsolètes:"
for file in "${SCRIPTS_OBSOLETE[@]}"; do
    if [ -f "$file" ]; then
        size=$(du -h "$file" | cut -f1)
        echo "    • $file ($size)"
        ((FILES_TO_ARCHIVE++))
    fi
done
echo ""

# ===================================================================
# 3. FICHIERS TEMPORAIRES ET CACHE
# ===================================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🗑️  Fichiers temporaires${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Compter les fichiers temporaires
TEMP_COUNT=0
DS_STORE_COUNT=$(find . -name ".DS_Store" | wc -l | xargs)
LOG_COUNT=$(find . -name "*.log" -not -path "*/node_modules/*" | wc -l | xargs)

echo "  Fichiers système à supprimer:"
echo "    • .DS_Store: $DS_STORE_COUNT fichiers"
echo "    • *.log: $LOG_COUNT fichiers"
echo ""

# ===================================================================
# 4. RÉSUMÉ
# ===================================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 Résumé${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  📁 Fichiers à archiver: $FILES_TO_ARCHIVE"
echo "  🗑️  Fichiers système à supprimer: $((DS_STORE_COUNT + LOG_COUNT))"
echo ""

# ===================================================================
# 5. CONFIRMATION
# ===================================================================
echo -e "${YELLOW}⚠️  Actions proposées:${NC}"
echo ""
echo "  1. Créer un dossier 'archive/' pour les anciens docs"
echo "  2. Déplacer les fichiers obsolètes dans 'archive/'"
echo "  3. Supprimer .DS_Store et fichiers .log"
echo "  4. Garder uniquement les docs essentiels:"
echo "     • README.md"
echo "     • FINAL_MIGRATION_REPORT.md"
echo "     • REFACTORING_GUIDE.md"
echo "     • docker-compose.yml"
echo ""

read -p "Voulez-vous procéder au nettoyage? (o/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[OoYy]$ ]]; then
    echo ""
    echo -e "${YELLOW}⏸️  Nettoyage annulé${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🚀 Début du nettoyage...${NC}"
echo ""

# ===================================================================
# 6. CRÉATION DU DOSSIER ARCHIVE
# ===================================================================
echo -e "${CYAN}📦 Création du dossier archive...${NC}"
ARCHIVE_DIR="archive/$(date +%Y-%m-%d)-post-optimization"
mkdir -p "$ARCHIVE_DIR"
echo -e "${GREEN}✓${NC} Dossier créé: $ARCHIVE_DIR"
echo ""

# ===================================================================
# 7. ARCHIVAGE DES FICHIERS OBSOLÈTES
# ===================================================================
echo -e "${CYAN}📚 Archivage des documentations obsolètes...${NC}"
for file in "${DOCS_TO_CONSOLIDATE[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" "$ARCHIVE_DIR/"
        echo -e "${GREEN}✓${NC} Archivé: $file"
    fi
done
echo ""

echo -e "${CYAN}🛠️  Archivage des scripts obsolètes...${NC}"
for file in "${SCRIPTS_OBSOLETE[@]}"; do
    if [ -f "$file" ]; then
        mv "$file" "$ARCHIVE_DIR/"
        echo -e "${GREEN}✓${NC} Archivé: $file"
    fi
done
echo ""

# ===================================================================
# 8. SUPPRESSION DES FICHIERS TEMPORAIRES
# ===================================================================
echo -e "${CYAN}🗑️  Suppression des fichiers temporaires...${NC}"

# Supprimer .DS_Store
find . -name ".DS_Store" -type f -delete
echo -e "${GREEN}✓${NC} .DS_Store supprimés: $DS_STORE_COUNT fichiers"

# Supprimer .log (sauf node_modules)
find . -name "*.log" -not -path "*/node_modules/*" -type f -delete
echo -e "${GREEN}✓${NC} Fichiers .log supprimés: $LOG_COUNT fichiers"
echo ""

# ===================================================================
# 9. CRÉATION D'UN README DANS ARCHIVE
# ===================================================================
cat > "$ARCHIVE_DIR/README.md" << 'EOF'
# Archive Post-Optimisation

**Date**: $(date +"%d %B %Y")

## Contenu

Ce dossier contient les fichiers archivés après la **migration massive d'optimisation** du projet.

### Fichiers Archivés

#### Documentation Obsolète
- `COACH_ATHLETE_DETAIL_PAGE_COMPLETE.md` - Guide spécifique à une page (intégré dans le code)
- `COACH_DETAIL_START_HERE.md` - Guide de démarrage (obsolète)
- `COACH_DETAIL_VISUAL_COMPLETE.md` - Documentation visuelle (intégrée)
- `PROGRESS_REPORT.md` - Rapport intermédiaire (remplacé par FINAL_MIGRATION_REPORT.md)
- `OPTIMIZATION_STATUS.md` - Status intermédiaire (complété à 100%)

#### Scripts Obsolètes
- `analyze-patterns.js` - Script d'analyse des patterns (mission accomplie)
- `cleanup-project.sh` - Ancien script de nettoyage (remplacé)
- `apply-duration-fix.sh` - Script de fix de bug spécifique (appliqué)

### Pourquoi Archivé?

Après la **migration massive** (Sessions 3-6), ces fichiers ne sont plus nécessaires car:
- ✅ Toutes les optimisations sont complétées
- ✅ Les patterns sont maintenant standard dans le code
- ✅ La documentation est consolidée dans FINAL_MIGRATION_REPORT.md

### Documents Actifs Conservés
- `README.md` - Documentation principale du projet
- `FINAL_MIGRATION_REPORT.md` - Rapport complet de la migration
- `REFACTORING_GUIDE.md` - Guide des patterns établis
- `SESSION_3_SUMMARY.md` à `SESSION_6_SUMMARY.md` - Historique des sessions

---

**Note**: Ces fichiers peuvent être supprimés après 30 jours si non nécessaires.
EOF

echo -e "${GREEN}✓${NC} README créé dans l'archive"
echo ""

# ===================================================================
# 10. RÉSULTAT FINAL
# ===================================================================
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ Nettoyage Terminé avec Succès!                       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${BLUE}📊 Résultats:${NC}"
echo ""
echo "  ✅ Fichiers archivés: $FILES_TO_ARCHIVE"
echo "  ✅ .DS_Store supprimés: $DS_STORE_COUNT"
echo "  ✅ Fichiers .log supprimés: $LOG_COUNT"
echo "  📁 Archive créée: $ARCHIVE_DIR"
echo ""

echo -e "${BLUE}📂 Structure actuelle (racine):${NC}"
ls -lh | grep -E "^-|^d" | grep -v "node_modules" | awk '{print "  " $9 " (" $5 ")"}'
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 Projet nettoyé et optimisé à 100%!${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📚 Documents conservés:${NC}"
echo "  • README.md"
echo "  • FINAL_MIGRATION_REPORT.md"
echo "  • REFACTORING_GUIDE.md"
echo "  • SESSION_3_SUMMARY.md à SESSION_6_SUMMARY.md"
echo "  • MASSIVE_PROGRESS_REPORT.md"
echo "  • FINAL_SUMMARY.md"
echo ""
echo -e "${YELLOW}💡 Conseil:${NC} Vous pouvez supprimer le dossier 'archive/' après 30 jours"
echo ""
