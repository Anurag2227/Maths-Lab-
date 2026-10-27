/**
 * MATHS LAB - Advanced Mathematical Computation Core
 * Implements robust, error-free expression evaluation, full scientific functions,
 * exact degree trigonometry, multi-parameter combinatorics, and numerical calculus.
 */

export interface MathContext {
  angleUnit: 'radians' | 'degrees';
  precision: number;
}

export class MathCore {
  public angleUnit: 'radians' | 'degrees';
  public precision: number;
  private lastAns: number = 0;

  constructor(context: MathContext = { angleUnit: 'radians', precision: 12 }) {
    this.angleUnit = context.angleUnit;
    this.precision = context.precision;
  }

  setContext(context: Partial<MathContext>) {
    if (context.angleUnit) this.angleUnit = context.angleUnit;
    if (context.precision) this.precision = context.precision;
  }

  setAns(val: number) {
    if (!isNaN(val) && isFinite(val)) {
      this.lastAns = val;
    }
  }

  getAns(): number {
    return this.lastAns;
  }

  // --- Clean Trigonometry with Exact Degree Values ---

  private degToRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  private radToDeg(rad: number): number {
    return (rad * 180) / Math.PI;
  }

  private sin(x: number): number {
    if (this.angleUnit === 'degrees') {
      const normalized = ((x % 360) + 360) % 360;
      if (normalized === 0 || normalized === 180) return 0;
      if (normalized === 90) return 1;
      if (normalized === 270) return -1;
      if (normalized === 30 || normalized === 150) return 0.5;
      if (normalized === 210 || normalized === 330) return -0.5;
      return Math.sin(this.degToRad(x));
    }
    return Math.sin(x);
  }

  private cos(x: number): number {
    if (this.angleUnit === 'degrees') {
      const normalized = ((x % 360) + 360) % 360;
      if (normalized === 90 || normalized === 270) return 0;
      if (normalized === 0) return 1;
      if (normalized === 180) return -1;
      if (normalized === 60 || normalized === 300) return 0.5;
      if (normalized === 120 || normalized === 240) return -0.5;
      return Math.cos(this.degToRad(x));
    }
    return Math.cos(x);
  }

  private tan(x: number): number {
    if (this.angleUnit === 'degrees') {
      const normalized = ((x % 360) + 360) % 360;
      if (normalized === 90 || normalized === 270) {
        throw new Error(`Mathematical Error: tan(${x}°) is undefined (asymptote)`);
      }
      if (normalized === 0 || normalized === 180) return 0;
      if (normalized === 45 || normalized === 225) return 1;
      if (normalized === 135 || normalized === 315) return -1;
      return Math.tan(this.degToRad(x));
    }
    const cosVal = Math.cos(x);
    if (Math.abs(cosVal) < 1e-15) {
      throw new Error(`Mathematical Error: tan(${x}) is undefined (asymptote)`);
    }
    return Math.tan(x);
  }

  private asin(x: number): number {
    if (x < -1 || x > 1) {
      throw new Error(`Mathematical Error: asin(${x}) is undefined: domain is [-1, 1]`);
    }
    const val = Math.asin(x);
    return this.angleUnit === 'degrees' ? this.radToDeg(val) : val;
  }

  private acos(x: number): number {
    if (x < -1 || x > 1) {
      throw new Error(`Mathematical Error: acos(${x}) is undefined: domain is [-1, 1]`);
    }
    const val = Math.acos(x);
    return this.angleUnit === 'degrees' ? this.radToDeg(val) : val;
  }

  private atan(x: number): number {
    const val = Math.atan(x);
    return this.angleUnit === 'degrees' ? this.radToDeg(val) : val;
  }

  private atan2(y: number, x: number): number {
    const val = Math.atan2(y, x);
    return this.angleUnit === 'degrees' ? this.radToDeg(val) : val;
  }

  // --- Combinatorics ---

