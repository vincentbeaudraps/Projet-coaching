const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'coaching_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

function recalculateElevation(gpxContent, threshold = 3) {
  const trkptMatches = [...gpxContent.matchAll(/<trkpt[^>]*>(.*?)<\/trkpt>/gs)];
  let elevationGain = 0;
  let prevEle = null;

  for (const match of trkptMatches) {
    const content = match[1];
    const eleMatch = content.match(/<ele>([\d.]+)<\/ele>/);
    const ele = eleMatch ? parseFloat(eleMatch[1]) : null;

    if (ele !== null && prevEle !== null) {
      const diff = ele - prevEle;
      if (diff > threshold) {
        elevationGain += diff;
      }
    }
    prevEle = ele;
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
    console.log(`   D+ actuel: ${activity.elevation_gain} m`);
    console.log('');
    
    // Test avec différents seuils
    const thresholds = [0, 1, 2, 3, 4, 5, 10];
    console.log('Test avec différents seuils de filtrage:');
    console.log('');
    
    for (const threshold of thresholds) {
      const newD = recalculateElevation(activity.gpx_data, threshold);
      console.log(`   Seuil ${threshold}m: ${newD} m`);
    }
    
    console.log('');
    console.log('🎯 Objectif Garmin: 79 m');
    
  } finally {
    client.release();
    await pool.end();
  }
}

test().catch(console.error);
