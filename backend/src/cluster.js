import cluster from 'node:cluster';
import os from 'node:os';

const NUM_WORKERS = Math.max(2, Math.min(os.cpus().length, 8));

if (cluster.isPrimary) {
  console.log(
    `⚡ Starting Learn JKLU Express Cluster with ${NUM_WORKERS} workers for 1,000+ concurrent users...`
  );
  for (let i = 0; i < NUM_WORKERS; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker) => {
    console.warn(`⚠️ Worker ${worker.process.pid} exited. Spawning replacement...`);
    cluster.fork();
  });
} else {
  await import('./server.js');
}
