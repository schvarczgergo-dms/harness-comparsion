import type { Pool } from "pg";
import type { CustomerRow } from "./customers.ts";

/** Data access surface consumed by the HTTP layer (injectable for tests). */
export interface Repository {
  countCustomers(): Promise<number>;
  getAllCustomers(): Promise<CustomerRow[]>;
}

/** Postgres-backed repository. */
export function createRepository(pool: Pool): Repository {
  return {
    async countCustomers(): Promise<number> {
      const { rows } = await pool.query<{ count: number }>(
        "SELECT COUNT(*)::int AS count FROM customers",
      );
      return rows[0]?.count ?? 0;
    },

    async getAllCustomers(): Promise<CustomerRow[]> {
      const { rows } = await pool.query<CustomerRow>(
        `SELECT id, name, telepules, country_code, budget, note, lat, lon
         FROM customers`,
      );
      return rows;
    },
  };
}
