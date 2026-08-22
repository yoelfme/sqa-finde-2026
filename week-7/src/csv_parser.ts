import * as z from 'zod'
import type { CsvRawData, ParseIssue, Result } from './types.ts'

// Structural mirror of what CsvReader.read returns, so the parser stays
// decoupled from the reader module.
export type CsvReaderResult = Result<CsvRawData>

export interface CsvColumnMeta {
    csvHeader: string
    sqlType?: 'text' | 'integer' | 'numeric' | 'date'
}

export type CsvParserResult<T> = Result<T[]>

export function csvHeaderOf(field: z.ZodType): string | undefined {
    return (field.meta() as CsvColumnMeta | undefined)?.csvHeader
}

export function sqlTypeOf(field: z.ZodType): CsvColumnMeta['sqlType'] {
    return (field.meta() as CsvColumnMeta | undefined)?.sqlType
}

function parse<T extends z.ZodObject>(
    readerResult: CsvReaderResult,
    schema: T
): CsvParserResult<z.infer<T>> {
    // 1. Nothing to parse if the reader already failed
    if (readerResult.error || !readerResult.data) {
        return {
            error: true,
            message: readerResult.message
        }
    }

    const { headers, rows } = readerResult.data

    // 2. Resolve every schema field to a column index in the CSV
    const columns: { key: string; csvHeader: string; index: number }[] = []
    const missingHeaders: string[] = []

    for (const [key, field] of Object.entries(schema.shape)) {
        const csvHeader = csvHeaderOf(field as z.ZodType)

        if (!csvHeader) {
            return {
                error: true,
                message: `Schema field "${key}" is missing csvHeader metadata`
            }
        }

        const index = headers.indexOf(csvHeader)

        if (index === -1) {
            missingHeaders.push(csvHeader)
            continue
        }

        columns.push({ key, csvHeader, index })
    }

    if (missingHeaders.length > 0) {
        return {
            error: true,
            message: `Headers not found in CSV: ${missingHeaders.join(', ')}`
        }
    }

    const headerByKey = new Map(columns.map(column => [column.key, column.csvHeader]))

    // 3. Validate every non-blank row, collecting all the failures
    const data: z.infer<T>[] = []
    const issues: ParseIssue[] = []
    const invalidRows = new Set<number>()
    let rowNumber = 0

    for (const row of rows) {
        // The reader turns a trailing newline into a [''] row
        if (row.every(cell => cell.trim() === '')) {
            continue
        }

        rowNumber++

        const candidate: Record<string, string> = {}
        for (const column of columns) {
            candidate[column.key] = row[column.index]
        }

        const parsed = schema.safeParse(candidate)

        if (!parsed.success) {
            invalidRows.add(rowNumber)
            for (const issue of parsed.error.issues) {
                const key = String(issue.path[0])
                issues.push({
                    row: rowNumber,
                    column: headerByKey.get(key) ?? key,
                    message: issue.message
                })
            }
            continue
        }

        data.push(parsed.data)
    }

    // 4. A single bad row invalidates the whole file — nothing gets ingested
    if (issues.length > 0) {
        const count = invalidRows.size
        return {
            error: true,
            message: `${count} invalid ${count === 1 ? 'row' : 'rows'}`,
            issues
        }
    }

    return {
        error: false,
        message: `${data.length} rows parsed successfully`,
        data
    }
}

export default { parse }
