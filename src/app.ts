import fastify from "fastify";

export function buildApp() {
  const app = fastify({ logger: false });

  app.get("/", async () => {
    return { status: "ok", message: "Skeleton is fully operational!" };
  });

  // ── Infrastructure Routes ──────────────────────────────────────
  app.get("/health", async (_request, reply) => {
    return reply.send({
      status: "ok",
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
