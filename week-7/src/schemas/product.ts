import * as z from 'zod'

// z.coerce.number() turns '' into 0, so an empty cell would silently become a
// valid zero. Requiring content before coercing keeps that from happening.
const csvNumber = () => z.string().trim().min(1, 'value is required').pipe(z.coerce.number())

// Schema keys are the SQL column names, so no extra mapping is needed
// between the parser output and the database table.
export const productSchema = z.object({
    product: z.string().trim().min(1).meta({ csvHeader: 'Producto' }),
    sku: z.string().trim().min(1).meta({ csvHeader: 'SKU' }),
    stock: csvNumber().pipe(z.number().int()).meta({ csvHeader: 'Stock', sqlType: 'integer' }),
    cost: csvNumber().meta({ csvHeader: 'Costo', sqlType: 'numeric' }),
    price: csvNumber().meta({ csvHeader: 'Precio', sqlType: 'numeric' }),
    unit: z
        .enum(['pieza', 'paquete', 'kg', 'cajetilla', 'caja', 'manojo', 'bolsa'])
        .meta({ csvHeader: 'Unidad de Medida' }),
    expires_at: z.iso.date().meta({ csvHeader: 'Fecha de Caducidad', sqlType: 'date' })
})

export type Product = z.infer<typeof productSchema>
