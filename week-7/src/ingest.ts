import Pipeline from './pipeline.ts'
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

const result = await Pipeline.run({
    csvPath,
    table,
    connectionString,
    schema: productSchema
})

if (result.error) {
    for (const issue of result.issues?.slice(0, MAX_REPORTED_ISSUES) ?? []) {
        console.error(`  row ${issue.row}, column "${issue.column}": ${issue.message}`)
    }

    const hidden = (result.issues?.length ?? 0) - MAX_REPORTED_ISSUES
    if (hidden > 0) {
        console.error(`  ... and ${hidden} more`)
    }

    fail('Pipeline', result.message)
}

console.log(`✓ Pipeline       ${result.message}`)
