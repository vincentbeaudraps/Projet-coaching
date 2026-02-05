// Script pour recalculer le dénivelé (D+) des activités GPX
// Applique un seuil de 3m pour filtrer le bruit GPS

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'coaching_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Parser GPX optimisé pour le dénivelé
function recalculateElevationFromGPX(gpxContent: string): number {
  const trkptMatches = [...gpxContent.matchAll(/<trkpt[^>]*lat="([^"]*)"[^>]*lon="([^"]*)"[^>]*>(.*?)<\/trkpt>/gs)];
  
  let elevationGain = 0;
  let prevEle: number | null = null;

  for (const match of trkptMatches) {
    const content = match[3];
    const eleMatch = content.match(/<ele>([\d.]+)<\/ele>/);
    const ele = eleMatch ? parseFloat(eleMatch[1]) : null;

    // Calculer le dénivelé avec un seuil pour filtrer le bruit GPS
    if (ele !== null && prevEle !== null) {
      const elevationDiff = ele - prevEle;
      if (elevationDiff > 3) { // Seuil de 3m
        elevationGain += elevationDiff;
      }
    }

    prevEle = ele;
  }

  return parseFloat(elevationGain.toFixed(2));
}

async function recalculateAllElevations() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Recherche des activités GPX avec données GPX...\n');
    
    const checkQuery = `
      SELECT id, title, elevation_gain, gpx_data
      FROM completed_activities 
      WHERE source = 'gpx' 
        AND gpx_data IS NOT NULL
      ORDER BY start_date DESC
    `;
    
    const result = await client.query(checkQuery);
    
    if (result.rows.length === 0) {
      console.log('✅ Aucune activité GPX trouvée avec données GPX.');
      return;
    }
    
    console.log(`📊 ${result.rows.length} activité(s) trouvée(s)\n`);
    
    for (const activity of result.rows) {
      const oldElevation = activity.elevation_gain;
      const newElevation = recalculateElevationFromGPX(activity.gpx_data);
      
      console.log(`📍 ${activity.title}`);
      console.log(`   Ancien D+: ${oldElevation} m`);
      console.log(`   Nouveau D+ (seuil 3m): ${newElevation} m`);
      console.log(`   Différence: ${(oldElevation - newElevation).toFixed(2)} m (-${(((oldElevation - newElevation) / oldElevation) * 100).toFixed(1)}%)`);
      console.log('');
    }
    
    console.log('⚠️  Voulez-vous appliquer ces changements?');
    console.log('   Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🔧 Application des corrections...\n');
    
    await client.query('BEGIN');
    
    let updatedCount = 0;
    for (const activity of result.rows) {
      const newElevation = recalculateElevationFromGPX(activity.gpx_data);
      
      await client.query(
        `UPDATE completed_activities 
         SET elevation_gain = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [newElevation, activity.id]
      );
      
      updatedCount++;
    }
    
    await client.query('COMMIT');
    
    console.log(`✅ ${updatedCount} activité(s) mise(s) à jour avec succès!\n`);
    
    // Afficher les résultats finaux
    const finalResult = await client.query(
      `SELECT title, elevation_gain as "D+ (m)", distance as "Distance (km)"
       FROM completed_activities 
       WHERE source = 'gpx'
       ORDER BY start_date DESC`
    );
    
    console.log('📊 Résultats finaux:');
    console.table(finalResult.rows);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

recalculateAllElevations().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
