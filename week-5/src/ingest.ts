import CsvReader from './csv_reader.ts'
import CsvParser from './csv_parser.ts'
import DatabaseIngestor from './database_ingestor.ts'
import { productSchema } from './schemas/product.ts'

const DEFAULT_CSV_PATH = 'data/products.csv'
const DEFAULT_TABLE = 'products'
const DEFAULT_CONNECTION_STRING = 'postgres://postgres:postgres@localhost:5432/inventory'
const MAX_REPORTED_ISSUES = 10

const [csvPath = DEFAULT_CSV_PATH, table = DEFAULT_TABLE] = process.argv.slice(2)
const connectionString = process.env.DATABASE_URL ?? DEFAULT_CONNECTION_STRING

// Never print the password that lives in the connection string
const describeTarget = (url: string) => {
    try {
        const parsed = new URL(url)
        return `${parsed.host}${parsed.pathname}`
    } catch {
        return '<invalid connection string>'
    }
}

const fail = (stage: string, message: string): never => {
    console.error(`✗ ${stage}: ${message}`)
    process.exit(1)
}

console.log(`CSV file        ${csvPath}`)
console.log(`Target          ${describeTarget(connectionString)} → ${table}`)
console.log('')

// 1. CSV Reader — file to headers + raw rows
const readerResult = CsvReader.read(csvPath)

if (readerResult.error) {
    fail('CSV Reader', readerResult.message)
}

console.log(`✓ CSV Reader     ${readerResult.data?.headers.length} headers, ${readerResult.data?.rows.length} raw rows`)

// 2. CSV Parser — raw rows to validated records shaped like the table
const parserResult = CsvParser.parse(readerResult, productSchema)

if (parserResult.error) {
    for (const issue of parserResult.issues?.slice(0, MAX_REPORTED_ISSUES) ?? []) {
        console.error(`  row ${issue.row}, column "${issue.column}": ${issue.message}`)
    }

    const hidden = (parserResult.issues?.length ?? 0) - MAX_REPORTED_ISSUES
    if (hidden > 0) {
        console.error(`  ... and ${hidden} more`)
    }

    fail('CSV Parser', parserResult.message)
}

console.log(`✓ CSV Parser     ${parserResult.message}`)

// 3. Database Ingestor — records into PostgreSQL, all or nothing
const ingestorResult = await DatabaseIngestor.ingest(parserResult.data ?? [], {
    connectionString,
    table,
    schema: productSchema
})

if (ingestorResult.error) {
    fail('Database Ingestor', ingestorResult.message)
}

console.log(`✓ Ingestor       ${ingestorResult.message}`)
