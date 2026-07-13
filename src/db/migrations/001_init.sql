CREATE TABLE IF NOT EXISTS customers (
    id           SERIAL PRIMARY KEY,
    name         TEXT NOT NULL,
    telepules    TEXT NOT NULL,
    country_code TEXT,
    budget       INTEGER,
    note         TEXT,
    lat          DOUBLE PRECISION,
    lon          DOUBLE PRECISION,
    CONSTRAINT customers_name_telepules_key UNIQUE (name, telepules)
);
