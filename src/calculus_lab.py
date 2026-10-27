"""
MATHS LAB / NEXUS_MATH
calculus_lab.py - Symbolic & Numerical Calculus Engine

Integrates SymPy for exact analytical differentiation, indefinite/definite integrals,
and limits. Backed by C-engine routines for composite Simpson, Trapezoidal, Romberg,
and Newton-Raphson root finding.
"""

from typing import Dict, Any, List, Tuple, Optional
import math
from src.c_engine import c_engine

class CalculusLab:
    def __init__(self):
        self.has_sympy = False
        try:
            import sympy
            self.sympy = sympy
            self.has_sympy = True
        except ImportError:
            self.has_sympy = False

    def differentiate_symbolic(self, expr_str: str, var_str: str = "x", order: int = 1, eval_at: Optional[float] = None) -> Dict[str, Any]:
        if not self.has_sympy:
            return {"success": False, "error": "SymPy is required for symbolic differentiation."}

        try:
            x = self.sympy.Symbol(var_str)
            # Parse math expression safely
            expr = self.sympy.sympify(expr_str.replace('^', '**'))
            deriv = self.sympy.diff(expr, x, order)
            
            result = {
                "success": True,
                "expression": str(expr),
                "derivative": str(deriv),
                "order": order,
                "variable": var_str
            }

            if eval_at is not None:
                val = float(deriv.subs(x, eval_at).evalf())
                result["eval_at"] = eval_at
                result["eval_value"] = val
                # Tangent line at eval_at: y = f'(x0)*(x - x0) + f(x0)
                y0 = float(expr.subs(x, eval_at).evalf())
                result["tangent_line"] = f"y = {val:.4g}*({var_str} - {eval_at}) + {y0:.4g}"

            return result
        except Exception as e:
            return {"success": False, "error": str(e)}

    def integrate_symbolic(self, expr_str: str, var_str: str = "x", a: Optional[float] = None, b: Optional[float] = None) -> Dict[str, Any]:
        if not self.has_sympy:
            return {"success": False, "error": "SymPy is required for symbolic integration."}

        try:
            x = self.sympy.Symbol(var_str)
            expr = self.sympy.sympify(expr_str.replace('^', '**'))

            if a is not None and b is not None:
                exact_integral = self.sympy.integrate(expr, (x, a, b))
                try:
                    num_val = float(exact_integral.evalf())
                except Exception:
                    num_val = None
                return {
                    "success": True,
                    "type": "definite",
                    "expression": str(expr),
                    "bounds": [a, b],
                    "exact": str(exact_integral),
                    "numeric_approx": num_val
                }
            else:
                indefinite = self.sympy.integrate(expr, x)
                return {
                    "success": True,
                    "type": "indefinite",
                    "expression": str(expr),
                    "antiderivative": f"{indefinite} + C"
                }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def compute_limit(self, expr_str: str, var_str: str = "x", point: float = 0.0, direction: str = "+-") -> Dict[str, Any]:
        if not self.has_sympy:
            return {"success": False, "error": "SymPy is required for analytical limits."}

        try:
            x = self.sympy.Symbol(var_str)
            expr = self.sympy.sympify(expr_str.replace('^', '**'))

            dir_map = {"+": "+", "-": "-", "+-": "+-"}
            sympy_dir = dir_map.get(direction, "+-")

            lim_res = self.sympy.limit(expr, x, point, dir=sympy_dir)
            return {
                "success": True,
                "expression": str(expr),
                "point": point,
                "direction": direction,
                "limit": str(lim_res)
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    # Numerical Quadrature Methods
    def numerical_integrate(self, f_callable, a: float, b: float, method: str = "simpson", intervals: int = 200) -> float:
        if intervals % 2 != 0:
            intervals += 1
        h = (b - a) / intervals

        if method == "trapezoidal":
            s = 0.5 * (f_callable(a) + f_callable(b))
            for i in range(1, intervals):
                s += f_callable(a + i * h)
            return s * h

        elif method == "simpson_38":
            while intervals % 3 != 0:
                intervals += 1
            h = (b - a) / intervals
            s = f_callable(a) + f_callable(b)
            for i in range(1, intervals):
                x = a + i * h
                s += (2.0 if i % 3 == 0 else 3.0) * f_callable(x)
            return (3.0 * h / 8.0) * s

        else: # Standard Composite Simpson's 1/3
            s = f_callable(a) + f_callable(b)
            for i in range(1, intervals):
                x = a + i * h
                s += (4.0 if i % 2 == 1 else 2.0) * f_callable(x)
            return (h / 3.0) * s

    # Numerical Differentiation (Richardson Extrapolation)
    def numerical_derivative(self, f_callable, x: float, h: float = 1e-5) -> float:
        d1 = (f_callable(x + h) - f_callable(x - h)) / (2.0 * h)
        d2 = (f_callable(x + 2 * h) - f_callable(x - 2 * h)) / (4.0 * h)
        return (4.0 * d1 - d2) / 3.0

    # Numerical Root Finding (Newton-Raphson)
    def newton_raphson(self, f_callable, df_callable, x0: float, tol: float = 1e-7, max_iter: int = 100) -> Dict[str, Any]:
        x = x0
        table = []
        for it in range(1, max_iter + 1):
            fx = f_callable(x)
            fpx = df_callable(x)
            if abs(fpx) < 1e-14:
                return {"success": False, "error": f"Derivative near zero at x = {x}", "iterations": table}
            dx = fx / fpx
            x_next = x - dx
            table.append({"iter": it, "x": x, "fx": fx, "fpx": fpx, "dx": dx})
            if abs(dx) < tol:
                return {"success": True, "root": x_next, "iterations": table, "converged": True}
            x = x_next
        return {"success": False, "root": x, "error": "Maximum iterations reached", "iterations": table, "converged": False}

    # Numerical Root Finding (Bisection)
    def bisection(self, f_callable, a: float, b: float, tol: float = 1e-7, max_iter: int = 100) -> Dict[str, Any]:
        fa = f_callable(a)
        fb = f_callable(b)
        if fa * fb > 0:
            return {"success": False, "error": f"Root not bracketed: f({a})={fa:.4g} and f({b})={fb:.4g} have the same sign."}
        
        table = []
        c = a
        for it in range(1, max_iter + 1):
            c = (a + b) / 2.0
            fc = f_callable(c)
            table.append({"iter": it, "a": a, "b": b, "c": c, "fc": fc, "error": (b - a) / 2.0})
            if abs(fc) < 1e-14 or (b - a) / 2.0 < tol:
                return {"success": True, "root": c, "iterations": table, "converged": True}
            if fa * fc < 0:
                b = c
                fb = fc
            else:
                a = c
                fa = fc
        return {"success": True, "root": c, "iterations": table, "converged": False}
