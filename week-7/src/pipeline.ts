import * as z from 'zod'
import CsvReader from './csv_reader.ts'
import CsvParser from './csv_parser.ts'
import DatabaseIngestor from './database_ingestor.ts'
import type { ParseIssue, Result } from './types.ts'

export interface PipelineOptions {
    csvPath: string
    table: string
    connectionString: string
    schema: z.ZodObject
    batchSize?: number
}

export type PipelineResult = Result<{ inserted: number }>

async function run(options: PipelineOptions): Promise<PipelineResult> {
    const { csvPath, table, connectionString, schema, batchSize } = options

    // 1. CSV Reader — file to headers + raw rows
    const readerResult = CsvReader.read(csvPath)

    if (readerResult.error) {
        return {
            error: true,
            message: readerResult.message
        }
    }

    // 2. CSV Parser — raw rows to validated records shaped like the table
    const parserResult = CsvParser.parse(readerResult, schema)

    if (parserResult.error) {
        return {
            error: true,
            message: parserResult.message,
            issues: parserResult.issues as ParseIssue[] | undefined
        }
    }

    // 3. Database Ingestor — records into PostgreSQL, all or nothing
    return DatabaseIngestor.ingest(parserResult.data ?? [], {
        connectionString,
        table,
        schema,
        batchSize
    })
}

export default { run }
