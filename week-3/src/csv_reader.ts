import fs from 'fs'

interface CsvReaderResult {
    error: boolean
    message: string
    data?: {
        headers: string[]
        rows: string[][]
    }
}

function read(path: string): CsvReaderResult {
    // 1. Validate the path
    if (!path ||!fs.existsSync(path)) {
        return {
            error: true,
            message: `File ${path} not found`
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
    const lines = fileContent.split('\n')
    const headers = lines[0].split(',')
    const rows = lines.slice(1).map(line => line.split(','))

    return {
        error: false,
        message: `File ${path} read successfully`,
        data: { headers, rows }
    }
}

export default { read }