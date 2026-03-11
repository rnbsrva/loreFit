const fs = require("fs");
const path = require("path");
const { pool } = require("./pool");

const migrationsDir = path.join(__dirname, "migrations");

async function ensureMigrationsTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations() {
  const result = await pool.query("SELECT filename FROM schema_migrations");
  return new Set(result.rows.map((row) => row.filename));
}

function getMigrationFiles() {
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  return fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
}

async function applyMigration(filename) {
  const filePath = path.join(migrationsDir, filename);
  const sql = fs.readFileSync(filePath, "utf8");
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query(
      "INSERT INTO schema_migrations (filename) VALUES ($1)",
      [filename]
    );
    await client.query("COMMIT");
    console.log(`Applied migration: ${filename}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function runMigrations() {
  await ensureMigrationsTable();
  const appliedMigrations = await getAppliedMigrations();
  const migrationFiles = getMigrationFiles();

  for (const filename of migrationFiles) {
    if (!appliedMigrations.has(filename)) {
      await applyMigration(filename);
    }
  }
}

if (require.main === module) {
  runMigrations()
    .then(async () => {
      console.log("Migrations complete");
      await pool.end();
      process.exit(0);
    })
    .catch(async (error) => {
      console.error("Migration failed:", error);
      await pool.end();
      process.exit(1);
    });
}

module.exports = { runMigrations };