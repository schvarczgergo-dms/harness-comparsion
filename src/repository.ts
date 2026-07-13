import { pool } from "./db/pool";
import { buildByDistanceList, type CustomerDistanceDto, type CustomerRow } from "./customers";

export async function countCustomers(): Promise<number> {
  const result = await pool.query<{ count: number }>(
    "SELECT COUNT(*)::int AS count FROM customers",
  );
  return result.rows[0].count;
}

export async function customersByDistance(): Promise<CustomerDistanceDto[]> {
  const result = await pool.query<CustomerRow>(
    "SELECT id, name, telepules, country_code, budget, lat, lon FROM customers",
  );
  return buildByDistanceList(result.rows);
}
