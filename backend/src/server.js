import http from 'node:http';
import dotenv from 'dotenv';
import app from './app.js';
import { initDatabaseAndSeed, getDb } from './config/db.js';

dotenv.config();

const PORT = Number(process.env.PORT || 8000);

async function bootstrap() {
  const startMs = Date.now();
  await initDatabaseAndSeed();
  const db = await getDb();

  const server = http.createServer(app);
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  server.maxConnections = 5000;

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`\n====================================================================`);
    console.log(`🚀 Learn JKLU 2.0 Express.js Engine listening on http://localhost:${PORT}`);
    console.log(`🐘 Database Engine : ${db.engineName}`);
    console.log(`⚡ Startup Time    : ${Date.now() - startMs} ms`);
    console.log(`====================================================================\n`);
  });
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start Express server:', err);
  process.exit(1);
});
