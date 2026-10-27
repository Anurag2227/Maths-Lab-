"""
MATHS LAB / NEXUS_MATH
c_engine.py - Ctypes Bridge to Native C Numerical Computation Engine

Handles automatic runtime DLL/SO discovery, dynamic linking, argument/return type
definitions, error-code unpacking, and pure-Python high-precision fallbacks.
"""

import ctypes
import os
import sys
import math
from typing import List, Tuple, Optional

class CMathEngineBridge:
    def __init__(self):
        self.is_loaded = False
        self.engine_path = None
        self.version = "C_ENGINE_FALLBACK_PYTHON_MODE"
        self._lib = None
        self._load_library()

    def _load_library(self):
        base_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(base_dir)

        candidate_paths = [
            os.path.join(project_root, "release", "math_engine.dll"),
            os.path.join(project_root, "c_engine", "math_engine.dll"),
            os.path.join(project_root, "math_engine.dll"),
            os.path.join(project_root, "release", "libmath_engine.so"),
            os.path.join(project_root, "c_engine", "libmath_engine.so"),
            os.path.join(base_dir, "math_engine.dll"),
            os.path.join(base_dir, "libmath_engine.so")
        ]

        if hasattr(sys, '_MEIPASS'):
            candidate_paths.insert(0, os.path.join(sys._MEIPASS, "math_engine.dll"))
            candidate_paths.insert(1, os.path.join(sys._MEIPASS, "c_engine", "math_engine.dll"))

        for path in candidate_paths:
            if os.path.exists(path):
                try:
                    self._lib = ctypes.CDLL(path)
                    self.engine_path = path
                    self.is_loaded = True
                    self._setup_signatures()
                    version_fn = self._lib.get_engine_version
                    version_fn.restype = ctypes.c_char_p
                    self.version = version_fn().decode('utf-8', errors='ignore')
                    return
                except Exception as e:
                    print(f"[C Engine Bridge] Warning loading {path}: {e}")

        # If not loaded, fallback will be used seamlessly
        self.is_loaded = False

    def _setup_signatures(self):
        if not self._lib:
            return
        
        c_double = ctypes.c_double
        c_int = ctypes.c_int
        c_double_p = ctypes.POINTER(c_double)
        c_int_p = ctypes.POINTER(c_int)

        # Basic Arithmetic
        self._lib.c_add.argtypes = [c_double, c_double]
        self._lib.c_add.restype = c_double
        self._lib.c_sub.argtypes = [c_double, c_double]
        self._lib.c_sub.restype = c_double
        self._lib.c_mul.argtypes = [c_double, c_double]
        self._lib.c_mul.restype = c_double
        self._lib.c_div.argtypes = [c_double, c_double, c_int_p]
        self._lib.c_div.restype = c_double
        self._lib.c_pow.argtypes = [c_double, c_double, c_int_p]
        self._lib.c_pow.restype = c_double
        self._lib.c_factorial.argtypes = [c_int, c_int_p]
        self._lib.c_factorial.restype = c_double
        self._lib.c_permutation.argtypes = [c_int, c_int, c_int_p]
        self._lib.c_permutation.restype = c_double
        self._lib.c_combination.argtypes = [c_int, c_int, c_int_p]
        self._lib.c_combination.restype = c_double

        # Calculus & Poly
        self._lib.c_eval_poly.argtypes = [c_double_p, c_int, c_double]
        self._lib.c_eval_poly.restype = c_double
        self._lib.c_eval_poly_derivative.argtypes = [c_double_p, c_int, c_double]
        self._lib.c_eval_poly_derivative.restype = c_double
        self._lib.c_diff_4th_order.argtypes = [c_double_p, c_int, c_double, c_double]
        self._lib.c_diff_4th_order.restype = c_double

        # Quadrature
        self._lib.c_trapezoidal_rule.argtypes = [c_double_p, c_int, c_double, c_double, c_int]
        self._lib.c_trapezoidal_rule.restype = c_double
        self._lib.c_simpsons_rule.argtypes = [c_double_p, c_int, c_double, c_double, c_int, c_int_p]
        self._lib.c_simpsons_rule.restype = c_double
        self._lib.c_simpsons_38_rule.argtypes = [c_double_p, c_int, c_double, c_double, c_int, c_int_p]
        self._lib.c_simpsons_38_rule.restype = c_double
        self._lib.c_romberg_integration.argtypes = [c_double_p, c_int, c_double, c_double, c_int, c_double]
        self._lib.c_romberg_integration.restype = c_double

        # Roots
        self._lib.c_bisection_root.argtypes = [c_double_p, c_int, c_double, c_double, c_double, c_int, c_int_p, c_int_p]
        self._lib.c_bisection_root.restype = c_double
        self._lib.c_newton_raphson_root.argtypes = [c_double_p, c_int, c_double, c_double, c_int, c_int_p, c_int_p]
        self._lib.c_newton_raphson_root.restype = c_double

        # Linear Algebra
        self._lib.c_matrix_determinant.argtypes = [c_double_p, c_int, c_int_p]
        self._lib.c_matrix_determinant.restype = c_double
        self._lib.c_matrix_trace.argtypes = [c_double_p, c_int]
        self._lib.c_matrix_trace.restype = c_double
        self._lib.c_matrix_mul.argtypes = [c_double_p, c_int, c_int, c_double_p, c_int, c_int, c_double_p]
        self._lib.c_matrix_mul.restype = c_int
        self._lib.c_matrix_inverse.argtypes = [c_double_p, c_int, c_double_p]
        self._lib.c_matrix_inverse.restype = c_int
        self._lib.c_matrix_rank.argtypes = [c_double_p, c_int, c_int]
        self._lib.c_matrix_rank.restype = c_int
        self._lib.c_solve_linear_system.argtypes = [c_double_p, c_double_p, c_int, c_double_p]
        self._lib.c_solve_linear_system.restype = c_int

        # Benchmark
        self._lib.c_benchmark_simpson.argtypes = [c_int, c_int]
        self._lib.c_benchmark_simpson.restype = c_double

    # Python High-Performance Facade
    def add(self, a: float, b: float) -> float:
        if self.is_loaded:
            return float(self._lib.c_add(a, b))
        return a + b

    def sub(self, a: float, b: float) -> float:
        if self.is_loaded:
            return float(self._lib.c_sub(a, b))
        return a - b

    def mul(self, a: float, b: float) -> float:
        if self.is_loaded:
            return float(self._lib.c_mul(a, b))
        return a * b

    def div(self, a: float, b: float) -> float:
        if abs(b) < 1e-15:
            raise ZeroDivisionError("Division by zero in numerical engine")
        if self.is_loaded:
            err = ctypes.c_int(0)
            res = float(self._lib.c_div(a, b, ctypes.byref(err)))
            if err.value != 0:
                raise ZeroDivisionError("Division by zero in C engine")
            return res
        return a / b

    def power(self, base: float, exp: float) -> float:
        if base < 0 and math.floor(exp) != exp:
            raise ValueError("Negative base with fractional exponent results in complex domain")
        if base == 0 and exp < 0:
            raise ZeroDivisionError("0 cannot be raised to a negative power")
        if self.is_loaded:
            err = ctypes.c_int(0)
            res = float(self._lib.c_pow(base, exp, ctypes.byref(err)))
            if err.value != 0:
                raise ValueError("Domain error in power calculation")
            return res
        return math.pow(base, exp)

    def factorial(self, n: int) -> float:
        if n < 0:
            raise ValueError("Factorial undefined for negative integers")
        if n > 170:
            raise OverflowError("Factorial exceeds standard IEEE-754 64-bit float limit")
        if self.is_loaded:
            err = ctypes.c_int(0)
            res = float(self._lib.c_factorial(n, ctypes.byref(err)))
            if err.value != 0:
                raise ValueError("Factorial calculation error")
            return res
        return float(math.factorial(n))

    def permutation(self, n: int, r: int) -> float:
        if n < 0 or r < 0 or r > n:
            raise ValueError("Invalid parameters for permutation (require 0 <= r <= n)")
        if self.is_loaded:
            err = ctypes.c_int(0)
            return float(self._lib.c_permutation(n, r, ctypes.byref(err)))
        return float(math.perm(n, r) if hasattr(math, 'perm') else math.factorial(n) // math.factorial(n - r))

    def combination(self, n: int, r: int) -> float:
        if n < 0 or r < 0 or r > n:
            raise ValueError("Invalid parameters for combination (require 0 <= r <= n)")
        if self.is_loaded:
            err = ctypes.c_int(0)
            return float(self._lib.c_combination(n, r, ctypes.byref(err)))
        return float(math.comb(n, r) if hasattr(math, 'comb') else math.factorial(n) // (math.factorial(r) * math.factorial(n - r)))

    def simpson_integrate_poly(self, coeffs: List[float], a: float, b: float, intervals: int = 100) -> float:
        if intervals % 2 != 0:
            intervals += 1
        if self.is_loaded:
            c_arr = (ctypes.c_double * len(coeffs))(*coeffs)
            degree = len(coeffs) - 1
            err = ctypes.c_int(0)
            return float(self._lib.c_simpsons_rule(c_arr, degree, a, b, intervals, ctypes.byref(err)))
        
        # Pure Python Fallback
        def f(x):
            return sum(c * (x ** i) for i, c in enumerate(coeffs))
        h = (b - a) / intervals
        s = f(a) + f(b)
        for i in range(1, intervals):
            x = a + i * h
            s += (4.0 if i % 2 == 1 else 2.0) * f(x)
        return (h / 3.0) * s

    def newton_raphson_poly(self, coeffs: List[float], x0: float, tol: float = 1e-7, max_iter: int = 100) -> Tuple[float, int, int]:
        if self.is_loaded:
            c_arr = (ctypes.c_double * len(coeffs))(*coeffs)
            degree = len(coeffs) - 1
            iters = ctypes.c_int(0)
            status = ctypes.c_int(0)
            root = float(self._lib.c_newton_raphson_root(c_arr, degree, x0, tol, max_iter, ctypes.byref(iters), ctypes.byref(status)))
            return root, iters.value, status.value
        
        # Python fallback
        def f(x):
            return sum(c * (x ** i) for i, c in enumerate(coeffs))
        def df(x):
            return sum(i * c * (x ** (i - 1)) for i, c in enumerate(coeffs) if i > 0)
        
        x = x0
        for it in range(max_iter):
            fx = f(x)
            fpx = df(x)
            if abs(fpx) < 1e-14:
                return x, it, -2
            dx = fx / fpx
            x -= dx
            if abs(dx) < tol:
                return x, it + 1, 0
        return x, max_iter, 1

    def solve_linear_system(self, A_flat: List[float], b: List[float], n: int) -> List[float]:
        if self.is_loaded:
            c_A = (ctypes.c_double * (n * n))(*A_flat)
            c_b = (ctypes.c_double * n)(*b)
            c_x = (ctypes.c_double * n)()
            status = self._lib.c_solve_linear_system(c_A, c_b, n, c_x)
            if status != 0:
                raise ValueError("Matrix is singular or ill-conditioned; unique solution does not exist")
            return [float(c_x[i]) for i in range(n)]
        
        # Pure Python Gaussian Elimination with partial pivoting
        import copy
        M = [[A_flat[i * n + j] for j in range(n)] for i in range(n)]
        b_vec = list(b)
        for i in range(n):
            max_r = i
            max_v = abs(M[i][i])
            for r in range(i + 1, n):
                if abs(M[r][i]) > max_v:
                    max_v = abs(M[r][i])
                    max_r = r
            if max_v < 1e-12:
                raise ValueError("Matrix is singular; system cannot be uniquely solved")
            M[i], M[max_r] = M[max_r], M[i]
            b_vec[i], b_vec[max_r] = b_vec[max_r], b_vec[i]
            for r in range(i + 1, n):
                factor = M[r][i] / M[i][i]
                for c in range(i, n):
                    M[r][c] -= factor * M[i][c]
                b_vec[r] -= factor * b_vec[i]

        x_out = [0.0] * n
        for i in range(n - 1, -1, -1):
            s = sum(M[i][j] * x_out[j] for j in range(i + 1, n))
            x_out[i] = (b_vec[i] - s) / M[i][i]
        return x_out


# Singleton instance accessible throughout the desktop suite
c_engine = CMathEngineBridge()
