import 'dotenv/config';
import { Client } from 'pg';

async function main() {
  const client = new Client({
    host: process.env.DATABASE_HOST ?? 'localhost',
    port: parseInt(process.env.DATABASE_PORT ?? '5432'),
    user: process.env.DATABASE_USERNAME ?? 'postgres',
    password: process.env.DATABASE_PASSWORD ?? 'admin',
    database: process.env.DATABASE_NAME ?? 'picky',
  });

  await client.connect();
  console.log('Connected to PG');

  const res = await client.query(
    'SELECT id, "tenantId", "primaryColor", "createdAt", "updatedAt" FROM store_settings;',
  );
  console.log('--- STORE SETTINGS ---');
  console.log(res.rows);
  console.log('Total records:', res.rowCount);

  await client.end();
}

main().catch(console.error);
