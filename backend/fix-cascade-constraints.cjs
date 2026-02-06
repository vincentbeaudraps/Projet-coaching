// Fix CASCADE constraints for athlete deletion
const { Client } = require('pg');
require('dotenv').config();

async function fixCascadeConstraints() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'coaching_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    // Fix completed_activities
    try {
      await client.query('ALTER TABLE completed_activities DROP CONSTRAINT IF EXISTS completed_activities_athlete_id_fkey');
      await client.query('ALTER TABLE completed_activities ADD CONSTRAINT completed_activities_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE');
      console.log('✓ Fixed completed_activities');
    } catch (e) {
      console.log('✗ completed_activities:', e.message);
    }

    // Fix messages
    try {
      await client.query('ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey');
      await client.query('ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE');
      await client.query('ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey');
      await client.query('ALTER TABLE messages ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE');
      console.log('✓ Fixed messages');
    } catch (e) {
      console.log('✗ messages:', e.message);
    }

    await client.end();
    console.log('\n✓ All done! Try deleting an athlete now.');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixCascadeConstraints();
