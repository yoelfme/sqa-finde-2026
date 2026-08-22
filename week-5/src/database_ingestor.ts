import * as z from 'zod'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { buildTable } from './zod_to_drizzle.ts'

const VALID_TABLE_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/
const DEFAULT_BATCH_SIZE = 500

export interface IngestorOptions {
    connectionString: string
    table: string
    schema: z.ZodObject
    batchSize?: number
}

export interface DatabaseIngestorResult {
    error: boolean
    message: string
    data?: { inserted: number }
}

// Drizzle wraps driver failures in a DrizzleQueryError whose message embeds the
// entire generated SQL — thousands of placeholders for a large batch. The root
// cause is the pg error that actually explains what went wrong.
function describeError(error: unknown): string {
    let cause: unknown = error

    while (cause instanceof Error && cause.cause !== undefined) {
        cause = cause.cause
    }

    if (!(cause instanceof Error)) {
        return String(cause)
    }

    const detail = (cause as { detail?: string }).detail

    return detail ? `${cause.message} (${detail})` : cause.message
}

async function ingest(
    rows: Record<string, unknown>[],
    options: IngestorOptions
): Promise<DatabaseIngestorResult> {
    const { connectionString, table, schema, batchSize = DEFAULT_BATCH_SIZE } = options

    // The table name comes from the caller and ends up as an SQL identifier,
    // so it is rejected before any connection is opened.
    if (!VALID_TABLE_NAME.test(table)) {
        return {
            error: true,
            message: `Invalid table name: ${table}`
        }
    }

    const pool = new Pool({ connectionString })

    try {
        const db = drizzle({ client: pool })

        const existing = await db.execute(sql`
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = ${table}
        `)

        if (existing.rows.length === 0) {
            return {
                error: true,
                message: `Table ${table} does not exist`
            }
        }

        const target = buildTable(table, schema)

        // One transaction for every batch, so a failure anywhere leaves the
        // table exactly as it was.
        await db.transaction(async tx => {
            for (let start = 0; start < rows.length; start += batchSize) {
                const batch = rows.slice(start, start + batchSize)
                await tx.insert(target).values(batch)
            }
        })

        return {
            error: false,
            message: `${rows.length} rows inserted into ${table}`,
            data: { inserted: rows.length }
        }
    } catch (error) {
        return {
            error: true,
            message: describeError(error)
        }
    } finally {
        await pool.end()
    }
}

export default { ingest }
