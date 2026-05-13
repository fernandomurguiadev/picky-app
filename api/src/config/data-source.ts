import 'dotenv/config';
import { join } from 'path';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env['DATABASE_HOST'] ?? 'localhost',
  port: parseInt(process.env['DATABASE_PORT'] ?? '5432', 10),
  username: process.env['DATABASE_USERNAME'] ?? 'postgres',
  password: process.env['DATABASE_PASSWORD'] ?? 'admin',
  database: process.env['DATABASE_NAME'] ?? 'picky',
  ssl: process.env['DATABASE_SSL'] === 'true',
  entities: [join(process.cwd(), 'src/**/*.entity.ts')],
  migrations: [join(process.cwd(), 'src/migrations/*.ts')],
  synchronize: false,
  logging: process.env['DATABASE_LOGGING'] === 'true',
  extra: {
    max: 20,
    min: 2,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },
});
