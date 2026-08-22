export interface ParseIssue {
    row: number
    column: string
    message: string
}

export interface Result<T = unknown> {
    error: boolean
    message: string
    data?: T
    issues?: ParseIssue[]
}

export interface CsvRawData {
    headers: string[]
    rows: string[][]
}
