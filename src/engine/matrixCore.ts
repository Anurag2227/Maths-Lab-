/**
 * MATHS LAB - Linear Algebra & Matrix Core
 */

export type Matrix = number[][];

export class MatrixCore {
  static create(rows: number, cols: number, fill = 0): Matrix {
    return Array.from({ length: rows }, () => Array(cols).fill(fill));
  }

  static identity(n: number): Matrix {
    return Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
    );
  }

  static add(A: Matrix, B: Matrix): Matrix {
    const r = A.length;
    const c = A[0].length;
    if (B.length !== r || B[0].length !== c) {
      throw new Error(`Dimension mismatch: (${r}x${c}) + (${B.length}x${B[0].length})`);
    }
    return A.map((row, i) => row.map((val, j) => val + B[i][j]));
  }

  static subtract(A: Matrix, B: Matrix): Matrix {
    const r = A.length;
    const c = A[0].length;
    if (B.length !== r || B[0].length !== c) {
      throw new Error(`Dimension mismatch: (${r}x${c}) - (${B.length}x${B[0].length})`);
    }
    return A.map((row, i) => row.map((val, j) => val - B[i][j]));
  }

  static multiplyScalar(A: Matrix, k: number): Matrix {
    return A.map(row => row.map(v => v * k));
  }

  static multiply(A: Matrix, B: Matrix): Matrix {
    const rA = A.length;
    const cA = A[0].length;
    const rB = B.length;
    const cB = B[0].length;
    if (cA !== rB) {
      throw new Error(`Multiplication not possible: Columns of A (${cA}) != Rows of B (${rB})`);
    }

    const C = MatrixCore.create(rA, cB, 0);
    for (let i = 0; i < rA; i++) {
      for (let j = 0; j < cB; j++) {
        let sum = 0;
        for (let k = 0; k < cA; k++) {
          sum += A[i][k] * B[k][j];
        }
        C[i][j] = sum;
      }
    }
    return C;
  }

  static transpose(A: Matrix): Matrix {
    const rows = A.length;
    const cols = A[0].length;
    const T = MatrixCore.create(cols, rows, 0);
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        T[j][i] = A[i][j];
      }
    }
    return T;
  }

  static trace(A: Matrix): number {
    const n = A.length;
    if (A[0].length !== n) throw new Error('Trace requires a square matrix');
    let tr = 0;
    for (let i = 0; i < n; i++) tr += A[i][i];
    return tr;
  }

  static determinant(A: Matrix): number {
    const n = A.length;
    if (A[0].length !== n) throw new Error('Determinant requires a square matrix');
    if (n === 1) return A[0][0];
    if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];

    // Gaussian elimination with partial pivoting
    const M = A.map(row => [...row]);
    let det = 1;

    for (let i = 0; i < n; i++) {
      let pivot = i;
      let maxVal = Math.abs(M[i][i]);
      for (let r = i + 1; r < n; r++) {
        const val = Math.abs(M[r][i]);
        if (val > maxVal) {
          maxVal = val;
          pivot = r;
        }
      }

      if (maxVal < 1e-12) return 0; // Singular

      if (pivot !== i) {
        const temp = M[i];
        M[i] = M[pivot];
        M[pivot] = temp;
        det = -det;
      }

      det *= M[i][i];

      for (let r = i + 1; r < n; r++) {
        const factor = M[r][i] / M[i][i];
        for (let c = i; c < n; c++) {
          M[r][c] -= factor * M[i][c];
        }
      }
    }
    return det;
  }

  static inverse(A: Matrix): Matrix {
    const n = A.length;
    if (A[0].length !== n) throw new Error('Inverse requires a square matrix');

    const det = MatrixCore.determinant(A);
    if (Math.abs(det) < 1e-12) {
      throw new Error('Matrix is singular (determinant = 0); inverse does not exist');
    }

    // Augmented matrix [A | I]
    const aug = A.map((row, i) => [
      ...row,
      ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
    ]);

    for (let i = 0; i < n; i++) {
      let pivot = i;
      let maxVal = Math.abs(aug[i][i]);
      for (let r = i + 1; r < n; r++) {
        const val = Math.abs(aug[r][i]);
        if (val > maxVal) {
          maxVal = val;
          pivot = r;
        }
      }

      if (maxVal < 1e-12) {
        throw new Error('Matrix is singular');
      }

      if (pivot !== i) {
        const temp = aug[i];
        aug[i] = aug[pivot];
        aug[pivot] = temp;
      }

      const diag = aug[i][i];
      for (let c = 0; c < 2 * n; c++) {
        aug[i][c] /= diag;
      }

      for (let r = 0; r < n; r++) {
        if (r !== i) {
          const factor = aug[r][i];
          for (let c = 0; c < 2 * n; c++) {
            aug[r][c] -= factor * aug[i][c];
          }
        }
      }
    }

    return aug.map(row => row.slice(n));
  }

  static rank(A: Matrix): number {
    const rows = A.length;
    const cols = A[0].length;
    const M = A.map(row => [...row]);
    let rank = cols;

    for (let row = 0; row < rank; row++) {
      if (row < rows && Math.abs(M[row][row]) > 1e-12) {
        for (let col = 0; col < rows; col++) {
          if (col !== row) {
            const mult = M[col][row] / M[row][row];
            for (let i = 0; i < rank; i++) {
              M[col][i] -= mult * M[row][i];
            }
          }
        }
      } else {
        let reduce = true;
        for (let i = row + 1; i < rows; i++) {
          if (Math.abs(M[i][row]) > 1e-12) {
            const temp = M[row];
            M[row] = M[i];
            M[i] = temp;
            reduce = false;
            break;
          }
        }
        if (reduce) {
          rank--;
          for (let i = 0; i < rows; i++) {
            M[i][row] = M[i][rank];
          }
        }
        row--;
      }
    }
    return Math.max(0, Math.min(rank, rows, cols));
  }

  static power(A: Matrix, k: number): Matrix {
    const n = A.length;
    if (A[0].length !== n) throw new Error('Matrix power requires square matrix');
    if (k < 0) {
      const inv = MatrixCore.inverse(A);
      return MatrixCore.power(inv, -k);
    }
    if (k === 0) return MatrixCore.identity(n);
    if (k === 1) return A.map(r => [...r]);

    let result = MatrixCore.identity(n);
    let base = A.map(r => [...r]);
    while (k > 0) {
      if (k % 2 === 1) {
        result = MatrixCore.multiply(result, base);
      }
      base = MatrixCore.multiply(base, base);
      k = Math.floor(k / 2);
    }
    return result;
  }

  static solveSystem(A: Matrix, b: number[]): number[] {
    const n = A.length;
    if (A[0].length !== n || b.length !== n) {
      throw new Error('System Ax=b requires square matrix A and matching vector b');
    }
    const inv = MatrixCore.inverse(A);
    const x = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        sum += inv[i][j] * b[j];
      }
      x[i] = sum;
    }
    return x;
  }
}
