/**
 * 1,000-Concurrent-User Live Stress Benchmark (Pure JS)
 * Simulates 1,000 simultaneous requests across:
 *   - 400 Browsing Catalog & Search (/papers/public, /courses)
 *   - 400 Simultaneous PDF Byte-Range Downloads (/papers/:id/download)
 *   - 200 Simultaneous Logins (/login)
 */
const BASE_URL = process.env.BENCHMARK_URL || 'http://localhost:8000';

async function runBenchmark() {
  console.log(`\n🔥 Launching 1,000-Concurrent-User Stress Test against ${BASE_URL}...\n`);

  const pubRes = await fetch(`${BASE_URL}/papers/public?limit=5`).then((r) => r.json());
  const samplePaperId = pubRes.items?.[0]?.id || 78;

  const totalUsers = 1000;
  const latencies = [];
  let successes = 0;
  let failures = 0;

  const startWall = performance.now();

  const tasks = Array.from({ length: totalUsers }, async (_, i) => {
    const t0 = performance.now();
    try {
      let res;
      if (i < 400) {
        const path = i % 2 === 0 ? '/papers/public?page=1&limit=20' : '/courses';
        res = await fetch(`${BASE_URL}${path}`);
        await res.arrayBuffer();
      } else if (i < 800) {
        res = await fetch(`${BASE_URL}/papers/${samplePaperId}/download`, {
          headers: { Range: 'bytes=0-65535' },
        });
        await res.arrayBuffer();
      } else {
        res = await fetch(`${BASE_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@jklu.edu.in',
            password: process.env.DEFAULT_ADMIN_PASSWORD || '',
          }),
        });
        await res.arrayBuffer();
      }

      const elapsed = performance.now() - t0;
      latencies.push(elapsed);
      if (res.ok || res.status === 206) successes++;
      else failures++;
    } catch {
      failures++;
    }
  });

  await Promise.all(tasks);
  const totalWallMs = performance.now() - startWall;
  latencies.sort((a, b) => a - b);

  const p50 = latencies[Math.floor(latencies.length * 0.5)] || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)] || 0;
  const p99 = latencies[Math.floor(latencies.length * 0.99)] || 0;
  const rps = Math.round((totalUsers / totalWallMs) * 1000);

  console.log(`================================================================`);
  console.log(`✅ 1,000-CONCURRENT-USER BENCHMARK RESULTS (PURE JS)`);
  console.log(`================================================================`);
  console.log(`Total Simultaneous Users : ${totalUsers} (400 Browse, 400 PDF DL, 200 Login)`);
  console.log(
    `Success Rate             : ${successes}/${totalUsers} (${((successes / totalUsers) * 100).toFixed(2)}%)`
  );
  console.log(`Total Wall Time          : ${totalWallMs.toFixed(0)} ms`);
  console.log(`Throughput               : ${rps.toLocaleString()} req/sec`);
  console.log(`P50 Latency              : ${p50.toFixed(1)} ms`);
  console.log(`P95 Latency              : ${p95.toFixed(1)} ms`);
  console.log(`P99 Latency              : ${p99.toFixed(1)} ms`);
  console.log(`================================================================\n`);
}

runBenchmark().catch(console.error);
