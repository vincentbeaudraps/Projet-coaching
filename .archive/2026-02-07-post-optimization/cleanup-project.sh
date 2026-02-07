#!/bin/bash

# Script de nettoyage du projet - Suppression des fichiers redondants
# Date: 5 février 2026

echo "🧹 Nettoyage du projet VB Coaching..."
echo ""

# Compteur
REMOVED=0

# Fonction pour supprimer un fichier
remove_file() {
    if [ -f "$1" ]; then
        rm "$1"
        echo "✓ Supprimé: $1"
        ((REMOVED++))
    fi
}

# Fonction pour supprimer un dossier
remove_dir() {
    if [ -d "$1" ]; then
        rm -rf "$1"
        echo "✓ Supprimé: $1"
        ((REMOVED++))
    fi
}

echo "📝 Suppression des documentations redondantes..."

# Documentations obsolètes/redondantes (garder seulement les essentielles)
remove_file "00_START_HERE.txt"
remove_file "README_START.txt"
remove_file "QUICKSTART.md"
remove_file "READY_TO_USE.md"
remove_file "FINAL_SUMMARY.md"
remove_file "WORK_SESSION_REPORT.md"
remove_file "PROJECT_STATUS.md"
remove_file "STATUS_CHECKLIST.md"
remove_file "STATUS_OVERVIEW.md"
remove_file "NEXT_STEPS.md"
remove_file "VERIFICATION.txt"

# Documentations de fix (une fois corrigé, plus besoin)
remove_file "FIX_ACTIVITY_DURATION_COMPLETE.md"
remove_file "FIX_ATHLETE_DASHBOARD_403.md"
remove_file "FIX_ATHLETE_PROFILES_RESOLVED.md"
remove_file "FIX_ELEVATION_ANALYSIS.md"
remove_file "FIX_GARMIN_DURATION_FINAL.md"
remove_file "FIX_TYPESCRIPT_TOFIXED_ERROR.md"

# Documentations de fonctionnalités spécifiques (redondantes)
remove_file "ACTIVITY_MODAL_RICH_INTERFACE.md"
remove_file "MODAL_ASCII_VISUALIZATION.md"
remove_file "MODAL_COMPARISON_BEFORE_AFTER.md"
remove_file "MODAL_ENRICHI_INDEX.md"
remove_file "MODAL_ENRICHI_SUMMARY.md"
remove_file "MODAL_RECAP_QUICK_START.md"
remove_file "MODAL_REFONTE_PLAN.md"
remove_file "MODAL_START_HERE.md"

# Documentations Sync redondantes
remove_file "FINAL_SYNC_REPORT.md"
remove_file "INDEX_SYNC.md"
remove_file "NEXT_STEPS_SYNC.md"
remove_file "README_SYNC.md"
remove_file "VERIFICATION_SYNC.txt"
remove_file "VISUAL_GUIDE_SYNC.md"

# Documentations Session Builder redondantes
remove_file "SESSION_BUILDER_COMPLETE.md"
remove_file "SESSION_BUILDER_README.md"

# Documentations Invitations redondantes
remove_file "INVITATION_SYSTEM_SUMMARY.md"
remove_file "QUICK_START_INVITATIONS.md"

# Documentations Athlète Métriques redondantes (garder les 2 principaux)
remove_file "ATHLETE_METRICS_INDEX.md"
remove_file "ATHLETE_METRICS_READY.md"
remove_file "ATHLETE_METRICS_START.md"
remove_file "ATHLETE_METRICS_SUMMARY.md"
remove_file "ATHLETE_METRICS_VISUAL.md"

# Guides de test redondants
remove_file "TEST_GUIDE_MODAL_RICH.md"
remove_file "TESTS_OPTION_A.md"
remove_file "TESTS_INVITATION_SYSTEM.md"
remove_file "TEST_ATHLETE_DASHBOARD.md"
remove_file "TEST_SESSION_BUILDER.md"
remove_file "VISUAL_TEST_GUIDE.md"

# Autres documentations redondantes
remove_file "AMELIORATIONS_CODE.md"
remove_file "AMELIORATION_SUPPRESSION.md"
remove_file "ATHLETE_DASHBOARD_UPDATE.md"
remove_file "COACH_SETUP.md"
remove_file "DESIGN_VB_COACHING.md"
remove_file "DOCUMENTATION_INDEX.md"
remove_file "DUAL_CALENDAR_SYSTEM.md"
remove_file "GUIDE_CODE_INVITATION.md"
remove_file "GUIDE_SUPPRESSION_ATHLETE.md"
remove_file "IMPLEMENTATION_GPS_INDICATOR.md"
remove_file "OPTION_A_COMPLETE.md"
remove_file "README_READY_TO_TEST.md"
remove_file "RESUME_NAVIGATION_DESIGN.md"
remove_file "SECURITY_CHANGES.md"
remove_file "SYNC_SYSTEM_COMPLETE.md"

echo ""
echo "🔧 Suppression des scripts obsolètes..."

# Scripts de fix/test obsolètes
remove_file "apply-duration-fix.sh"
remove_file "check-implementation.sh"
remove_file "elevation-solution.sh"
remove_file "START_SYNC.sh"
remove_file "start-session-builder.sh"
remove_file "test-system.sh"
remove_file "test.sh"
remove_file "verify-duration-fix.sh"

# Script Windows (si on est sur Mac)
remove_file "setup.bat"

echo ""
echo "✅ Nettoyage terminé!"
echo "📊 Fichiers supprimés: $REMOVED"
echo ""
echo "📁 Fichiers conservés (essentiels):"
echo "  ✓ README.md - Documentation principale"
echo "  ✓ START_HERE.md - Guide de démarrage"
echo "  ✓ QUICK_START.md - Démarrage rapide"
echo "  ✓ STRUCTURE.md - Architecture du projet"
echo "  ✓ API.md - Documentation API"
echo "  ✓ SECURITY.md - Guide de sécurité"
echo "  ✓ DOCKER.md - Guide Docker"
echo "  ✓ OAUTH_SETUP_GUIDE.md - Configuration OAuth"
echo "  ✓ EXPORT_MONTRES_GUIDE.md - Export montres GPS"
echo "  ✓ ATHLETE_METRICS_SYSTEM.md - Système métriques athlètes"
echo "  ✓ TEST_ATHLETE_METRICS.md - Tests métriques"
echo "  ✓ SYNC_SYSTEM_SUMMARY.md - Résumé système sync"
echo "  ✓ SESSION_BUILDER_SUMMARY.md - Résumé session builder"
echo "  ✓ setup.sh - Script d'installation"
echo "  ✓ docker-compose.yml - Configuration Docker"
echo ""
echo "🎉 Projet nettoyé avec succès!"
