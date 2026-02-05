// Script de diagnostic et correction des profils athlètes
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/coaching_db'
});

async function fixAthleteProfiles() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // 1. Lister tous les utilisateurs
    const usersResult = await client.query(`
      SELECT u.id, u.email, u.name, u.role, 
             a.id as athlete_id 
      FROM users u 
      LEFT JOIN athletes a ON u.id = a.user_id 
      ORDER BY u.created_at
    `);

    console.log('=== USERS AND PROFILES ===');
    usersResult.rows.forEach(user => {
      console.log(`${user.role === 'athlete' ? '👤' : '👨‍🏫'} ${user.email} (${user.role})`);
      console.log(`   User ID: ${user.id}`);
      console.log(`   Athlete Profile: ${user.athlete_id || '❌ MISSING'}`);
      console.log('');
    });

    // 2. Trouver les athlètes sans profil
    const athletesWithoutProfile = usersResult.rows.filter(
      u => u.role === 'athlete' && !u.athlete_id
    );

    if (athletesWithoutProfile.length === 0) {
      console.log('✅ All athletes have profiles!\n');
      return;
    }

    console.log(`⚠️  Found ${athletesWithoutProfile.length} athlete(s) without profile\n`);

    // 3. Trouver un coach pour assigner
    const coachResult = await client.query(`
      SELECT id FROM users WHERE role = 'coach' LIMIT 1
    `);

    if (coachResult.rows.length === 0) {
      console.log('❌ No coach found in database. Cannot create athlete profiles.');
      console.log('💡 Create a coach first, then run this script again.\n');
      return;
    }

    const coachId = coachResult.rows[0].id;
    console.log(`Using coach ID: ${coachId}\n`);

    // 4. Créer les profils manquants
    for (const user of athletesWithoutProfile) {
      console.log(`Creating profile for: ${user.email}`);
      
      try {
        const result = await client.query(`
          INSERT INTO athletes (id, user_id, coach_id, created_at)
          VALUES (gen_random_uuid(), $1, $2, NOW())
          RETURNING id
        `, [user.id, coachId]);

        console.log(`✅ Created athlete profile: ${result.rows[0].id}\n`);
      } catch (error) {
        console.error(`❌ Error creating profile for ${user.email}:`, error.message);
      }
    }

    // 4. Vérification finale
    const finalCheck = await client.query(`
      SELECT COUNT(*) as total_users,
             COUNT(a.id) as users_with_profile
      FROM users u
      LEFT JOIN athletes a ON u.id = a.user_id
      WHERE u.role = 'athlete'
    `);

    console.log('\n=== FINAL STATUS ===');
    console.log(`Total athletes: ${finalCheck.rows[0].total_users}`);
    console.log(`With profile: ${finalCheck.rows[0].users_with_profile}`);
    console.log('');

    if (finalCheck.rows[0].total_users === finalCheck.rows[0].users_with_profile) {
      console.log('✅ All athletes now have profiles!');
    } else {
      console.log('⚠️  Some athletes still missing profiles');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 PostgreSQL is not running. Please start it:');
      console.log('   macOS: brew services start postgresql@14');
      console.log('   Linux: sudo service postgresql start');
    }
  } finally {
    await client.end();
  }
}

fixAthleteProfiles();
