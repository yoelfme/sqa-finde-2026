import fs from 'fs'
import type { CsvRawData, Result } from './types.ts'

export type CsvReaderResult = Result<CsvRawData>

function read(path: string): CsvReaderResult {
    // 1. Validate the path
    if (!path || !fs.existsSync(path)) {
        return {
            error: true,
            message: `File not found: ${path}`
        }
    }

    // 2. Validate the file type
    if (path.split('.').pop() !== 'csv') {
        return {
            error: true,
            message: `File ${path} is not a CSV file`
        }
    }

    // 3. Read the file
    const fileContent = fs.readFileSync(path, 'utf8')
    const lines = fileContent.split(/\r?\n/)

    const headers = lines[0].split(',').filter(header => header.trim() !== '')
    const rows = lines.slice(1).map(line => line.split(','))

    return {
        error: false,
        message: `File ${path} read successfully`,
        data: { headers, rows }
    }
}

export default { read }
