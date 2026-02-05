// Migration script to fix activity duration bug
// Duration was incorrectly stored in minutes instead of seconds for GPX imports

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'coaching_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking for activities with incorrect duration...\n');
    
    // First, let's see what activities would be affected
    const checkQuery = `
      SELECT id, title, start_date, duration, distance, source, avg_pace
      FROM completed_activities 
      WHERE source = 'gpx' 
        AND duration < 7200
      ORDER BY start_date DESC
    `;
    
    const checkResult = await client.query(checkQuery);
    
    if (checkResult.rows.length === 0) {
      console.log('✅ No activities need to be fixed. All durations are correct!');
      return;
    }
    
    console.log(`Found ${checkResult.rows.length} activities with potential duration issues:\n`);
    
    checkResult.rows.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.title}`);
      console.log(`   Date: ${new Date(activity.start_date).toLocaleString('fr-FR')}`);
      console.log(`   Current duration: ${activity.duration} (interpreted as minutes)`);
      console.log(`   Will be changed to: ${activity.duration * 60} seconds`);
      console.log(`   Distance: ${activity.distance} km`);
      console.log(`   Avg pace: ${activity.avg_pace || 'N/A'}`);
      console.log('');
    });
    
    // Ask for confirmation
    console.log('⚠️  This will multiply the duration by 60 for these activities.');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Run the migration
    console.log('🔧 Applying migration...\n');
    
    await client.query('BEGIN');
    
    const updateQuery = `
      UPDATE completed_activities 
      SET duration = duration * 60,
          updated_at = CURRENT_TIMESTAMP
      WHERE source = 'gpx' 
        AND duration < 7200
      RETURNING id, title, duration
    `;
    
    const updateResult = await client.query(updateQuery);
    
    await client.query('COMMIT');
    
    console.log(`✅ Successfully updated ${updateResult.rows.length} activities!\n`);
    
    updateResult.rows.forEach((activity, index) => {
      const hours = Math.floor(activity.duration / 3600);
      const minutes = Math.floor((activity.duration % 3600) / 60);
      const seconds = activity.duration % 60;
      const formatted = hours > 0 
        ? `${hours}h ${minutes}min ${seconds}s`
        : `${minutes}min ${seconds}s`;
      
      console.log(`${index + 1}. ${activity.title}: ${formatted}`);
    });
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration
runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
