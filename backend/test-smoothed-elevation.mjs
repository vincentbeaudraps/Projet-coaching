import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'coaching_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

function calculateSmoothedElevation(gpxContent, windowSize = 5, threshold = 0.5) {
  const trkptMatches = [...gpxContent.matchAll(/<trkpt[^>]*>(.*?)<\/trkpt>/gs)];
  let elevationGain = 0;
  let prevEle = null;
  let elevationBuffer = [];

  for (const match of trkptMatches) {
    const content = match[1];
    const eleMatch = content.match(/<ele>([\d.]+)<\/ele>/);
    const ele = eleMatch ? parseFloat(eleMatch[1]) : null;

    if (ele !== null) {
      elevationBuffer.push(ele);
      if (elevationBuffer.length > windowSize) {
        elevationBuffer.shift();
      }
      
      // Moyenne mobile
      const smoothedEle = elevationBuffer.reduce((a, b) => a + b, 0) / elevationBuffer.length;
      
      if (prevEle !== null && smoothedEle > prevEle) {
        const diff = smoothedEle - prevEle;
        if (diff > threshold) {
          elevationGain += diff;
        }
      }
      
      prevEle = smoothedEle;
    }
  }

  return Math.round(elevationGain * 100) / 100;
}

async function test() {
  const client = await pool.connect();
  try {
    const result = await client.query(
      "SELECT title, elevation_gain, gpx_data FROM completed_activities WHERE title LIKE '%Condette%'"
    );
    
    if (result.rows.length === 0) {
      console.log('Aucune activité trouvée');
      return;
    }

    const activity = result.rows[0];
    console.log(`\n📍 ${activity.title}`);
    console.log(`   D+ actuel dans la BDD: ${activity.elevation_gain} m`);
    console.log('');
    
    // Test avec différentes tailles de fenêtre et seuils
    console.log('Test avec lissage (moving average):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    const configs = [
      { window: 3, threshold: 0.5, label: 'Fenêtre 3, seuil 0.5m' },
      { window: 5, threshold: 0.5, label: 'Fenêtre 5, seuil 0.5m' },
      { window: 7, threshold: 0.5, label: 'Fenêtre 7, seuil 0.5m' },
      { window: 10, threshold: 0.5, label: 'Fenêtre 10, seuil 0.5m' },
      { window: 5, threshold: 0.3, label: 'Fenêtre 5, seuil 0.3m' },
      { window: 5, threshold: 0.7, label: 'Fenêtre 5, seuil 0.7m' },
      { window: 5, threshold: 1.0, label: 'Fenêtre 5, seuil 1.0m' },
    ];
    
    for (const config of configs) {
      const newD = calculateSmoothedElevation(activity.gpx_data, config.window, config.threshold);
      const diff = Math.abs(79 - newD);
      const mark = diff < 5 ? ' ✅ PROCHE!' : diff < 10 ? ' 🟡 Acceptable' : diff < 20 ? ' 🟠' : '';
      console.log(`   ${config.label.padEnd(30)} → D+ ${newD.toString().padStart(6)} m${mark}`);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🎯 Objectif (Garmin baromètre): 79 m');
    console.log('');
    console.log('💡 Explication:');
    console.log('   - Sans lissage (seuil 0): 182m (trop de bruit GPS)');
    console.log('   - Avec lissage: Résultat plus proche de Garmin');
    console.log('   - Le baromètre Garmin est plus précis que l\'altitude GPS');
    console.log('');
    
  } finally {
    client.release();
    await pool.end();
  }
}

test().catch(console.error);
