import { describe, expect, test } from 'vitest'
import CsvReader from '../src/csv_reader'

const INVALID_PATH = '/non/existent/file.csv'
const VALID_PATH = 'data/products.csv'

describe('CsvReader.read', () => {
    describe('path validation', () => {
        test('returns error when file does not exist', () => {
            // Given
            const path = INVALID_PATH

            // When
            const result = CsvReader.read(path)

            // Then
            expect(result.error).toBe(true)
            expect(result.message).toBe(`File ${path} not found`)
        })

        test('returns error when path is empty', () => {
            // Given
            const path = ''

            // When
            const result = CsvReader.read(path)

            // Then
            expect(result.error).toBe(true)
            expect(result.message).toBe(`File ${path} not found`)
        })
    })

    describe('file type validation', () => {
        test('returns error when file extension is not .csv', () => {
            // Given
            const path = 'package.json'

            // When
            const result = CsvReader.read(path)

            // Then
            expect(result.error).toBe(true)
            expect(result.message).toBe(`File ${path} is not a CSV file`)
        })
    })

    describe('parsing', () => {
        test('returns success with data for a valid CSV', () => {
            // Given
            const path = VALID_PATH

            // When
            const result = CsvReader.read(path)

            // Then
            expect(result.error).toBe(false)
            expect(result.message).toBe(`File ${path} read successfully`)
            expect(result.data).toBeDefined()
        })

        test('parses headers correctly from a valid CSV', () => {
            // Given
            const path = VALID_PATH

            // When
            const result = CsvReader.read(path)

            // Then
            expect(result.data?.headers).toStrictEqual([
                'Producto',
                'SKU',
                'Stock',
                'Costo',
                'Precio',
                'Unidad de Medida',
                'Fecha de Caducidad'
            ])
        })

        test('parses the expected number of data rows', () => {
            // Given
            const path = VALID_PATH

            // When
            const result = CsvReader.read(path)

            // Then
            expect(result.data?.rows.length).toBeGreaterThan(0)
        })

        test('returns empty headers and rows for an empty file', () => {
            // Given
            const path = 'data/empty.csv'

            // When
            const result = CsvReader.read(path)

            // Then
            expect(result.error).toBe(false)
            expect(result.data?.headers).toStrictEqual([])
            expect(result.data?.rows).toStrictEqual([])
        })

        test('returns empty rows when file has only headers', () => {
            // Given
            const path = 'data/only_header.csv'

            // When
            const result = CsvReader.read(path)

            // Then
            expect(result.error).toBe(false)
            expect(result.data?.headers).toStrictEqual([
                'Producto',
                'SKU',
                'Stock',
                'Costo',
                'Precio',
                'Unidad de Medida',
                'Fecha de Caducidad'
            ])
            expect(result.data?.rows).toStrictEqual([])
        })

        test.todo('handles commas inside quoted values')
    })

    describe('error response shape', () => {
        test('does not include data property on error', () => {
            // Given
            const path = INVALID_PATH

            // When
            const result = CsvReader.read(path)

            // Then
            expect(result.data).toBeUndefined()
        })
    })
})
