import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { createApp } from "../src/app.ts";
import type { Repository } from "../src/repository.ts";
import type { CustomerRow } from "../src/customers.ts";

const row = (over: Partial<CustomerRow>): CustomerRow => ({
  id: 1,
  name: "X",
  telepules: "Somewhere",
  country_code: null,
  budget: null,
  note: null,
  lat: null,
  lon: null,
  ...over,
});

function startApp(repo: Repository): Promise<{ base: string; server: Server }> {
  return new Promise((resolve) => {
    const server = createApp(repo).listen(0, () => {
      const { port } = server.address() as AddressInfo;
      resolve({ base: `http://127.0.0.1:${port}`, server });
    });
  });
}

describe("HTTP API", () => {
  let base: string;
  let server: Server;

  const repo: Repository = {
    countCustomers: async () => 15,
    getAllCustomers: async () => [
      row({ id: 1, name: "Vienna", telepules: "Vienna", lat: 48.2082, lon: 16.3738 }),
      row({ id: 2, name: "Budapest", telepules: "Budapest", lat: 47.4979, lon: 19.0402 }),
      row({ id: 3, name: "Nowhere", telepules: "Atlantis", lat: null, lon: null }),
    ],
  };

  beforeAll(async () => {
    ({ base, server } = await startApp(repo));
  });

  afterAll(() => {
    server.close();
  });

  it("GET /health returns ok (FR-7)", async () => {
    const res = await fetch(`${base}/health`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("GET /customers/count returns the count (FR-5)", async () => {
    const res = await fetch(`${base}/customers/count`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ count: 15 });
  });

  it("GET /customers/by-distance is ordered: Budapest 0 first, unknown null last (FR-6)", async () => {
    const res = await fetch(`${base}/customers/by-distance`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Array<{ name: string; distanceKm: number | null }>;
    expect(body.map((c) => c.name)).toEqual(["Budapest", "Vienna", "Nowhere"]);
    expect(body[0]!.distanceKm).toBe(0);
    expect(body[2]!.distanceKm).toBeNull();
  });

  it("returns 500 { error } on repository failure", async () => {
    const failing: Repository = {
      countCustomers: async () => {
        throw new Error("db down");
      },
      getAllCustomers: async () => [],
    };
    const { base: b, server: s } = await startApp(failing);
    const res = await fetch(`${b}/customers/count`);
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "db down" });
    s.close();
  });
});
