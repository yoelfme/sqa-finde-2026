import * as z from 'zod'
import { pgTable, text, integer, numeric, date, type PgColumnBuilderBase } from 'drizzle-orm/pg-core'
import { sqlTypeOf, type CsvColumnMeta } from './csv_parser.ts'

type SqlType = NonNullable<CsvColumnMeta['sqlType']>

// .meta() returns a clone of the schema, and helpers like csvNumber() are
// ZodPipe rather than ZodNumber, so inference only covers the plain cases.
// Anything else declares sqlType explicitly in the schema metadata.
function inferSqlType(field: z.ZodType): SqlType {
    if (field instanceof z.ZodNumber) {
        return 'numeric'
    }

    if (field instanceof z.ZodString || field instanceof z.ZodEnum) {
        return 'text'
    }

    return 'text'
}

function toColumn(name: string, sqlType: SqlType): PgColumnBuilderBase {
    switch (sqlType) {
        case 'integer':
            return integer(name)
        case 'numeric':
            // Drizzle returns numeric as a string by default
            return numeric(name, { mode: 'number' })
        case 'date':
            // Keeps '2029-02-18' as-is, with no timezone conversion
            return date(name, { mode: 'string' })
        case 'text':
            return text(name)
        default: {
            const _exhaustive: never = sqlType
            return _exhaustive
        }
    }
}

export function buildTable(tableName: string, schema: z.ZodObject) {
    const columns: Record<string, PgColumnBuilderBase> = {}

    for (const [key, field] of Object.entries(schema.shape)) {
        const zodField = field as z.ZodType
        columns[key] = toColumn(key, sqlTypeOf(zodField) ?? inferSqlType(zodField))
    }

    return pgTable(tableName, columns)
}
