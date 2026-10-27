import { MathCore } from '../src/engine/mathCore.ts';

const math = new MathCore({ angleUnit: 'degrees', precision: 10 });

function assertEqual(actual: number, expected: number, desc: string, tol = 1e-6) {
  if (Math.abs(actual - expected) > tol) {
    console.error(`FAIL: ${desc} => expected ${expected}, got ${actual}`);
    process.exit(1);
  } else {
    console.log(`PASS: ${desc} => ${actual}`);
  }
}

function assertThrows(fn: () => void, desc: string) {
  try {
    fn();
    console.error(`FAIL: Expected exception for ${desc}`);
    process.exit(1);
  } catch (err: any) {
    console.log(`PASS: ${desc} => caught: "${err.message}"`);
  }
}

console.log("=== Testing Degree Trigonometry ===");
assertEqual(math.evaluate('sin(0)'), 0, 'sin(0°)');
assertEqual(math.evaluate('sin(30)'), 0.5, 'sin(30°)');
assertEqual(math.evaluate('sin(90)'), 1, 'sin(90°)');
assertEqual(math.evaluate('sin(180)'), 0, 'sin(180°)');
assertEqual(math.evaluate('cos(0)'), 1, 'cos(0°)');
assertEqual(math.evaluate('cos(60)'), 0.5, 'cos(60°)');
assertEqual(math.evaluate('cos(90)'), 0, 'cos(90°)');
assertEqual(math.evaluate('cos(180)'), -1, 'cos(180°)');
assertEqual(math.evaluate('tan(45)'), 1, 'tan(45°)');
assertEqual(math.evaluate('asin(0.5)'), 30, 'asin(0.5) in deg');
assertEqual(math.evaluate('acos(0.5)'), 60, 'acos(0.5) in deg');
assertEqual(math.evaluate('atan(1)'), 45, 'atan(1) in deg');
assertEqual(math.evaluate('atan2(1, 1)'), 45, 'atan2(1, 1) in deg');

console.log("\n=== Testing Radians Trigonometry ===");
math.setContext({ angleUnit: 'radians' });
assertEqual(math.evaluate('sin(pi / 6)'), 0.5, 'sin(π/6)');
assertEqual(math.evaluate('cos(pi / 3)'), 0.5, 'cos(π/3)');
assertEqual(math.evaluate('tan(pi / 4)'), 1, 'tan(π/4)');

console.log("\n=== Testing Constants & Special Symbols ===");
assertEqual(math.evaluate('pi'), Math.PI, 'pi');
assertEqual(math.evaluate('e'), Math.E, 'e');
assertEqual(math.evaluate('tau'), Math.PI * 2, 'tau');
assertEqual(math.evaluate('phi'), 1.618033988749895, 'phi');
assertEqual(math.evaluate('2pi'), Math.PI * 2, 'implicit 2pi');
assertEqual(math.evaluate('2(3 + 4)'), 14, 'implicit 2(3+4)');
assertEqual(math.evaluate('(2+3)(4+5)'), 45, 'implicit (2+3)(4+5)');

console.log("\n=== Testing Logarithms & Exponentials ===");
assertEqual(math.evaluate('ln(e)'), 1, 'ln(e)');
assertEqual(math.evaluate('log(e)'), 1, 'log(e)');
assertEqual(math.evaluate('log(100, 10)'), 2, 'log(100, 10)');
assertEqual(math.evaluate('log(8, 2)'), 3, 'log(8, 2)');
assertEqual(math.evaluate('log10(100)'), 2, 'log10(100)');
assertEqual(math.evaluate('log2(8)'), 3, 'log2(8)');
assertEqual(math.evaluate('exp(1)'), Math.E, 'exp(1)');
assertEqual(math.evaluate('10^(3)'), 1000, '10^3');
assertEqual(math.evaluate('2^8'), 256, '2^8');

console.log("\n=== Testing Powers, Roots & Combinatorics ===");
assertEqual(math.evaluate('sqrt(25)'), 5, 'sqrt(25)');
assertEqual(math.evaluate('cbrt(27)'), 3, 'cbrt(27)');
assertEqual(math.evaluate('cbrt(-8)'), -2, 'cbrt(-8)');
assertEqual(math.evaluate('root(16, 4)'), 2, 'root(16, 4)');
assertEqual(math.evaluate('root(-8, 3)'), -2, 'root(-8, 3)');
assertEqual(math.evaluate('5!'), 120, 'postfix 5!');
assertEqual(math.evaluate('fact(5)'), 120, 'fact(5)');
assertEqual(math.evaluate('0!'), 1, '0!');
assertEqual(math.evaluate('nPr(5, 2)'), 20, 'nPr(5, 2)');
assertEqual(math.evaluate('perm(5, 2)'), 20, 'perm(5, 2)');
assertEqual(math.evaluate('nCr(5, 2)'), 10, 'nCr(5, 2)');
assertEqual(math.evaluate('comb(5, 2)'), 10, 'comb(5, 2)');

console.log("\n=== Testing Hyperbolic & Inverse Hyperbolic ===");
assertEqual(math.evaluate('sinh(0)'), 0, 'sinh(0)');
assertEqual(math.evaluate('cosh(0)'), 1, 'cosh(0)');
assertEqual(math.evaluate('tanh(0)'), 0, 'tanh(0)');
assertEqual(math.evaluate('asinh(0)'), 0, 'asinh(0)');
assertEqual(math.evaluate('acosh(1)'), 0, 'acosh(1)');
assertEqual(math.evaluate('atanh(0)'), 0, 'atanh(0)');

console.log("\n=== Testing Utility Functions ===");
assertEqual(math.evaluate('abs(-42)'), 42, 'abs(-42)');
assertEqual(math.evaluate('floor(3.7)'), 3, 'floor(3.7)');
assertEqual(math.evaluate('ceil(3.2)'), 4, 'ceil(3.2)');
assertEqual(math.evaluate('round(3.5)'), 4, 'round(3.5)');
assertEqual(math.evaluate('deg(pi)'), 180, 'deg(pi)');
assertEqual(math.evaluate('rad(180)'), Math.PI, 'rad(180)');

console.log("\n=== Testing Error Handling & Domain Checks ===");
assertThrows(() => math.evaluate('10 / 0'), 'Division by zero');
assertThrows(() => math.evaluate('sqrt(-4)'), 'Square root of negative');
assertThrows(() => math.evaluate('asin(2)'), 'asin out of domain');
assertThrows(() => math.evaluate('acos(-2)'), 'acos out of domain');
assertThrows(() => math.evaluate('ln(0)'), 'ln of zero');
assertThrows(() => math.evaluate('log10(-5)'), 'log10 of negative');
math.setContext({ angleUnit: 'degrees' });
assertThrows(() => math.evaluate('tan(90)'), 'tan(90°) asymptote');

console.log("\nALL TESTS PASSED WITH 100% SUCCESS!");
