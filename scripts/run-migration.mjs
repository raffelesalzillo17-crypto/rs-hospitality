// Esegue la migrazione schema RS Hospitality
// Usage: DB_PASSWORD=xxx node scripts/run-migration.mjs

import { readFileSync } from 'fs';
import { Client } from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PASSWORD = process.env.DB_PASSWORD;
if (!DB_PASSWORD) {
  console.error('❌  Manca DB_PASSWORD. Uso: DB_PASSWORD=xxx node scripts/run-migration.mjs');
  process.exit(1);
}

const PROJECT_REF = 'mjrdjkrqhmxvlmfpbfqf';

const client = new Client({
  host: `db.${PROJECT_REF}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
});

const sql = readFileSync(
  join(__dirname, '../supabase/migrations/20260320_schema_rs_hospitality.sql'),
  'utf8'
);

try {
  await client.connect();
  console.log('✅  Connesso al database');
  await client.query(sql);
  console.log('✅  Migrazione eseguita con successo');

  // Verifica tabelle create
  const { rows } = await client.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN ('properties','guests','bookings','messages','payments')
    ORDER BY tablename
  `);
  console.log('\nTabelle presenti:');
  rows.forEach(r => console.log('  •', r.tablename));

  // Verifica record Il Tulipano
  const { rows: props } = await client.query("SELECT id, name, category FROM properties WHERE name = 'Il Tulipano'");
  if (props.length) console.log('\n✅  Record test "Il Tulipano":', props[0]);

} catch (err) {
  console.error('❌  Errore:', err.message);
} finally {
  await client.end();
}
