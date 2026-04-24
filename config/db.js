const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const init = async () => {
  // create the table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name VARCHAR UNIQUE NOT NULL,
      gender VARCHAR,
      gender_probability FLOAT,
      age INT,
      age_group VARCHAR,
      country_id VARCHAR(2),
      country_name VARCHAR,
      country_probability FLOAT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // add country_name column if it doesn't exist
  // this handles the case where table exists from Stage 1
  await pool.query(`
    ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS country_name VARCHAR
  `);
};

init();

module.exports = pool;