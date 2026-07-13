import { createApp } from "./app.ts";
import { createRepository } from "./repository.ts";
import { pool } from "./db/pool.ts";
import { config } from "./config.ts";

const app = createApp(createRepository(pool));

const server = app.listen(config.port, () => {
  console.log(`[server] listening on http://localhost:${config.port}`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`[server] ${signal} received, shutting down...`);
  server.close(async () => {
    await pool.end();
    console.log("[server] closed");
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
