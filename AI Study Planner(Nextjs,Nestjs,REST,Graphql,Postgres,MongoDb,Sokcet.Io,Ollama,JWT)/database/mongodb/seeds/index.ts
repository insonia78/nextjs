import 'dotenv/config';
import { MongoClient } from 'mongodb';

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/study_planner_sessions';
const DB_NAME = new URL(MONGO_URI).pathname.replace('/', '') || 'study_planner_sessions';

async function seed() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log('🌱 Seeding MongoDB...');

  const adminDb = client.db('admin');
  const dbs = await adminDb.admin().listDatabases();
  const exists = dbs.databases.some((db) => db.name === DB_NAME);

  const db = client.db(DB_NAME);
  if (exists) {
    await db.dropDatabase();
    console.log(`🗑️  Database "${DB_NAME}" dropped`);
  }
  console.log(`✅ Database "${DB_NAME}" created`);

  const sessions = db.collection('studysessions');

  const seedData = [
    {
      userId: '00000000-0000-0000-0000-000000000001',
      taskId: '30000000-0000-0000-0000-000000000001',
      planId: '10000000-0000-0000-0000-000000000001',
      topicId: '20000000-0000-0000-0000-000000000001',
      status: 'completed',
      timeSpent: 45,
      notes: 'Reviewed arrays with LeetCode problems',
      createdAt: new Date('2024-05-01T09:00:00Z'),
      _seeded: true,
    },
    {
      userId: '00000000-0000-0000-0000-000000000001',
      taskId: '30000000-0000-0000-0000-000000000002',
      planId: '10000000-0000-0000-0000-000000000001',
      topicId: '20000000-0000-0000-0000-000000000001',
      status: 'in_progress',
      timeSpent: 30,
      notes: 'Started BFS/DFS traversals',
      createdAt: new Date('2024-05-02T10:00:00Z'),
      _seeded: true,
    },
    {
      userId: '00000000-0000-0000-0000-000000000001',
      taskId: '30000000-0000-0000-0000-000000000003',
      planId: '10000000-0000-0000-0000-000000000002',
      topicId: '20000000-0000-0000-0000-000000000002',
      status: 'pending',
      timeSpent: 0,
      notes: '',
      createdAt: new Date('2024-05-03T08:00:00Z'),
      _seeded: true,
    },
    {
      userId: '00000000-0000-0000-0000-000000000002',
      taskId: '30000000-0000-0000-0000-000000000004',
      planId: '10000000-0000-0000-0000-000000000003',
      topicId: '20000000-0000-0000-0000-000000000003',
      status: 'completed',
      timeSpent: 60,
      notes: 'Completed AWS IAM and S3 module',
      createdAt: new Date('2024-05-01T14:00:00Z'),
      _seeded: true,
    },
  ];

  await sessions.insertMany(seedData);
  console.log(`✅ Inserted ${seedData.length} study sessions`);

  console.log('🎉 MongoDB seeding complete!');
  await client.close();
}

seed().catch((err) => {
  console.error('MongoDB seed failed:', err);
  process.exit(1);
});
