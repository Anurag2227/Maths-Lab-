"""
MATHS LAB / NEXUS_MATH
equation_solver.py - Comprehensive Analytical & Numerical Equation Solver

Solves linear, quadratic (real & complex conjugate), cubic, higher-order polynomial,
systems of linear equations (2x2, 3x3), and general nonlinear expressions.
"""

import math
import cmath
from typing import Dict, Any, List, Tuple
from src.c_engine import c_engine

class EquationSolver:
    @staticmethod
    def solve_linear(a: float, b: float) -> Dict[str, Any]:
        """Solves ax + b = 0"""
        if abs(a) < 1e-14:
            if abs(b) < 1e-14:
                return {"success": True, "type": "infinite", "solution_str": "Infinite solutions (identity 0 = 0)"}
            return {"success": False, "type": "inconsistent", "error": "No solution (contradiction b != 0)"}
        x = -b / a
        return {
            "success": True,
            "type": "unique",
            "roots": [x],
            "solution_str": f"x = {x:.6g}",
            "steps": [f"Equation: {a}x + {b} = 0", f"Subtract {b}: {a}x = {-b}", f"Divide by {a}: x = {x:.6g}"]
        }

    @staticmethod
    def solve_quadratic(a: float, b: float, c: float) -> Dict[str, Any]:
        """Solves ax^2 + bx + c = 0 with discriminant analysis"""
        if abs(a) < 1e-14:
            return EquationSolver.solve_linear(b, c)

        delta = b * b - 4 * a * c
        steps = [
            f"Equation: {a}x² + ({b})x + ({c}) = 0",
            f"Discriminant Δ = b² - 4ac = ({b})² - 4({a})({c}) = {delta:.6g}"
        ]

        if delta > 1e-14:
            sqrt_d = math.sqrt(delta)
            x1 = (-b + sqrt_d) / (2 * a)
            x2 = (-b - sqrt_d) / (2 * a)
            steps.append("Δ > 0: Two distinct real roots.")
            steps.append(f"x₁ = (-b + √Δ) / 2a = ({-b} + {sqrt_d:.6g}) / {2*a} = {x1:.6g}")
            steps.append(f"x₂ = (-b - √Δ) / 2a = ({-b} - {sqrt_d:.6g}) / {2*a} = {x2:.6g}")
            return {"success": True, "type": "two_real", "discriminant": delta, "roots": [x1, x2], "steps": steps}

        elif abs(delta) <= 1e-14:
            x = -b / (2 * a)
            steps.append("Δ = 0: One repeated real root.")
            steps.append(f"x = -b / 2a = {-b} / {2*a} = {x:.6g}")
            return {"success": True, "type": "one_repeated", "discriminant": delta, "roots": [x], "steps": steps}

        else:
            sqrt_neg_d = math.sqrt(-delta)
            real_part = -b / (2 * a)
            imag_part = sqrt_neg_d / abs(2 * a)
            steps.append("Δ < 0: Two complex conjugate roots.")
            steps.append(f"x = ({real_part:.6g}) ± ({imag_part:.6g})i")
            return {
                "success": True,
                "type": "complex_conjugate",
                "discriminant": delta,
                "complex_roots": [complex(real_part, imag_part), complex(real_part, -imag_part)],
                "solution_str": f"x = {real_part:.6g} ± {imag_part:.6g}i",
                "steps": steps
            }

    @staticmethod
    def solve_cubic(a: float, b: float, c: float, d: float) -> Dict[str, Any]:
        """Solves ax^3 + bx^2 + cx + d = 0 via Cardano's analytical method"""
        if abs(a) < 1e-14:
            return EquationSolver.solve_quadratic(b, c, d)

        # Depress the cubic: x = t - b/(3a) -> t^3 + pt + q = 0
        p = (3 * a * c - b * b) / (3 * a * a)
        q = (2 * b**3 - 9 * a * b * c + 27 * a * a * d) / (27 * a**3)
        delta = (q / 2)**2 + (p / 3)**3

        shift = -b / (3 * a)
        roots = []

        if delta > 1e-14:
            # One real root, two complex conjugates
            u = math.copysign(abs(-q/2 + math.sqrt(delta))**(1/3), -q/2 + math.sqrt(delta))
            v = math.copysign(abs(-q/2 - math.sqrt(delta))**(1/3), -q/2 - math.sqrt(delta))
            t1 = u + v
            r1 = t1 + shift
            real_part = -(u + v) / 2 + shift
            imag_part = math.sqrt(3) / 2 * abs(u - v)
            return {
                "success": True,
                "type": "one_real_two_complex",
                "real_roots": [r1],
                "complex_roots": [complex(real_part, imag_part), complex(real_part, -imag_part)],
                "solution_str": f"x₁ = {r1:.6g}, x₂,₃ = {real_part:.6g} ± {imag_part:.6g}i"
            }
        elif abs(delta) <= 1e-14:
            # All real roots, at least two equal
            u = math.copysign(abs(-q/2)**(1/3), -q/2)
            t1 = 2 * u
            t2 = -u
            return {
                "success": True,
                "type": "all_real_repeated",
                "real_roots": [t1 + shift, t2 + shift, t2 + shift],
                "solution_str": f"x₁ = {t1+shift:.6g}, x₂,₃ = {t2+shift:.6g}"
            }
        else:
            # Three distinct real roots (casus irreducibilis)
            r = math.sqrt(-p**3 / 27)
            phi = math.acos(-q / (2 * r))
            m = 2 * math.sqrt(-p / 3)
            r1 = m * math.cos(phi / 3) + shift
            r2 = m * math.cos((phi + 2 * math.pi) / 3) + shift
            r3 = m * math.cos((phi + 4 * math.pi) / 3) + shift
            return {
                "success": True,
                "type": "three_real",
                "real_roots": [r1, r2, r3],
                "solution_str": f"x₁ = {r1:.6g}, x₂ = {r2:.6g}, x₃ = {r3:.6g}"
            }

    @staticmethod
    def solve_system_2x2(a1: float, b1: float, c1: float, a2: float, b2: float, c2: float) -> Dict[str, Any]:
        """Solves a1*x + b1*y = c1, a2*x + b2*y = c2 using Cramer's Rule"""
        det = a1 * b2 - a2 * b1
        det_x = c1 * b2 - c2 * b1
        det_y = a1 * c2 - a2 * c1

        steps = [
            f"Equation 1: {a1}x + {b1}y = {c1}",
            f"Equation 2: {a2}x + {b2}y = {c2}",
            f"Main Determinant D = |{a1}  {b1}| = {a1}*{b2} - {a2}*{b1} = {det:.6g}",
            f"                   |{a2}  {b2}|",
            f"Dx = |{c1}  {b1}| = {det_x:.6g}",
            f"     |{c2}  {b2}|",
            f"Dy = |{a1}  {c1}| = {det_y:.6g}",
            f"     |{a2}  {c2}|"
        ]

        if abs(det) < 1e-14:
            if abs(det_x) < 1e-14 and abs(det_y) < 1e-14:
                return {"success": True, "type": "infinite", "solution_str": "Infinite solutions (dependent lines)", "steps": steps}
            return {"success": False, "type": "inconsistent", "error": "No solution (parallel lines)", "steps": steps}

        x = det_x / det
        y = det_y / det
        steps.append(f"x = Dx / D = {det_x:.6g} / {det:.6g} = {x:.6g}")
        steps.append(f"y = Dy / D = {det_y:.6g} / {det:.6g} = {y:.6g}")

        return {
            "success": True,
            "type": "unique",
            "x": x,
            "y": y,
            "solution_str": f"x = {x:.6g}, y = {y:.6g}",
            "steps": steps
        }
