function sum(a: number, b: number): number {
  return a + b;
}

function subtract(a: number, b: number): number {
  return a - b;
}

function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error('Division by zero is not allowed');
  }
  return a / b;
}

function multiply(a: number, b: number): number {
  if (isEven(a) || isEven(b)) {
    throw new Error('Multiply by even numbers is not allowed');
  }
  return a * b;
}

function isEven(a: number): boolean {
  return a % 2 === 0;
}

export { sum, subtract, divide, multiply };