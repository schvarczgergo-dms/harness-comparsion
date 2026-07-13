import { createApp } from "./app";
import { config } from "./config";
import { pool } from "./db/pool";

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`listening on http://localhost:${config.port}`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`\n${signal} received, shutting down...`);
  server.close();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
