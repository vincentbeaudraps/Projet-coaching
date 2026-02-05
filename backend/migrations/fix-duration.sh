#!/bin/bash

# Script pour corriger les durées des activités GPX
# Les durées étaient stockées en minutes au lieu de secondes

echo "🔍 Correction des durées d'activités GPX..."
echo ""

# Vérifier que PostgreSQL est accessible
if ! command -v psql &> /dev/null; then
    echo "❌ psql n'est pas installé"
    exit 1
fi

# Variables de connexion (à adapter selon votre configuration)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-coaching_db}"
DB_USER="${DB_USER:-postgres}"

echo "📊 Vérification des activités à corriger..."
echo ""

# Compter les activités à corriger
ACTIVITIES_COUNT=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c \
  "SELECT COUNT(*) FROM completed_activities WHERE source = 'gpx' AND duration < 7200;" | xargs)

if [ "$ACTIVITIES_COUNT" -eq 0 ]; then
    echo "✅ Aucune activité à corriger. Les durées sont déjà correctes!"
    exit 0
fi

echo "Trouvé $ACTIVITIES_COUNT activité(s) à corriger"
echo ""

# Afficher les activités qui vont être modifiées
echo "📋 Liste des activités qui vont être modifiées:"
echo ""

psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \
  "SELECT 
    title as \"Titre\",
    TO_CHAR(start_date, 'DD/MM/YYYY HH24:MI') as \"Date\",
    duration as \"Durée actuelle (min)\",
    (duration * 60) as \"Nouvelle durée (sec)\",
    CONCAT(FLOOR((duration * 60) / 3600), 'h ', 
           FLOOR(((duration * 60) % 3600) / 60), 'min') as \"Format lisible\"
   FROM completed_activities 
   WHERE source = 'gpx' AND duration < 7200
   ORDER BY start_date DESC;"

echo ""
echo "⚠️  Cette opération va multiplier la durée par 60 pour ces activités."
echo ""
read -p "Continuer? (o/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[OoYy]$ ]]; then
    echo "❌ Opération annulée"
    exit 0
fi

echo ""
echo "🔧 Application de la correction..."

# Exécuter la migration
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<EOF
BEGIN;

UPDATE completed_activities 
SET duration = duration * 60,
    updated_at = CURRENT_TIMESTAMP
WHERE source = 'gpx' 
  AND duration < 7200;

COMMIT;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration réussie! $ACTIVITIES_COUNT activité(s) corrigée(s)"
    echo ""
    echo "📊 Vérification des résultats:"
    echo ""
    
    psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c \
      "SELECT 
        title as \"Titre\",
        CONCAT(FLOOR(duration / 3600), 'h ', 
               FLOOR((duration % 3600) / 60), 'min ', 
               (duration % 60), 's') as \"Durée corrigée\"
       FROM completed_activities 
       WHERE source = 'gpx'
       ORDER BY start_date DESC
       LIMIT 5;"
else
    echo ""
    echo "❌ Erreur lors de la migration"
    exit 1
fi
