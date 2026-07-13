import "dotenv/config";

export const config = {
  databaseUrl:
    process.env.DATABASE_URL ?? "postgres://app:app@localhost:5433/customers",
  port: Number(process.env.PORT ?? 3000),
};
