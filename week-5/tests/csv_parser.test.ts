import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import CsvReader from '../src/csv_reader'
import CsvParser from '../src/csv_parser'
import { productSchema } from '../src/schemas/product'

const VALID_PATH = 'data/products.csv'
const ONLY_HEADER_PATH = 'data/only_header.csv'
const INVALID_ROWS_PATH = 'data/invalid_products.csv'
const EXPECTED_ROW_COUNT = 520

const PRODUCT_HEADERS = [
    'Producto',
    'SKU',
    'Stock',
    'Costo',
    'Precio',
    'Unidad de Medida',
    'Fecha de Caducidad'
]

const A_VALID_ROW = ['Algodón 100g Mini', 'ABR-00001', '188', '17.35', '26.76', 'pieza', '2029-02-18']

// The parser consumes the reader's output, so a hand-built result is the
// natural unit-test input for structural cases that no fixture file covers.
const readerResult = (headers: string[], rows: string[][]) => ({
    error: false,
    message: 'File read successfully',
    data: { headers, rows }
})

describe('CsvParser.parse', () => {
    describe('reader errors', () => {
        test('propagates the reader error message when the reader failed', () => {
            // Given
            const failedRead = CsvReader.read('/non/existent/file.csv')

            // When
            const result = CsvParser.parse(failedRead, productSchema)

            // Then
            expect(result.error).toBe(true)
            expect(result.message).toBe('File /non/existent/file.csv not found')
        })

        test('does not include data when the reader failed', () => {
            // Given
            const failedRead = CsvReader.read('/non/existent/file.csv')

            // When
            const result = CsvParser.parse(failedRead, productSchema)

            // Then
            expect(result.data).toBeUndefined()
        })
    })

    describe('header mapping', () => {
        test('maps CSV headers to schema keys', () => {
            // Given
            const input = readerResult(PRODUCT_HEADERS, [A_VALID_ROW])

            // When
            const result = CsvParser.parse(input, productSchema)

            // Then
            expect(result.error).toBe(false)
            expect(result.data?.[0]).toStrictEqual({
                product: 'Algodón 100g Mini',
                sku: 'ABR-00001',
                stock: 188,
                cost: 17.35,
                price: 26.76,
                unit: 'pieza',
                expires_at: '2029-02-18'
            })
        })

        test('returns error when a mapped header is missing from the CSV', () => {
            // Given
            const headers = PRODUCT_HEADERS.filter(header => header !== 'Stock')
            const input = readerResult(headers, [])

            // When
            const result = CsvParser.parse(input, productSchema)

            // Then
            expect(result.error).toBe(true)
            expect(result.message).toBe('Headers not found in CSV: Stock')
        })

        test('reports every missing header, not just the first', () => {
            // Given
            const input = readerResult(['SKU', 'Costo'], [])

            // When
            const result = CsvParser.parse(input, productSchema)

            // Then
            expect(result.error).toBe(true)
            expect(result.message).toBe(
                'Headers not found in CSV: Producto, Stock, Precio, Unidad de Medida, Fecha de Caducidad'
            )
        })

        test('ignores CSV columns that no schema field maps to', () => {
            // Given
            const headers = [...PRODUCT_HEADERS, 'Proveedor']
            const input = readerResult(headers, [[...A_VALID_ROW, 'Abarrotes SA']])

            // When
            const result = CsvParser.parse(input, productSchema)

            // Then
            expect(result.error).toBe(false)
            expect(result.data?.[0]).not.toHaveProperty('Proveedor')
            expect(Object.keys(result.data?.[0] ?? {})).toStrictEqual([
                'product',
                'sku',
                'stock',
                'cost',
                'price',
                'unit',
                'expires_at'
            ])
        })

        test('returns error when a schema field has no csvHeader metadata', () => {
            // Given
            const schemaWithoutMeta = z.object({
                product: z.string().meta({ csvHeader: 'Producto' }),
                sku: z.string()
            })
            const input = readerResult(PRODUCT_HEADERS, [A_VALID_ROW])

            // When
            const result = CsvParser.parse(input, schemaWithoutMeta)

            // Then
            expect(result.error).toBe(true)
            expect(result.message).toBe('Schema field "sku" is missing csvHeader metadata')
        })
    })

    describe('type coercion', () => {
        test('coerces numeric columns to numbers', () => {
            // Given
            const input = readerResult(PRODUCT_HEADERS, [A_VALID_ROW])

            // When
            const result = CsvParser.parse(input, productSchema)

            // Then
            expect(result.data?.[0].stock).toBe(188)
            expect(result.data?.[0].cost).toBe(17.35)
            expect(result.data?.[0].price).toBe(26.76)
        })

        test('keeps date columns as ISO strings', () => {
            // Given
            const input = readerResult(PRODUCT_HEADERS, [A_VALID_ROW])

            // When
            const result = CsvParser.parse(input, productSchema)

            // Then
            expect(result.data?.[0].expires_at).toBe('2029-02-18')
        })

        test('preserves UTF-8 accents in product names', () => {
            // Given
            const input = readerResult(PRODUCT_HEADERS, [A_VALID_ROW])

            // When
            const result = CsvParser.parse(input, productSchema)

            // Then
            expect(result.data?.[0].product).toBe('Algodón 100g Mini')
        })
    })

    describe('row filtering', () => {
        test('skips the trailing blank row produced by the reader', () => {
            // Given
            const input = readerResult(PRODUCT_HEADERS, [A_VALID_ROW, ['']])

            // When
            const result = CsvParser.parse(input, productSchema)

            // Then
            expect(result.error).toBe(false)
            expect(result.data?.length).toBe(1)
        })

        test('returns empty data when the CSV has only headers', () => {
            // Given
            const onlyHeaderRead = CsvReader.read(ONLY_HEADER_PATH)

            // When
            const result = CsvParser.parse(onlyHeaderRead, productSchema)

            // Then
            expect(result.error).toBe(false)
            expect(result.data).toStrictEqual([])
        })
    })

    describe('validation failures', () => {
        test('returns error when a numeric column holds a non-numeric value', () => {
            // Given
            const row = [...A_VALID_ROW]
            row[2] = 'ocho'
            const input = readerResult(PRODUCT_HEADERS, [row])

            // When
            const result = CsvParser.parse(input, productSchema)

            // Then
            expect(result.error).toBe(true)
            expect(result.issues?.length).toBe(1)
            expect(result.issues?.[0].column).toBe('Stock')
        })

        test('returns error when a numeric column is empty', () => {
            // Given
            const row = [...A_VALID_ROW]
            row[2] = ''
            const input = readerResult(PRODUCT_HEADERS, [row])

            // When
            const result = CsvParser.parse(input, productSchema)

            // Then
            expect(result.error).toBe(true)
            expect(result.issues?.[0].column).toBe('Stock')
            expect(result.issues?.[0].message).toBe('value is required')
        })

        test('reports the CSV header name, not the schema key, in the issue', () => {
            // Given
            const row = [...A_VALID_ROW]
            row[6] = '18-02-2029'
            const input = readerResult(PRODUCT_HEADERS, [row])

            // When
            const result = CsvParser.parse(input, productSchema)

            // Then
            expect(result.issues?.[0].column).toBe('Fecha de Caducidad')
        })

        test('reports the 1-based data row number', () => {
            // Given
            const badRow = [...A_VALID_ROW]
            badRow[2] = 'ocho'
            const input = readerResult(PRODUCT_HEADERS, [A_VALID_ROW, A_VALID_ROW, badRow])

            // When
            const result = CsvParser.parse(input, productSchema)

            // Then
            expect(result.issues?.[0].row).toBe(3)
        })

        test('aggregates issues from every invalid row', () => {
            // Given
            const invalidRead = CsvReader.read(INVALID_ROWS_PATH)

            // When
            const result = CsvParser.parse(invalidRead, productSchema)

            // Then
            expect(result.error).toBe(true)
            expect(result.issues?.map(issue => issue.row)).toStrictEqual([2, 3, 3])
            expect(result.message).toBe('2 invalid rows')
        })

        test('reports every issue within a single row', () => {
            // Given
            const invalidRead = CsvReader.read(INVALID_ROWS_PATH)

            // When
            const result = CsvParser.parse(invalidRead, productSchema)

            // Then
            const rowThreeColumns = result.issues
                ?.filter(issue => issue.row === 3)
                .map(issue => issue.column)
            expect(rowThreeColumns).toStrictEqual(['Producto', 'Unidad de Medida'])
        })

        test('does not include data when any row is invalid', () => {
            // Given
            const invalidRead = CsvReader.read(INVALID_ROWS_PATH)

            // When
            const result = CsvParser.parse(invalidRead, productSchema)

            // Then
            expect(result.data).toBeUndefined()
        })

        test('returns error when a row has fewer cells than headers', () => {
            // Given
            const input = readerResult(PRODUCT_HEADERS, [['Algodón 100g Mini', 'ABR-00001']])

            // When
            const result = CsvParser.parse(input, productSchema)

            // Then
            expect(result.error).toBe(true)
            expect(result.issues?.map(issue => issue.column)).toStrictEqual([
                'Stock',
                'Costo',
                'Precio',
                'Unidad de Medida',
                'Fecha de Caducidad'
            ])
        })

        test('returns error for a value outside the allowed enum', () => {
            // Given
            const row = [...A_VALID_ROW]
            row[5] = 'litro'
            const input = readerResult(PRODUCT_HEADERS, [row])

            // When
            const result = CsvParser.parse(input, productSchema)

            // Then
            expect(result.error).toBe(true)
            expect(result.issues?.[0].column).toBe('Unidad de Medida')
        })

        test('uses the singular form when exactly one row is invalid', () => {
            // Given
            const badRow = [...A_VALID_ROW]
            badRow[2] = 'ocho'
            const input = readerResult(PRODUCT_HEADERS, [badRow])

            // When
            const result = CsvParser.parse(input, productSchema)

            // Then
            expect(result.message).toBe('1 invalid row')
        })
    })

    describe('full file', () => {
        test('parses every data row of products.csv', () => {
            // Given
            const validRead = CsvReader.read(VALID_PATH)

            // When
            const result = CsvParser.parse(validRead, productSchema)

            // Then
            expect(result.error).toBe(false)
            expect(result.data?.length).toBe(EXPECTED_ROW_COUNT)
            expect(result.message).toBe(`${EXPECTED_ROW_COUNT} rows parsed successfully`)
        })
    })
})
