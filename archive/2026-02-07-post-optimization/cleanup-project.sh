#!/bin/bash

# Script de nettoyage du projet - Supprime les fichiers obsolètes

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🧹 Nettoyage du Projet - Suppression Fichiers Inutiles  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Compteur de fichiers
FILES_TO_DELETE=0
TOTAL_SIZE=0

echo -e "${BLUE}📋 Fichiers identifiés pour suppression:${NC}"
echo ""

# Fonction pour ajouter un fichier à supprimer
add_to_delete() {
    local file=$1
    local description=$2
    if [ -f "$file" ]; then
        local size=$(du -sh "$file" | cut -f1)
        echo "  📄 $file"
        echo "     └─ $description ($size)"
        FILES_TO_DELETE=$((FILES_TO_DELETE + 1))
    fi
}

echo -e "${YELLOW}📚 Documentation Redondante:${NC}"
# Garder seulement FINAL_MIGRATION_REPORT.md et README.md
add_to_delete "OPTIMIZATION_STATUS.md" "Remplacé par FINAL_MIGRATION_REPORT.md"
add_to_delete "PROGRESS_REPORT.md" "Remplacé par FINAL_MIGRATION_REPORT.md"
add_to_delete "MASSIVE_PROGRESS_REPORT.md" "Remplacé par FINAL_MIGRATION_REPORT.md"
add_to_delete "FINAL_SUMMARY.md" "Contenu dupliqué avec FINAL_MIGRATION_REPORT.md"
add_to_delete "SESSION_3_SUMMARY.md" "Archives de sessions - consolidé dans FINAL_MIGRATION_REPORT.md"
add_to_delete "SESSION_4_SUMMARY.md" "Archives de sessions - consolidé dans FINAL_MIGRATION_REPORT.md"
add_to_delete "SESSION_5_SUMMARY.md" "Archives de sessions - consolidé dans FINAL_MIGRATION_REPORT.md"
add_to_delete "SESSION_6_SUMMARY.md" "Archives de sessions - consolidé dans FINAL_MIGRATION_REPORT.md"

echo ""
echo -e "${YELLOW}🔧 Scripts d'Analyse Temporaires:${NC}"
add_to_delete "analyze-patterns.js" "Script d'analyse ponctuel - mission accomplie"

echo ""
echo -e "${YELLOW}🗄️ Migrations Temporaires:${NC}"
add_to_delete "backend/migrations/recalculate-elevation.ts" "Script de migration one-time - déjà exécuté"
add_to_delete "backend/migrations/run-duration-fix.ts" "Script de migration one-time - déjà exécuté"
add_to_delete "backend/migrations/FIX_DURATION_BUG.md" "Documentation temporaire du bug - fixé"

echo ""
echo -e "${BLUE}📊 Résumé:${NC}"
echo ""
echo "  Fichiers à supprimer: ${RED}$FILES_TO_DELETE${NC}"
echo ""

if [ $FILES_TO_DELETE -eq 0 ]; then
    echo -e "${GREEN}✨ Projet déjà propre ! Aucun fichier à supprimer.${NC}"
    exit 0
fi

echo -e "${YELLOW}⚠️  Fichiers à CONSERVER:${NC}"
echo "  ✅ README.md - Documentation principale"
echo "  ✅ FINAL_MIGRATION_REPORT.md - Rapport final complet"
echo "  ✅ REFACTORING_GUIDE.md - Guide pour futurs développements"
echo "  ✅ docker-compose.yml - Configuration Docker"
echo "  ✅ backend/migrations/*.sql - Migrations de base de données"
echo ""

read -p "Voulez-vous supprimer ces fichiers ? (o/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[OoYy]$ ]]; then
    echo ""
    echo -e "${BLUE}🗑️  Suppression en cours...${NC}"
    echo ""
    
    DELETED=0
    
    # Supprimer les fichiers de documentation redondante
    for file in "OPTIMIZATION_STATUS.md" "PROGRESS_REPORT.md" "MASSIVE_PROGRESS_REPORT.md" \
                "FINAL_SUMMARY.md" "SESSION_3_SUMMARY.md" "SESSION_4_SUMMARY.md" \
                "SESSION_5_SUMMARY.md" "SESSION_6_SUMMARY.md"; do
        if [ -f "$file" ]; then
            rm "$file"
            echo "  ✅ Supprimé: $file"
            DELETED=$((DELETED + 1))
        fi
    done
    
    # Supprimer le script d'analyse
    if [ -f "analyze-patterns.js" ]; then
        rm "analyze-patterns.js"
        echo "  ✅ Supprimé: analyze-patterns.js"
        DELETED=$((DELETED + 1))
    fi
    
    # Supprimer les migrations temporaires
    if [ -f "backend/migrations/recalculate-elevation.ts" ]; then
        rm "backend/migrations/recalculate-elevation.ts"
        echo "  ✅ Supprimé: backend/migrations/recalculate-elevation.ts"
        DELETED=$((DELETED + 1))
    fi
    
    if [ -f "backend/migrations/run-duration-fix.ts" ]; then
        rm "backend/migrations/run-duration-fix.ts"
        echo "  ✅ Supprimé: backend/migrations/run-duration-fix.ts"
        DELETED=$((DELETED + 1))
    fi
    
    if [ -f "backend/migrations/FIX_DURATION_BUG.md" ]; then
        rm "backend/migrations/FIX_DURATION_BUG.md"
        echo "  ✅ Supprimé: backend/migrations/FIX_DURATION_BUG.md"
        DELETED=$((DELETED + 1))
    fi
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✅ Nettoyage terminé ! $DELETED fichiers supprimés           ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Créer un commit git
    echo -e "${BLUE}📦 Voulez-vous créer un commit git ? (o/n)${NC}"
    read -p "" -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[OoYy]$ ]]; then
        git add -A
        git commit -m "chore: Clean up obsolete documentation and temporary scripts

- Removed $DELETED redundant/temporary files
- Kept: README.md, FINAL_MIGRATION_REPORT.md, REFACTORING_GUIDE.md
- Project now cleaner and more maintainable"
        echo -e "${GREEN}✅ Commit créé avec succès !${NC}"
    fi
    
else
    echo ""
    echo -e "${YELLOW}⏸️  Nettoyage annulé${NC}"
    echo ""
fi

echo ""
echo -e "${BLUE}📚 Structure recommandée (après nettoyage):${NC}"
echo ""
echo "  📄 README.md - Documentation principale du projet"
echo "  📄 FINAL_MIGRATION_REPORT.md - Rapport d'optimisation complet"
echo "  📄 REFACTORING_GUIDE.md - Guide des patterns à suivre"
echo "  📄 docker-compose.yml - Configuration Docker"
echo "  📁 backend/ - Code backend optimisé"
echo "  📁 frontend/ - Code frontend optimisé"
echo ""
echo -e "${GREEN}✨ Projet propre et organisé !${NC}"
