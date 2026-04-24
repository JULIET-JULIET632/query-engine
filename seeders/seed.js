const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { v7: uuidv7 } = require('uuid');

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:uGBJOWYpAwdrlyNIqHNPmZrtgUlesVqK@hopper.proxy.rlwy.net:54851/railway';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const seed = async () => {
  console.log('Starting seed...');

  const filePath = path.join(__dirname, 'profiles.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(raw);
  const profiles = json.profiles;

  console.log(`Found ${profiles.length} profiles to seed`);

  // build one big INSERT with all values at once
  // much faster than inserting one by one
  const values = [];
  const params = [];
  let paramCount = 1;

  for (const profile of profiles) {
    values.push(`($${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++}, $${paramCount++})`);
    params.push(
      uuidv7(),
      profile.name,
      profile.gender,
      profile.gender_probability,
      profile.age,
      profile.age_group,
      profile.country_id,
      profile.country_name,
      profile.country_probability,
      new Date().toISOString()
    );
  }

  await pool.query(
    `INSERT INTO profiles (id, name, gender, gender_probability, age, age_group, country_id, country_name, country_probability, created_at)
     VALUES ${values.join(', ')}
     ON CONFLICT (name) DO NOTHING`,
    params
  );

  console.log('Seed complete!');
  process.exit(0);
};

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});