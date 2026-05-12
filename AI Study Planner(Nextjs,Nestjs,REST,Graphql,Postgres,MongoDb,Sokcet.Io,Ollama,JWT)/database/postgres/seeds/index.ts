import 'dotenv/config';
import * as bcrypt from 'bcryptjs';

const { Pool } = require('pg');

const DB_NAME = process.env.DB_NAME ?? 'study_planner';

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

// Connect to the default 'postgres' DB to create our database if it doesn't exist
async function ensureDatabase() {
  const adminPool = new Pool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: 'postgres',
  });
  const client = await adminPool.connect();
  try {
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DB_NAME],
    );
    const quotedDbName = quoteIdentifier(DB_NAME);

    if (res.rowCount !== 0) {
      await client.query(
        `SELECT pg_terminate_backend(pid)
         FROM pg_stat_activity
         WHERE datname = $1 AND pid <> pg_backend_pid()`,
        [DB_NAME],
      );
      await client.query(`DROP DATABASE ${quotedDbName}`);
      console.log(`🗑️  Database "${DB_NAME}" dropped`);
    }

    await client.query(`CREATE DATABASE ${quotedDbName}`);
    console.log(`✅ Database "${DB_NAME}" created`);
  } finally {
    client.release();
    await adminPool.end();
  }
}

const pool = new Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: DB_NAME,
});

async function ensureSchema(client: any) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      password VARCHAR(255) NOT NULL,
      plan VARCHAR(50) NOT NULL DEFAULT 'free',
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS study_plans (
      id UUID PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      "userId" UUID NOT NULL,
      progress INTEGER NOT NULL DEFAULT 0,
      "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT fk_study_plans_user
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS topics (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      "planId" UUID NOT NULL,
      CONSTRAINT fk_topics_plan
        FOREIGN KEY ("planId") REFERENCES study_plans(id) ON DELETE CASCADE
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      "timeMinutes" INTEGER NOT NULL DEFAULT 30,
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      deadline VARCHAR(255),
      "topicId" UUID NOT NULL,
      CONSTRAINT fk_tasks_topic
        FOREIGN KEY ("topicId") REFERENCES topics(id) ON DELETE CASCADE
    );
  `);
}

async function seed() {
  await ensureDatabase();
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding PostgreSQL...');
    await ensureSchema(client);

    // Users
    const passwordHash = await bcrypt.hash('password123', 10);
    await client.query(`
      INSERT INTO users (id, email, name, password, plan, "createdAt", "updatedAt")
      VALUES
        ('00000000-0000-0000-0000-000000000001', 'alex@example.com', 'Alex Johnson', $1, 'premium', NOW(), NOW()),
        ('00000000-0000-0000-0000-000000000002', 'jane@example.com', 'Jane Smith', $1, 'free', NOW(), NOW())
      ON CONFLICT (email) DO NOTHING;
    `, [passwordHash]);
    console.log('✅ Users seeded');

    // Study Plans
    await client.query(`
      INSERT INTO study_plans (id, title, "userId", progress, "createdAt")
      VALUES
        ('10000000-0000-0000-0000-000000000001', 'Full Stack Development',      '00000000-0000-0000-0000-000000000001', 76, NOW()),
        ('10000000-0000-0000-0000-000000000002', 'System Design Mastery',       '00000000-0000-0000-0000-000000000001', 60, NOW()),
        ('10000000-0000-0000-0000-000000000003', 'AWS Certification',           '00000000-0000-0000-0000-000000000001', 40, NOW()),
        ('10000000-0000-0000-0000-000000000004', 'Data Structures & Algorithms','00000000-0000-0000-0000-000000000001', 80, NOW())
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Study Plans seeded');

    // Topics
    await client.query(`
      INSERT INTO topics (id, name, "planId")
      VALUES
        ('20000000-0000-0000-0000-000000000001', 'Data Structures', '10000000-0000-0000-0000-000000000001'),
        ('20000000-0000-0000-0000-000000000002', 'System Design',   '10000000-0000-0000-0000-000000000002'),
        ('20000000-0000-0000-0000-000000000003', 'Cloud Computing',  '10000000-0000-0000-0000-000000000003')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Topics seeded');

    // Tasks
    await client.query(`
      INSERT INTO tasks (id, title, "timeMinutes", status, deadline, "topicId")
      VALUES
        ('30000000-0000-0000-0000-000000000001', 'Arrays and Strings',       45, 'completed',  'Day 1',  '20000000-0000-0000-0000-000000000001'),
        ('30000000-0000-0000-0000-000000000002', 'Trees and Graphs',         60, 'in_progress', 'Day 2',  '20000000-0000-0000-0000-000000000001'),
        ('30000000-0000-0000-0000-000000000003', 'Design a URL Shortener',   60, 'pending',     'Day 3',  '20000000-0000-0000-0000-000000000002'),
        ('30000000-0000-0000-0000-000000000004', 'IAM and S3 Basics',        45, 'pending',     'Day 4',  '20000000-0000-0000-0000-000000000003')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Tasks seeded');

    console.log('🎉 PostgreSQL seeding complete!');
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