  factorial(n: number): number {
    if (n < 0 || Math.floor(n) !== n) {
      throw new Error('Mathematical Error: Factorial requires a non-negative integer');
    }
    if (n > 170) {
      throw new Error('Mathematical Error: Factorial overflow (> 170!)');
    }
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  permutation(n: number, r: number): number {
    if (n < 0 || r < 0 || r > n || Math.floor(n) !== n || Math.floor(r) !== r) {
      throw new Error('Mathematical Error: nPr requires non-negative integers with n >= r >= 0');
    }
    let res = 1;
    for (let i = 0; i < r; i++) res *= (n - i);
    return res;
  }

  combination(n: number, r: number): number {
    if (n < 0 || r < 0 || r > n || Math.floor(n) !== n || Math.floor(r) !== r) {
      throw new Error('Mathematical Error: nCr requires non-negative integers with n >= r >= 0');
    }
    if (r === 0 || r === n) return 1;
    if (r > n - r) r = n - r;
    let res = 1;
    for (let i = 1; i <= r; i++) {
      res = (res * (n - i + 1)) / i;
    }
    return res;
  }

  formatErrorMessage(err: unknown): string {
    const raw = err instanceof Error ? err.message : String(err);
    if (/^mathematical error/i.test(raw)) {
      return raw;
    }
    return `Mathematical Error: ${raw}`;
  }

  // --- Preprocessor & Tokenizer ---

  autoCloseBrackets(expr: string): string {
    if (!expr) return '';
    let s = expr.trim();
    // Normalize square and curly brackets to standard parentheses
    s = s.replace(/\[/g, '(').replace(/\]/g, ')').replace(/\{/g, '(').replace(/\}/g, ')');

    let openCount = 0;
    for (const ch of s) {
      if (ch === '(') openCount++;
      else if (ch === ')') {
        if (openCount > 0) openCount--;
      }
    }
    while (openCount > 0) {
      s += ')';
      openCount--;
    }
    return s;
  }

  private preprocess(expr: string): string {
    let s = expr.trim();
    // Strip leading function definitions e.g. "y = ", "y=", "f(x) = ", "g(x) = "
    s = s.replace(/^[a-zA-Z](?:\([a-zA-Z]\))?\s*=\s*/, '');
    // Normalize bracket styles: [] and {} -> ()
    s = s.replace(/\[/g, '(').replace(/\]/g, ')').replace(/\{/g, '(').replace(/\}/g, ')');
    // Normalize mathematical symbols
    s = s.replace(/×/g, '*');
    s = s.replace(/÷/g, '/');
    s = s.replace(/−/g, '-');
    s = s.replace(/²/g, '^2');
    s = s.replace(/³/g, '^3');
    s = s.replace(/π/g, 'pi');
    s = s.replace(/τ/g, 'tau');
    s = s.replace(/φ/g, 'phi');
    s = s.replace(/√/g, 'sqrt');
    s = s.replace(/\bmod\b/gi, '%');
    // Auto-wrap bare functions: e.g. "sin x" -> "sin(x)", "sqrt x" -> "sqrt(x)"
    s = s.replace(
      /\b(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|asinh|acosh|atanh|ln|log10|log2|sqrt|cbrt)\s+([a-zA-Z0-9_.]+|\([^\)]+\))/gi,
      '$1($2)'
    );
    return s;
  }

  private tokenize(raw: string): string[] {
    const s = this.preprocess(raw);
    const regex = /\s*(=>|<=|>=|==|!=|\*\*|[+\-*/^%(),!]|[a-zA-Z_][a-zA-Z0-9_]*|[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?)\s*/g;
    const tokens: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(s)) !== null) {
      if (match[1]) tokens.push(match[1]);
    }

