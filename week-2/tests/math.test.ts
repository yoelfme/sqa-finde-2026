import { expect, test, describe } from 'vitest' // libreria de pruebas
import { sum, subtract, divide, multiply } from '../src/math.ts' // metodo a validar

describe('Sum', () => {
    test('1 + 2 to equal 3', () => {
        // Given (preparar datos de prueba)
        const number1 = 1;
        const number2 = 2;
        const expectedResult = 3
    
        // When (llamar a la funcion)
        // const result = sum(number1, number2);
    
        // Then (evaluar el resultado)
        // expect(result).toBe(expectedResult)
        expect(sum(number1, number2)).toBe(expectedResult)
    })
})

describe('Subtract', () => {
    test('1 - 2 to equal -1', () => {
        // Given (preparar datos de prueba)
        const number1 = 1;
        const number2 = 2;
        const expectedResult = -1;
    
        // When (llamar a la funcion)
        const result = subtract(number1, number2);
    
        // Then (evaluar el resultado)
        expect(result).toBe(expectedResult)
    })    
})

describe('Divide', () => {
    test('1 / 2 to equal 0.5', () => {
        // Given (preparar datos de prueba)
        const number1 = 1;
        const number2 = 2;
        const expectedResult = 0.5;

        // When (llamar a la funcion)
        const result = divide(number1, number2);
    
        // Then (evaluar el resultado)
        expect(result).toBe(expectedResult)
    })

    test('1 / 0 should thrown an exception', () => {
        // Given (preparar datos de prueba)
        const number1 = 10;
        const number2 = 0; // divisor
    
        // Then (evaluar el resultado)
        expect(() => {
            divide(number1, number2)
        }).toThrow('Division by zero is not allowed')
    })
})

describe('Multiply', () => {
    test('1 * 3 to equal 3', () => {
        // Given (preparar datos de prueba)
        const number1 = 1;
        const number2 = 3;
        const expectedResult = 3;
        
        // When (llamar a la funcion)
        const result = multiply(number1, number2);
    
        // Then (evaluar el resultado)
        expect(result).toBe(expectedResult)
    })

    test('1 * 2 should thrown an exception', () => {
        // Given (preparar datos de prueba)
        const number1 = 1;
        const number2 = 2;

        // Then (evaluar el resultado)
        expect(() => {
            multiply(number1, number2)
        }).toThrow('Multiply by even numbers is not allowed')
    })

    test('2 * 4 should thrown an exception', () => {
        // Given (preparar datos de prueba)
        const number1 = 2;
        const number2 = 4;

        // Then (evaluar el resultado)
        expect(() => {
            multiply(number1, number2)
        }).toThrow('Multiply by even numbers is not allowed')
    })
})
