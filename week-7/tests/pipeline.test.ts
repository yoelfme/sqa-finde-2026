import { describe, expect, test, vi, beforeEach } from 'vitest'
import Pipeline from '../src/pipeline'
import CsvReader from '../src/csv_reader'
import CsvParser from '../src/csv_parser'
import DatabaseIngestor from '../src/database_ingestor'
import { productSchema } from '../src/schemas/product'

vi.mock('../src/csv_reader', () => ({
    default: { read: vi.fn() }
}))

vi.mock('../src/csv_parser', () => ({
    default: { parse: vi.fn() }
}))

vi.mock('../src/database_ingestor', () => ({
    default: { ingest: vi.fn() }
}))

const options = {
    csvPath: 'data/single_valid.csv',
    table: 'products',
    connectionString: 'postgres://postgres:postgres@localhost:5432/inventory',
    schema: productSchema
}

describe('Pipeline.run', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    test('stops at the reader and never calls the parser or ingestor', async () => {
        // Given
        vi.mocked(CsvReader.read).mockReturnValue({
            error: true,
            message: 'File data/missing.csv not found'
        })

        // When
        const result = await Pipeline.run({
            ...options,
            csvPath: 'data/missing.csv'
        })

        // Then
        expect(result.error).toBe(true)
        expect(result.message).toBe('File data/missing.csv not found')
        expect(CsvParser.parse).not.toHaveBeenCalled()
        expect(DatabaseIngestor.ingest).not.toHaveBeenCalled()
    })

    test('stops at the parser and never calls the ingestor', async () => {
        // Given
        vi.mocked(CsvReader.read).mockReturnValue({
            error: false,
            message: 'File read successfully',
            data: { headers: ['Producto'], rows: [] }
        })
        vi.mocked(CsvParser.parse).mockReturnValue({
            error: true,
            message: '1 invalid row',
            issues: [{ row: 1, column: 'Stock', message: 'value is required' }]
        })

        // When
        const result = await Pipeline.run(options)

        // Then
        expect(result.error).toBe(true)
        expect(result.message).toBe('1 invalid row')
        expect(result.issues).toStrictEqual([
            { row: 1, column: 'Stock', message: 'value is required' }
        ])
        expect(DatabaseIngestor.ingest).not.toHaveBeenCalled()
    })

    test('forwards parsed rows to the ingestor on success', async () => {
        // Given
        const rows = [
            {
                product: 'Algodón 100g Mini',
                sku: 'ABR-00001',
                stock: 188,
                cost: 17.35,
                price: 26.76,
                unit: 'pieza' as const,
                expires_at: '2029-02-18'
            }
        ]
        vi.mocked(CsvReader.read).mockReturnValue({
            error: false,
            message: 'File read successfully',
            data: { headers: [], rows: [] }
        })
        vi.mocked(CsvParser.parse).mockReturnValue({
            error: false,
            message: '1 rows parsed successfully',
            data: rows
        })
        vi.mocked(DatabaseIngestor.ingest).mockResolvedValue({
            error: false,
            message: '1 rows inserted into products',
            data: { inserted: 1 }
        })

        // When
        const result = await Pipeline.run(options)

        // Then
        expect(result.error).toBe(false)
        expect(result.data?.inserted).toBe(1)
        expect(DatabaseIngestor.ingest).toHaveBeenCalledWith(rows, {
            connectionString: options.connectionString,
            table: options.table,
            schema: productSchema,
            batchSize: undefined
        })
    })
})
