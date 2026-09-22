const client = require('@prometheus-io/client');

const register = new client.Registry();
// Default metrics (including nodejs_version_info) are collected on scrape.
client.collectDefaultMetrics({ register });

const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of completed HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

function trackHttpRequests(req, res, next) {
  // Monitoring traffic should not inflate application traffic measurements.
  if (req.path.replace(/\/$/, "") === "/murandi/v1/metrics") {
    return next();
  }
  const start = process.hrtime.bigint();
  res.once("finish", () => {
    // Use route templates, never user IDs or arbitrary unmatched URL paths.
    const route = req.route
      ? `${req.baseUrl || ""}${req.route.path}`
      : "unmatched";
    const labels = { method: req.method, route, status_code: res.statusCode };
    httpRequestCounter.inc(labels);
    httpRequestDuration.observe(labels, Number(process.hrtime.bigint() - start) / 1e9);
  });
  next();
}

async function fetchMetrics(req, res) {
  try {
    const metrics = await register.metrics();
    res.set("Content-Type", register.contentType);
    res.end(metrics);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

module.exports = { httpRequestCounter, trackHttpRequests, fetchMetrics };
