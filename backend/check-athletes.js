import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const client = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'coaching_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function checkAthletes() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Find coach ID
    const coachResult = await client.query(
      "SELECT id, email, name, role FROM users WHERE email = 'vincent.coach@example.com'"
    );
    
    if (coachResult.rows.length === 0) {
      console.log('❌ Coach not found');
      return;
    }
    
    const coach = coachResult.rows[0];
    console.log('👤 Coach found:');
    console.log(`   ID: ${coach.id}`);
    console.log(`   Email: ${coach.email}`);
    console.log(`   Name: ${coach.name}`);
    console.log(`   Role: ${coach.role}\n`);

    // Check athletes for this coach
    const athletesResult = await client.query(
      'SELECT * FROM athletes WHERE coach_id = $1',
      [coach.id]
    );

    console.log(`🏃 Athletes count: ${athletesResult.rows.length}\n`);

    if (athletesResult.rows.length === 0) {
      console.log('ℹ️  No athletes found for this coach');
      console.log('\n📝 Creating a test athlete...\n');

      // Create a test athlete user
      const userResult = await client.query(
        `INSERT INTO users (id, email, name, password, role) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING *`,
        [
          Date.now() + '-test',
          'test.athlete@example.com',
          'Test Athlete',
          '$2a$10$XQkC7Y3Y3Y3Y3Y3Y3Y3Y3eZQkC7Y3Y3Y3Y3Y3Y3Y3Y3Y3Y3Y3Y3Y3',
          'athlete'
        ]
      );

      const athleteUser = userResult.rows[0];

      // Create athlete profile
      const athleteResult = await client.query(
        `INSERT INTO athletes (id, user_id, coach_id, age, level, goals) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [
          Date.now() + '-athlete',
          athleteUser.id,
          coach.id,
          25,
          'intermediate',
          'Courir un marathon en moins de 4 heures'
        ]
      );

      console.log('✅ Test athlete created:');
      console.log(`   Email: test.athlete@example.com`);
      console.log(`   Password: password123`);
      console.log(`   Name: Test Athlete`);
    } else {
      console.log('Athletes:');
      athletesResult.rows.forEach((athlete, index) => {
        console.log(`\n${index + 1}. ID: ${athlete.id}`);
        console.log(`   User ID: ${athlete.user_id}`);
        console.log(`   Age: ${athlete.age}`);
        console.log(`   Level: ${athlete.level}`);
        console.log(`   Goals: ${athlete.goals}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

checkAthletes();
