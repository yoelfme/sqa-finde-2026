# Week 7 — CSV inventory ingest pipeline

Pipeline de tres etapas que carga un CSV de inventario de productos en PostgreSQL:

1. **csv_reader** — valida ruta/extensión y parte el archivo en headers + rows
2. **csv_parser** — mapea headers → schema Zod, valida todas las filas (todo o nada)
3. **database_ingestor** — inserta con Drizzle en lotes de 500 dentro de una transacción

El orquestador vive en `src/pipeline.ts` para que el CLI y una UI futura compartan la misma lógica.

## Stack

- TypeScript
- Vitest + `@vitest/coverage-v8` (umbral inicial 80%)
- Testcontainers (`@testcontainers/postgresql`)
- Drizzle ORM + `pg`
- Zod 4

## Setup

```bash
pnpm install
pnpm db:up          # Postgres local vía Docker Compose
```

Copia `.env.example` a `.env` si quieres sobrescribir `DATABASE_URL`.

## Uso

```bash
pnpm ingest [csvPath] [table]
# defaults: data/products.csv  products
```

## Tests

Los tests siguen el patrón **Given / When / Then**.

```bash
pnpm test:unit              # sin Docker
pnpm test:integration       # requiere Docker (Testcontainers)
pnpm test                   # watch mode
pnpm test:coverage          # unit + integration + reporte (requiere Docker)
pnpm test:coverage:unit     # cobertura rápida solo unit
```

El reporte HTML queda en `coverage/index.html`.

## Fixtures (`data/`)

| Archivo | Propósito |
|---|---|
| `products.csv` | Happy path (~520 filas) |
| `single_valid.csv` | Una fila válida |
| `empty.csv` | Archivo vacío |
| `only_header.csv` | Solo encabezados |
| `blank_rows.csv` | Filas válidas + líneas en blanco |
| `invalid_products.csv` | Filas con tipos/enum inválidos |
| `headers_missing.csv` | Faltan columnas requeridas |
| `not_a_csv.txt` | Extensión incorrecta |
