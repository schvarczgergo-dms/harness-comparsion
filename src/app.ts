import express, { type Express, type Request, type Response, type NextFunction } from "express";
import type { Repository } from "./repository.ts";
import { buildByDistanceList } from "./customers.ts";

export function createApp(repo: Repository): Express {
  const app = express();

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.get("/customers/count", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await repo.countCustomers();
      res.json({ count });
    } catch (err) {
      next(err);
    }
  });

  app.get("/customers/by-distance", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const rows = await repo.getAllCustomers();
      res.json(buildByDistanceList(rows));
    } catch (err) {
      next(err);
    }
  });

  // Central error handler → { error } (Express 5: 4-arg signature).
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = err instanceof Error ? err.message : "internal error";
    console.error("[app] request failed:", err);
    res.status(500).json({ error: message });
  });

  return app;
}
