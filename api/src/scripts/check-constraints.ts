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
  
  const res = await client.query(`
    SELECT conname, contype, pg_get_constraintdef(c.oid) 
    FROM pg_constraint c 
    JOIN pg_namespace n ON n.oid = c.connamespace 
    WHERE conrelid = 'store_settings'::regclass;
  `);
  console.log('Constraints:', res.rows);

  const indexes = await client.query(`
    SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'store_settings';
  `);
  console.log('Indexes:', indexes.rows);
  
  await client.end();
}

main().catch(console.error);
