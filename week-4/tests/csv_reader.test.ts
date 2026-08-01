import { describe, expect, test } from 'vitest'
import CsvReader from '../src/csv_reader'

const INVALID_PATH = '/non/existent/file.csv'
const VALID_PATH = 'data/products.csv'

test('not existent file', () => {
    // Given (dado)
    const invalidPath = INVALID_PATH
    const expectedResult = {
        error: true,
        message: `File ${invalidPath} not found`
    }

    // When (cuando)
    const result = CsvReader.read(invalidPath)

    // Then (entonces)
    expect(result).toStrictEqual(expectedResult)
})

test('empty path', () => {
    // Given (dado)
    const emptyPath = ''
    const expectedResult = {
        error: true,
        message: `File ${emptyPath} not found`
    }

    // When (cuando)
    const result = CsvReader.read(emptyPath)

    // Then (entonces)
    expect(result).toStrictEqual(expectedResult)
})

test('invalid file type', () => {
    // Given
    const invalidFileTypePath = 'data/guia.pdf'
    const expectedResult = {
        error: true, 
        message: `File ${invalidFileTypePath} is not a CSV file`
    }

    // When
    const result = CsvReader.read(invalidFileTypePath)

    // Then
    expect(result).toStrictEqual(expectedResult)
})

describe('valid file', () => {
    test('and valid content', () => {
        // Given
        const validFilePath = VALID_PATH
        const expectedResult = expect.objectContaining({
            error: false,
            message: `File ${validFilePath} read successfully`,
            data: expect.objectContaining({
                headers: expect.any(Array),
                rows: expect.any(Array)
            })
        })  

        // When
        const result = CsvReader.read(validFilePath)

        // Then
        expect(result).toMatchObject(expectedResult)
    })
})