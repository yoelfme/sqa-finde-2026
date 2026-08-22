import { describe, expect, test } from 'vitest'
import * as z from 'zod'
import { getTableConfig } from 'drizzle-orm/pg-core'
import { buildTable } from '../src/zod_to_drizzle'
import { productSchema } from '../src/schemas/product'

const columnsOf = (table: ReturnType<typeof buildTable>) =>
    getTableConfig(table).columns.map(column => ({
        name: column.name,
        type: column.getSQLType()
    }))

describe('buildTable', () => {
    test('uses the provided table name', () => {
        // Given
        const tableName = 'inventory_products'

        // When
        const table = buildTable(tableName, productSchema)

        // Then
        expect(getTableConfig(table).name).toBe(tableName)
    })

    test('uses the schema key as the column name', () => {
        // Given
        const schema = productSchema

        // When
        const table = buildTable('products', schema)

        // Then
        expect(columnsOf(table).map(column => column.name)).toStrictEqual([
            'product',
            'sku',
            'stock',
            'cost',
            'price',
            'unit',
            'expires_at'
        ])
    })

    test('infers a text column for string fields', () => {
        // Given
        const schema = z.object({ product: z.string().meta({ csvHeader: 'Producto' }) })

        // When
        const table = buildTable('products', schema)

        // Then
        expect(columnsOf(table)).toStrictEqual([{ name: 'product', type: 'text' }])
    })

    test('infers a text column for enum fields', () => {
        // Given
        const schema = z.object({ unit: z.enum(['pieza', 'kg']).meta({ csvHeader: 'Unidad' }) })

        // When
        const table = buildTable('products', schema)

        // Then
        expect(columnsOf(table)).toStrictEqual([{ name: 'unit', type: 'text' }])
    })

    test('infers a numeric column for number fields', () => {
        // Given
        const schema = z.object({ cost: z.number().meta({ csvHeader: 'Costo' }) })

        // When
        const table = buildTable('products', schema)

        // Then
        expect(columnsOf(table)).toStrictEqual([{ name: 'cost', type: 'numeric' }])
    })

    test('honors the sqlType override for integer columns', () => {
        // Given
        const schema = productSchema

        // When
        const table = buildTable('products', schema)

        // Then
        const stock = columnsOf(table).find(column => column.name === 'stock')
        expect(stock?.type).toBe('integer')
    })

    test('honors the sqlType override for numeric columns', () => {
        // Given
        const schema = productSchema

        // When
        const table = buildTable('products', schema)

        // Then
        const cost = columnsOf(table).find(column => column.name === 'cost')
        expect(cost?.type).toBe('numeric')
    })

    test('honors the sqlType override for date columns', () => {
        // Given
        const schema = productSchema

        // When
        const table = buildTable('products', schema)

        // Then
        const expiresAt = columnsOf(table).find(column => column.name === 'expires_at')
        expect(expiresAt?.type).toBe('date')
    })

    test('falls back to text when the field type cannot be inferred', () => {
        // Given
        const schema = z.object({
            notes: z.string().optional().meta({ csvHeader: 'Notas' })
        })

        // When
        const table = buildTable('products', schema)

        // Then
        expect(columnsOf(table)).toStrictEqual([{ name: 'notes', type: 'text' }])
    })
})