    // Auto-insert implicit multiplication where mathematically implied:
    const enhanced: string[] = [];
    for (let i = 0; i < tokens.length; i++) {
      const cur = tokens[i];
      enhanced.push(cur);

      if (i < tokens.length - 1) {
        const next = tokens[i + 1];
        const isCurValue =
          /^[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/.test(cur) ||
          cur === ')' ||
          cur === '!' ||
          ['pi', 'e', 'tau', 'phi', 'ans', 'x'].includes(cur.toLowerCase());

        const isNextCallableOrVar =
          next === '(' ||
          ['pi', 'e', 'tau', 'phi', 'ans', 'x'].includes(next.toLowerCase()) ||
          /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(next) ||
          /^[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/.test(next);

        // Don't insert * if next is operator, comma, or closing paren
        const isNextOp = ['+', '-', '*', '/', '^', '**', '%', '!', ',', ')'].includes(next);

        if (isCurValue && isNextCallableOrVar && !isNextOp) {
          // If next is a number after a closing paren or constant: e.g. (2)3 or pi 2
          enhanced.push('*');
        }
      }
    }

    // Auto-close missing parentheses
    let openCount = 0;
    for (const tok of enhanced) {
      if (tok === '(') openCount++;
      else if (tok === ')') openCount--;
    }
    while (openCount > 0) {
      enhanced.push(')');
      openCount--;
    }

    return enhanced;
  }

  // --- Recursive Descent Parser ---

  evaluate(
    expr: string,
    vars: Record<string, number> = {},
    options?: { angleUnit?: 'degrees' | 'radians' }
  ): number {
    if (!expr || !expr.trim()) return 0;

    const prevUnit = this.angleUnit;
    if (options?.angleUnit) {
      this.angleUnit = options.angleUnit;
    }

    try {
      const tokens = this.tokenize(expr);
      if (tokens.length === 0) return 0;

      let pos = 0;

      const peek = () => tokens[pos];
      const consume = () => tokens[pos++];

      const parseExpr = (): number => {
        let left = parseTerm();
        while (peek() === '+' || peek() === '-') {
          const op = consume();
          const right = parseTerm();
          if (op === '+') left += right;
          else if (op === '-') left -= right;
        }
        return left;
      };

      const parseTerm = (): number => {
        let left = parsePower();
        while (peek() === '*' || peek() === '/' || peek() === '%') {
          const op = consume();
          const right = parsePower();
          if (op === '*') {
            left *= right;
          } else if (op === '/') {
            if (Math.abs(right) < 1e-15) {
              throw new Error('Mathematical Error: Cannot divide by zero');
            }
            left /= right;
          } else if (op === '%') {
            if (Math.abs(right) < 1e-15) {
              throw new Error('Mathematical Error: Cannot modulo by zero');
            }
            left = left % right;
          }
        }
        return left;
      };

      const parsePower = (): number => {
        let left = parseUnary();
        while (peek() === '^' || peek() === '**') {
          consume();
          const right = parseUnary(); // Right-associative exponentiation
          if (left < 0 && Math.floor(right) !== right) {
            throw new Error('Mathematical Error: Negative base with non-integer exponent produces a complex result');
          }
          if (left === 0 && right < 0) {
            throw new Error('Mathematical Error: 0 cannot be raised to a negative exponent');
          }
          left = Math.pow(left, right);
        }
        return left;
      };

    const parseUnary = (): number => {
      if (peek() === '+') {
        consume();
        return parseUnary();
      }
      if (peek() === '-') {
        consume();
        return -parseUnary();
      }
      return parsePostfix();
    };

    const parsePostfix = (): number => {
      let val = parsePrimary();
      while (peek() === '!' || peek() === '%') {
        if (peek() === '%') {
          // If the token after % is an operand (number, '(', or identifier), % is binary modulo in parseTerm!
          const nextTok = tokens[pos + 1];
          const isNextOperand =
            nextTok &&
            (/^[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/.test(nextTok) ||
              nextTok === '(' ||
              /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(nextTok));
          if (isNextOperand) {
            break;
          }
        }
        const op = consume();
        if (op === '!') {
          val = this.factorial(val);
        } else if (op === '%') {
          val = val / 100;
        }
      }
      return val;
    };

    const parsePrimary = (): number => {
      const tok = peek();
      if (!tok) {
        throw new Error('Unexpected end of expression');
      }

      // Parentheses
      if (tok === '(') {
        consume();
        const val = parseExpr();
        if (peek() !== ')') {
          throw new Error("Missing closing parenthesis ')'");
        }
        consume();
        return val;
      }

      // Numbers
      if (/^[0-9]+(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/.test(tok)) {
        consume();
        return parseFloat(tok);
      }

      // Constants
      const lower = tok.toLowerCase();
      if (lower === 'pi') {
        consume();
        return Math.PI;
      }
      if (lower === 'e') {
        consume();
        return Math.E;
      }
      if (lower === 'tau') {
        consume();
        return Math.PI * 2;
      }
      if (lower === 'phi') {
        consume();
        return 1.618033988749895;
      }
      if (lower === 'ans') {
        consume();
        return this.lastAns;
      }

      // Variable lookups (e.g., x)
      if (vars && tok in vars) {
        consume();
        return vars[tok];
      }
      if (vars && lower in vars) {
        consume();
        return vars[lower];
      }

      // Function calls
      const fnName = lower;
      consume();

      // Check if function arguments follow in parentheses
      let args: number[] = [];
      if (peek() === '(') {
        consume();
        if (peek() !== ')') {
          args.push(parseExpr());
          while (peek() === ',') {
            consume();
            args.push(parseExpr());
          }
        }
        if (peek() !== ')') {
          throw new Error(`Missing closing parenthesis in ${fnName}()`);
        }
        consume();
      } else {
        throw new Error(`Unexpected token '${tok}'. Expected '(' after function name.`);
      }

      return this.executeFunction(fnName, args);
    };

    const result = parseExpr();
    if (pos < tokens.length) {
      throw new Error(`Unexpected token '${tokens[pos]}' after valid expression.`);
    }

    if (!isNaN(result) && isFinite(result)) {
      this.lastAns = result;
    }
    return result;
    } finally {
      if (options?.angleUnit) {
        this.angleUnit = prevUnit;
      }
    }
  }

  private executeFunction(name: string, args: number[]): number {
    switch (name) {
      // Trigonometric
      case 'sin':
        this.assertArgCount(name, args, 1);
        return this.sin(args[0]);
      case 'cos':
        this.assertArgCount(name, args, 1);
        return this.cos(args[0]);
      case 'tan':
        this.assertArgCount(name, args, 1);
        return this.tan(args[0]);
      case 'asin':
        this.assertArgCount(name, args, 1);
        return this.asin(args[0]);
      case 'acos':
        this.assertArgCount(name, args, 1);
        return this.acos(args[0]);
      case 'atan':
        this.assertArgCount(name, args, 1);
        return this.atan(args[0]);
      case 'atan2':
        this.assertArgCount(name, args, 2);
        return this.atan2(args[0], args[1]);

      // Hyperbolic
      case 'sinh':
        this.assertArgCount(name, args, 1);
        return Math.sinh(args[0]);
      case 'cosh':
        this.assertArgCount(name, args, 1);
        return Math.cosh(args[0]);
      case 'tanh':
        this.assertArgCount(name, args, 1);
        return Math.tanh(args[0]);
      case 'asinh':
        this.assertArgCount(name, args, 1);
        return Math.asinh(args[0]);
      case 'acosh':
        this.assertArgCount(name, args, 1);
        if (args[0] < 1) throw new Error('Mathematical Error: acosh(x) requires x >= 1');
        return Math.acosh(args[0]);
      case 'atanh':
        this.assertArgCount(name, args, 1);
        if (args[0] <= -1 || args[0] >= 1) throw new Error('Mathematical Error: atanh(x) requires -1 < x < 1');
        return Math.atanh(args[0]);

      // Logarithmic & Exponential
      case 'ln':
      case 'log':
        if (args.length === 1) {
          if (args[0] <= 0) throw new Error('Mathematical Error: Logarithm requires a positive argument');
          return Math.log(args[0]);
        }
        if (args.length === 2) {
          // log(x, base)
          if (args[0] <= 0 || args[1] <= 0 || args[1] === 1) {
            throw new Error('Mathematical Error: Logarithm with base requires positive x and base > 0, base != 1');
          }
          return Math.log(args[0]) / Math.log(args[1]);
        }
        throw new Error(`${name}() requires 1 or 2 arguments`);

      case 'log10':
        this.assertArgCount(name, args, 1);
        if (args[0] <= 0) throw new Error('Mathematical Error: log10 requires a positive argument');
        return Math.log10(args[0]);

      case 'log2':
        this.assertArgCount(name, args, 1);
        if (args[0] <= 0) throw new Error('Mathematical Error: log2 requires a positive argument');
        return Math.log2(args[0]);

      case 'exp':
        this.assertArgCount(name, args, 1);
        return Math.exp(args[0]);

      // Roots & Powers
      case 'sqrt':
        this.assertArgCount(name, args, 1);
        if (args[0] < 0) throw new Error('Mathematical Error: Square root of negative number is undefined in real domain');
        return Math.sqrt(args[0]);

      case 'cbrt':
        this.assertArgCount(name, args, 1);
        return Math.cbrt(args[0]);

      case 'root':
      case 'nthroot':
        this.assertArgCount(name, args, 2);
        // root(x, n) -> x^(1/n)
        const xVal = args[0];
        const nDegree = args[1];
        if (nDegree === 0) throw new Error('Mathematical Error: Root degree cannot be zero');
        if (xVal < 0 && Math.floor(nDegree) % 2 === 0) {
          throw new Error('Mathematical Error: Even root of negative number is undefined in real domain');
        }
        if (xVal < 0) {
          return -Math.pow(-xVal, 1 / nDegree);
        }
        return Math.pow(xVal, 1 / nDegree);

      // Combinatorics & Discrete
      case 'fact':
      case 'factorial':
        this.assertArgCount(name, args, 1);
        return this.factorial(args[0]);

      case 'npr':
      case 'perm':
        this.assertArgCount(name, args, 2);
        return this.permutation(args[0], args[1]);

      case 'ncr':
      case 'comb':
        this.assertArgCount(name, args, 2);
        return this.combination(args[0], args[1]);

      // Utility Math
      case 'abs':
        this.assertArgCount(name, args, 1);
        return Math.abs(args[0]);
      case 'floor':
        this.assertArgCount(name, args, 1);
        return Math.floor(args[0]);
      case 'ceil':
        this.assertArgCount(name, args, 1);
        return Math.ceil(args[0]);
      case 'round':
        this.assertArgCount(name, args, 1);
        return Math.round(args[0]);
      case 'deg':
        this.assertArgCount(name, args, 1);
        return this.radToDeg(args[0]);
      case 'rad':
        this.assertArgCount(name, args, 1);
        return this.degToRad(args[0]);

      default:
        throw new Error(`Unknown function '${name}()'`);
    }
  }

  private assertArgCount(fnName: string, args: number[], expected: number) {
    if (args.length !== expected) {
      throw new Error(`${fnName}() requires exactly ${expected} argument${expected === 1 ? '' : 's'}, but got ${args.length}`);
    }
  }

  formatResult(val: number): string {
    if (isNaN(val)) return 'NaN';
    if (!isFinite(val)) return val > 0 ? 'Infinity' : '-Infinity';
    if (Math.abs(val) < 1e-12) return '0';
    if (Math.abs(val - Math.round(val)) < 1e-10) {
      return Math.round(val).toString();
    }
    // High-precision tabular format without scientific notation noise unless very small/large
    const absVal = Math.abs(val);
    if (absVal >= 1e12 || absVal <= 1e-6) {
      return val.toExponential(this.precision - 2).replace(/\+0*/, '+').replace(/-0*/, '-');
    }
    const fixed = parseFloat(val.toFixed(this.precision));
    return fixed.toString();
  }

  // --- Numerical Calculus Methods ---

  numericalDerivative(f: (x: number) => number, x: number, h = 1e-5): number {
    const fm2 = f(x - 2 * h);
    const fm1 = f(x - h);
    const fp1 = f(x + h);
    const fp2 = f(x + 2 * h);
    return (-fp2 + 8 * fp1 - 8 * fm1 + fm2) / (12 * h);
  }

  simpsonIntegrate(f: (x: number) => number, a: number, b: number, n = 200): number {
    if (n % 2 !== 0) n += 1;
    const h = (b - a) / n;
    let sum = f(a) + f(b);
    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      sum += (i % 2 === 1 ? 4 : 2) * f(x);
    }
    return (h / 3) * sum;
  }

  trapezoidalIntegrate(f: (x: number) => number, a: number, b: number, n = 200): number {
    const h = (b - a) / n;
    let sum = 0.5 * (f(a) + f(b));
    for (let i = 1; i < n; i++) {
      sum += f(a + i * h);
    }
    return sum * h;
  }

  rombergIntegrate(f: (x: number) => number, a: number, b: number, maxSteps = 8, tol = 1e-8): { value: number; table: number[][] } {
    const R: number[][] = [];
    let h = b - a;
    R[0] = [0.5 * h * (f(a) + f(b))];

    for (let i = 1; i < maxSteps; i++) {
      h *= 0.5;
      let sum = 0;
      const nPts = 1 << (i - 1);
      for (let k = 1; k <= nPts; k++) {
        sum += f(a + (2 * k - 1) * h);
      }
      R[i] = [];
      R[i][0] = 0.5 * R[i - 1][0] + h * sum;

      for (let j = 1; j <= i; j++) {
        const factor = Math.pow(4, j);
        R[i][j] = (factor * R[i][j - 1] - R[i - 1][j - 1]) / (factor - 1);
      }

      if (Math.abs(R[i][i] - R[i - 1][i - 1]) < tol) {
        return { value: R[i][i], table: R };
      }
    }
    return { value: R[maxSteps - 1][maxSteps - 1], table: R };
  }

  newtonRaphson(
    f: (x: number) => number,
    df: (x: number) => number,
    x0: number,
    tol = 1e-7,
    maxIter = 100
  ): { root: number; iterations: Array<{ iter: number; x: number; fx: number; fpx: number; dx: number }>; converged: boolean } {
    let x = x0;
    const history: Array<{ iter: number; x: number; fx: number; fpx: number; dx: number }> = [];

    for (let iter = 1; iter <= maxIter; iter++) {
      const fx = f(x);
      const fpx = df(x);
      if (Math.abs(fpx) < 1e-14) {
        return { root: x, iterations: history, converged: false };
      }
      const dx = fx / fpx;
      const xNext = x - dx;
      history.push({ iter, x, fx, fpx, dx });

      if (Math.abs(dx) < tol) {
        return { root: xNext, iterations: history, converged: true };
      }
      x = xNext;
    }
    return { root: x, iterations: history, converged: false };
  }

  bisection(
    f: (x: number) => number,
    a: number,
    b: number,
    tol = 1e-7,
    maxIter = 100
  ): { root: number; iterations: Array<{ iter: number; a: number; b: number; c: number; fc: number; error: number }>; converged: boolean } {
    let fa = f(a);
    let fb = f(b);
    if (fa * fb > 0) {
      throw new Error(`f(${a}) = ${fa.toFixed(4)} and f(${b}) = ${fb.toFixed(4)} have the same sign. Root is not bracketed.`);
    }

    let c = a;
    const history: Array<{ iter: number; a: number; b: number; c: number; fc: number; error: number }> = [];

    for (let iter = 1; iter <= maxIter; iter++) {
      c = (a + b) / 2;
      const fc = f(c);
      const error = (b - a) / 2;
      history.push({ iter, a, b, c, fc, error });

      if (Math.abs(fc) < 1e-14 || error < tol) {
        return { root: c, iterations: history, converged: true };
      }

      if (fa * fc < 0) {
        b = c;
        fb = fc;
      } else {
        a = c;
        fa = fc;
      }
    }
    return { root: c, iterations: history, converged: false };
  }
}

export const mathCore = new MathCore();
