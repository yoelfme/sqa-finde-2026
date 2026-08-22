import { afterAll, beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql'
import { Pool } from 'pg'
import CsvReader from '../src/csv_reader'
import CsvParser from '../src/csv_parser'
import DatabaseIngestor from '../src/database_ingestor'
import { productSchema, type Product } from '../src/schemas/product'

const POSTGRES_IMAGE = 'postgres:18-alpine'
const TABLE = 'products'
const VALID_PATH = 'data/products.csv'
const EXPECTED_ROW_COUNT = 520

const A_PRODUCT: Product = {
    product: 'Algodón 100g Mini',
    sku: 'ABR-00001',
    stock: 188,
    cost: 17.35,
    price: 26.76,
    unit: 'pieza',
    expires_at: '2029-02-18'
}

let container: StartedPostgreSqlContainer
let pool: Pool
let connectionString: string

const options = (overrides: Record<string, unknown> = {}) => ({
    connectionString,
    table: TABLE,
    schema: productSchema,
    ...overrides
})

beforeAll(async () => {
    // The same db/init.sql that compose.yaml mounts, so tests and production
    // share one source of truth for the DDL.
    container = await new PostgreSqlContainer(POSTGRES_IMAGE)
        .withDatabase('inventory')
        .withCopyFilesToContainer([
            { source: 'db/init.sql', target: '/docker-entrypoint-initdb.d/init.sql' }
        ])
        .start()

    connectionString = container.getConnectionUri()
    pool = new Pool({ connectionString })
})

afterAll(async () => {
    await pool?.end()
    await container?.stop()
})

beforeEach(async () => {
    await pool.query(`TRUNCATE TABLE ${TABLE} RESTART IDENTITY`)
})

const countRows = async () => {
    const result = await pool.query(`SELECT count(*)::int AS total FROM ${TABLE}`)
    return result.rows[0].total as number
}

describe('DatabaseIngestor.ingest', () => {
    describe('table validation', () => {
        test('returns error when the target table does not exist', async () => {
            // Given
            const rows = [A_PRODUCT]

            // When
            const result = await DatabaseIngestor.ingest(rows, options({ table: 'missing_table' }))

            // Then
            expect(result.error).toBe(true)
            expect(result.message).toBe('Table missing_table does not exist')
            expect(result.data).toBeUndefined()
        })

        test('returns error when the table name is not a valid identifier', async () => {
            // Given
            const rows = [A_PRODUCT]

            // When
            const result = await DatabaseIngestor.ingest(
                rows,
                options({ table: 'products; DROP TABLE products' })
            )

            // Then
            expect(result.error).toBe(true)
            expect(result.message).toBe('Invalid table name: products; DROP TABLE products')
        })

        test('leaves the table untouched when the table name is rejected', async () => {
            // Given
            await DatabaseIngestor.ingest([A_PRODUCT], options())

            // When
            await DatabaseIngestor.ingest([A_PRODUCT], options({ table: 'bad name' }))

            // Then
            expect(await countRows()).toBe(1)
        })
    })

    describe('insertion', () => {
        test('inserts a single row into the target table', async () => {
            // Given
            const rows = [A_PRODUCT]

            // When
            const result = await DatabaseIngestor.ingest(rows, options())

            // Then
            expect(result.error).toBe(false)
            expect(await countRows()).toBe(1)
        })

        test('reports the number of inserted rows', async () => {
            // Given
            const rows = [A_PRODUCT, { ...A_PRODUCT, sku: 'ABR-00002' }]

            // When
            const result = await DatabaseIngestor.ingest(rows, options())

            // Then
            expect(result.data?.inserted).toBe(2)
            expect(result.message).toBe(`2 rows inserted into ${TABLE}`)
        })

        test('inserts every row it is given across batches', async () => {
            // Given
            const rows = Array.from({ length: 25 }, (_, index) => ({
                ...A_PRODUCT,
                sku: `BATCH-${String(index).padStart(5, '0')}`
            }))

            // When
            const result = await DatabaseIngestor.ingest(rows, options({ batchSize: 10 }))

            // Then
            expect(result.error).toBe(false)
            expect(await countRows()).toBe(25)
        })

        test('stores numeric columns with their decimal precision', async () => {
            // Given
            const rows = [A_PRODUCT]

            // When
            await DatabaseIngestor.ingest(rows, options())

            // Then
            const stored = await pool.query(
                `SELECT cost::float8 AS cost, price::float8 AS price, stock FROM ${TABLE}`
            )
            expect(stored.rows[0]).toStrictEqual({ cost: 17.35, price: 26.76, stock: 188 })
        })

        test('stores dates as calendar dates', async () => {
            // Given
            const rows = [A_PRODUCT]

            // When
            await DatabaseIngestor.ingest(rows, options())

            // Then
            const stored = await pool.query(
                `SELECT to_char(expires_at, 'YYYY-MM-DD') AS expires_at FROM ${TABLE}`
            )
            expect(stored.rows[0].expires_at).toBe('2029-02-18')
        })

        test('preserves UTF-8 accents in product names', async () => {
            // Given
            const rows = [A_PRODUCT]

            // When
            await DatabaseIngestor.ingest(rows, options())

            // Then
            const stored = await pool.query(`SELECT product FROM ${TABLE}`)
            expect(stored.rows[0].product).toBe('Algodón 100g Mini')
        })
    })

    describe('failure handling', () => {
        test('inserts nothing when a row violates a database constraint', async () => {
            // Given
            const rows = [A_PRODUCT, { ...A_PRODUCT, product: 'Duplicado' }]

            // When
            const result = await DatabaseIngestor.ingest(rows, options())

            // Then
            expect(result.error).toBe(true)
            expect(await countRows()).toBe(0)
        })

        test('reports the database error without the generated SQL', async () => {
            // Given
            const rows = [A_PRODUCT, { ...A_PRODUCT, product: 'Duplicado' }]

            // When
            const result = await DatabaseIngestor.ingest(rows, options())

            // Then
            expect(result.message).toBe(
                'duplicate key value violates unique constraint "products_sku_key"' +
                    ' (Key (sku)=(ABR-00001) already exists.)'
            )
            expect(result.message).not.toContain('insert into')
        })

        test('rolls back rows already inserted in an earlier batch', async () => {
            // Given
            const rows = [
                ...Array.from({ length: 10 }, (_, index) => ({
                    ...A_PRODUCT,
                    sku: `BATCH-${String(index).padStart(5, '0')}`
                })),
                A_PRODUCT,
                A_PRODUCT
            ]

            // When
            const result = await DatabaseIngestor.ingest(rows, options({ batchSize: 5 }))

            // Then
            expect(result.error).toBe(true)
            expect(await countRows()).toBe(0)
        })

        test('returns error when the connection string is invalid', async () => {
            // Given
            const badConnection = 'postgres://nobody:nobody@127.0.0.1:1/nowhere'

            // When
            const result = await DatabaseIngestor.ingest(
                [A_PRODUCT],
                options({ connectionString: badConnection })
            )

            // Then
            expect(result.error).toBe(true)
            expect(result.data).toBeUndefined()
        })

        test('accepts an empty row list without touching the database', async () => {
            // Given
            const rows: Product[] = []

            // When
            const result = await DatabaseIngestor.ingest(rows, options())

            // Then
            expect(result.error).toBe(false)
            expect(result.data?.inserted).toBe(0)
            expect(await countRows()).toBe(0)
        })
    })

    describe('end to end', () => {
        test('reads, parses and ingests data/products.csv', async () => {
            // Given
            const parsed = CsvParser.parse(CsvReader.read(VALID_PATH), productSchema)

            // When
            const result = await DatabaseIngestor.ingest(parsed.data ?? [], options())

            // Then
            expect(result.error).toBe(false)
            expect(result.data?.inserted).toBe(EXPECTED_ROW_COUNT)
            expect(await countRows()).toBe(EXPECTED_ROW_COUNT)
        })

        test('round-trips the first product of the CSV unchanged', async () => {
            // Given
            const parsed = CsvParser.parse(CsvReader.read(VALID_PATH), productSchema)

            // When
            await DatabaseIngestor.ingest(parsed.data ?? [], options())

            // Then
            const stored = await pool.query(
                `SELECT product, sku, stock, cost::float8 AS cost, price::float8 AS price, unit,
                        to_char(expires_at, 'YYYY-MM-DD') AS expires_at
                 FROM ${TABLE} WHERE sku = 'ABR-00001'`
            )
            expect(stored.rows[0]).toStrictEqual(A_PRODUCT)
        })
    })
})
