// Fix CASCADE constraints for athlete deletion
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
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

    // Read the SQL file
    const sqlFile = path.join(__dirname, 'fix-cascade-constraints.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('\nExecuting CASCADE constraints fix...');
    const result = await client.query(sql);
    
    console.log('\n✓ Success!');
    console.log('Result:', result.rows);

    // Verify the constraints were fixed
    console.log('\nVerifying foreign key constraints...');
    const verifyQuery = `
      SELECT
          tc.table_name,
          tc.constraint_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          rc.delete_rule
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
      JOIN information_schema.referential_constraints AS rc
          ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_name IN ('athletes', 'users')
      ORDER BY tc.table_name;
    `;
    
    const verification = await client.query(verifyQuery);
    console.log('\nForeign key constraints:');
    console.table(verification.rows);

    await client.end();
    console.log('\n✓ All done! Athletes can now be deleted properly.');
  } catch (error) {
    console.error('Error:', error);
    try {
      await client.end();
    } catch (e) {
      // Ignore
    }
    process.exit(1);
  }
}

fixCascadeConstraints();
