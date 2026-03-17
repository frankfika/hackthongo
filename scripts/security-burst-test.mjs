const baseUrl = process.env.SECURITY_TEST_BASE_URL || "http://127.0.0.1:3000";
const endpoint = process.env.SECURITY_TEST_ENDPOINT || "/api/auth/session";
const totalRequests = Number(process.env.SECURITY_TEST_REQUESTS || 120);
const concurrency = Number(process.env.SECURITY_TEST_CONCURRENCY || 20);

async function runBatch(size) {
  const jobs = Array.from({ length: size }, async () => {
    const startedAt = Date.now();
    const response = await fetch(`${baseUrl}${endpoint}`);
    return {
      status: response.status,
      durationMs: Date.now() - startedAt,
    };
  });
  return Promise.all(jobs);
}

async function main() {
  const batches = Math.ceil(totalRequests / concurrency);
  const results = [];
  for (let i = 0; i < batches; i += 1) {
    const remaining = totalRequests - i * concurrency;
    const size = Math.min(concurrency, remaining);
    const batchResult = await runBatch(size);
    results.push(...batchResult);
  }

  const counts = results.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  const avgMs = Math.round(results.reduce((sum, item) => sum + item.durationMs, 0) / Math.max(1, results.length));
  const maxMs = results.reduce((max, item) => Math.max(max, item.durationMs), 0);
  const rateLimited = counts[429] || 0;

  process.stdout.write(
    JSON.stringify(
      {
        endpoint: `${baseUrl}${endpoint}`,
        totalRequests,
        concurrency,
        statusCounts: counts,
        rateLimited,
        avgDurationMs: avgMs,
        maxDurationMs: maxMs,
      },
      null,
      2
    ) + "\n"
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
