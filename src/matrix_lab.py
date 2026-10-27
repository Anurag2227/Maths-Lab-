"""
MATHS LAB / NEXUS_MATH
matrix_lab.py - Linear Algebra & Matrix Computing Studio

Handles arbitrary dimension matrices (1x1 to 6x6+), arithmetic, determinant,
inverse, rank, trace, powers, and linear system solving with full numerical stability.
"""

from typing import List, Tuple, Optional
import math
from src.c_engine import c_engine

Matrix = List[List[float]]

class MatrixLab:
    @staticmethod
    def create_empty(rows: int, cols: int, fill: float = 0.0) -> Matrix:
        return [[fill for _ in range(cols)] for _ in range(rows)]

    @staticmethod
    def identity(n: int) -> Matrix:
        return [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]

    @staticmethod
    def flatten(M: Matrix) -> List[float]:
        return [val for row in M for val in row]

    @staticmethod
    def unflatten(flat: List[float], rows: int, cols: int) -> Matrix:
        return [flat[i * cols : (i + 1) * cols] for i in range(rows)]

    @staticmethod
    def add(A: Matrix, B: Matrix) -> Matrix:
        rA, cA = len(A), len(A[0])
        rB, cB = len(B), len(B[0])
        if rA != rB or cA != cB:
            raise ValueError(f"Matrix dimension mismatch for addition: ({rA}x{cA}) vs ({rB}x{cB})")
        return [[A[i][j] + B[i][j] for j in range(cA)] for i in range(rA)]

    @staticmethod
    def subtract(A: Matrix, B: Matrix) -> Matrix:
        rA, cA = len(A), len(A[0])
        rB, cB = len(B), len(B[0])
        if rA != rB or cA != cB:
            raise ValueError(f"Matrix dimension mismatch for subtraction: ({rA}x{cA}) vs ({rB}x{cB})")
        return [[A[i][j] - B[i][j] for j in range(cA)] for i in range(rA)]

    @staticmethod
    def multiply_scalar(A: Matrix, k: float) -> Matrix:
        return [[cell * k for cell in row] for row in A]

    @staticmethod
    def multiply(A: Matrix, B: Matrix) -> Matrix:
        rA, cA = len(A), len(A[0])
        rB, cB = len(B), len(B[0])
        if cA != rB:
            raise ValueError(f"Matrix multiplication impossible: columns of A ({cA}) != rows of B ({rB})")
        
        flatA = MatrixLab.flatten(A)
        flatB = MatrixLab.flatten(B)
        
        # If C engine is available, use fast C matrix multiplication
        if c_engine.is_loaded:
            import ctypes
            c_A = (ctypes.c_double * len(flatA))(*flatA)
            c_B = (ctypes.c_double * len(flatB))(*flatB)
            c_C = (ctypes.c_double * (rA * cB))()
            c_engine._lib.c_matrix_mul(c_A, rA, cA, c_B, rB, cB, c_C)
            return MatrixLab.unflatten([float(c_C[i]) for i in range(rA * cB)], rA, cB)

        # Standard pure Python multiplication
        res = [[0.0 for _ in range(cB)] for _ in range(rA)]
        for i in range(rA):
            for j in range(cB):
                s = 0.0
                for k in range(cA):
                    s += A[i][k] * B[k][j]
                res[i][j] = s
        return res

    @staticmethod
    def transpose(A: Matrix) -> Matrix:
        rows, cols = len(A), len(A[0])
        return [[A[i][j] for i in range(rows)] for j in range(cols)]

    @staticmethod
    def trace(A: Matrix) -> float:
        rows, cols = len(A), len(A[0])
        if rows != cols:
            raise ValueError("Trace is only defined for square matrices")
        return sum(A[i][i] for i in range(rows))

    @staticmethod
    def determinant(A: Matrix) -> float:
        n = len(A)
        if any(len(row) != n for row in A):
            raise ValueError("Determinant is only defined for square matrices")
        
        if c_engine.is_loaded:
            import ctypes
            flat = MatrixLab.flatten(A)
            c_arr = (ctypes.c_double * len(flat))(*flat)
            err = ctypes.c_int(0)
            return float(c_engine._lib.c_matrix_determinant(c_arr, n, ctypes.byref(err)))

        # Pure Python recursive determinant or Gaussian
        if n == 1:
            return A[0][0]
        if n == 2:
            return A[0][0] * A[1][1] - A[0][1] * A[1][0]

        # Gaussian Elimination
        M = [row[:] for row in A]
        det = 1.0
        for i in range(n):
            pivot = i
            max_v = abs(M[i][i])
            for r in range(i + 1, n):
                if abs(M[r][i]) > max_v:
                    max_v = abs(M[r][i])
                    pivot = r
            if max_v < 1e-12:
                return 0.0
            if pivot != i:
                M[i], M[pivot] = M[pivot], M[i]
                det = -det
            det *= M[i][i]
            for r in range(i + 1, n):
                factor = M[r][i] / M[i][i]
                for c in range(i, n):
                    M[r][c] -= factor * M[i][c]
        return det

    @staticmethod
    def inverse(A: Matrix) -> Matrix:
        n = len(A)
        if any(len(row) != n for row in A):
            raise ValueError("Inverse only defined for square matrices")
        
        det = MatrixLab.determinant(A)
        if abs(det) < 1e-12:
            raise ValueError("Matrix is singular (determinant = 0); inverse does not exist")

        if c_engine.is_loaded:
            import ctypes
            flat = MatrixLab.flatten(A)
            c_arr = (ctypes.c_double * len(flat))(*flat)
            c_inv = (ctypes.c_double * (n * n))()
            res = c_engine._lib.c_matrix_inverse(c_arr, n, c_inv)
            if res == 0:
                return MatrixLab.unflatten([float(c_inv[i]) for i in range(n * n)], n, n)

        # Gauss-Jordan elimination on [A | I]
        aug = [A[i] + [1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
        for i in range(n):
            pivot = i
            max_v = abs(aug[i][i])
            for r in range(i + 1, n):
                if abs(aug[r][i]) > max_v:
                    max_v = abs(aug[r][i])
                    pivot = r
            if max_v < 1e-12:
                raise ValueError("Matrix is singular and non-invertible")
            aug[i], aug[pivot] = aug[pivot], aug[i]

            diag = aug[i][i]
            for c in range(2 * n):
                aug[i][c] /= diag

            for r in range(n):
                if r != i:
                    factor = aug[r][i]
                    for c in range(2 * n):
                        aug[r][c] -= factor * aug[i][c]

        return [row[n:] for row in aug]

    @staticmethod
    def rank(A: Matrix) -> int:
        rows, cols = len(A), len(A[0])
        flat = MatrixLab.flatten(A)
        if c_engine.is_loaded:
            import ctypes
            c_arr = (ctypes.c_double * len(flat))(*flat)
            return int(c_engine._lib.c_matrix_rank(c_arr, rows, cols))

        # Row echelon rank
        M = [row[:] for row in A]
        rank = cols
        for row in range(rank):
            if row < rows and abs(M[row][row]) > 1e-12:
                for col in range(rows):
                    if col != row:
                        mult = M[col][row] / M[row][row]
                        for i in range(rank):
                            M[col][i] -= mult * M[row][i]
            else:
                reduce = True
                for i in range(row + 1, rows):
                    if abs(M[i][row]) > 1e-12:
                        M[row], M[i] = M[i], M[row]
                        reduce = False
                        break
                if reduce:
                    rank -= 1
                    for i in range(rows):
                        M[i][row] = M[i][rank]
                row -= 1
        return max(0, min(rank, rows, cols))

    @staticmethod
    def power(A: Matrix, k: int) -> Matrix:
        n = len(A)
        if any(len(row) != n for row in A):
            raise ValueError("Matrix powers require a square matrix")
        if k < 0:
            inv = MatrixLab.inverse(A)
            return MatrixLab.power(inv, -k)
        if k == 0:
            return MatrixLab.identity(n)
        if k == 1:
            return [row[:] for row in A]
        
        # Binary exponentiation
        result = MatrixLab.identity(n)
        base = [row[:] for row in A]
        while k > 0:
            if k % 2 == 1:
                result = MatrixLab.multiply(result, base)
            base = MatrixLab.multiply(base, base)
            k //= 2
        return result

    @staticmethod
    def solve_system(A: Matrix, b: List[float]) -> List[float]:
        n = len(A)
        if len(b) != n or any(len(row) != n for row in A):
            raise ValueError("Linear system requires n x n coefficient matrix and length n vector b")
        flat = MatrixLab.flatten(A)
        return c_engine.solve_linear_system(flat, b, n)
