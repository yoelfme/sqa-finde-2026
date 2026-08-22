CREATE TABLE IF NOT EXISTS products (
    id          SERIAL PRIMARY KEY,
    product     TEXT           NOT NULL,
    sku         TEXT           NOT NULL UNIQUE,
    stock       INTEGER        NOT NULL,
    cost        NUMERIC(10, 2) NOT NULL,
    price       NUMERIC(10, 2) NOT NULL,
    unit        TEXT           NOT NULL,
    expires_at  DATE           NOT NULL
);
