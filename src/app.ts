import express, { type NextFunction, type Request, type Response } from "express";
import { countCustomers, customersByDistance } from "./repository";

export function createApp() {
  const app = express();

  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok" });
  });

  app.get("/customers/count", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({ count: await countCustomers() });
    } catch (error) {
      next(error);
    }
  });

  app.get("/customers/by-distance", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await customersByDistance());
    } catch (error) {
      next(error);
    }
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(error);
    res.status(500).json({ error: "internal_server_error" });
  });

  return app;
}
