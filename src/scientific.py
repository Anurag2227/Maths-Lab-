"""
MATHS LAB / NEXUS_MATH
scientific.py - Scientific Computing & Advanced Function Engine

Manages trigonometric (deg/rad), hyperbolic, logarithmic, combinatoric,
and higher-order polynomial function evaluation backed by C-engine routines.
"""

import math
from typing import Dict, Any, Tuple
from src.expression_parser import SafeExpressionParser
from src.c_engine import c_engine

class ScientificCalculator:
    def __init__(self, angle_unit: str = "radians"):
        self.angle_unit = angle_unit
        self.parser = SafeExpressionParser(angle_unit=angle_unit)
        self.precision: int = 12

    def set_angle_unit(self, unit: str):
        self.angle_unit = unit.lower()
        self.parser.angle_unit = self.angle_unit

    def set_precision(self, prec: int):
        self.precision = max(2, min(20, prec))

    def evaluate_expression(self, expr: str) -> Tuple[float, str]:
        val = self.parser.evaluate(expr)
        val_float = float(val)
        if abs(val_float - round(val_float)) < 1e-12:
            formatted = str(int(round(val_float)))
        else:
            formatted = f"{val_float:.{self.precision}g}"
        return val_float, formatted

    # Combinatorics & Discrete Math
    def nPr(self, n: int, r: int) -> float:
        return c_engine.permutation(n, r)

    def nCr(self, n: int, r: int) -> float:
        return c_engine.combination(n, r)

    def factorial(self, n: int) -> float:
        return c_engine.factorial(n)

    # Powers & Roots
    def nth_root(self, val: float, n: float) -> float:
        if abs(n) < 1e-15:
            raise ZeroDivisionError("Root degree cannot be 0")
        if val < 0 and int(n) % 2 == 0:
            raise ValueError("Even root of negative number is complex")
        if val < 0:
            return -math.pow(-val, 1.0 / n)
        return math.pow(val, 1.0 / n)

    # Logarithms
    def log_base(self, val: float, base: float) -> float:
        if val <= 0:
            raise ValueError("Logarithm argument must be positive")
        if base <= 0 or abs(base - 1.0) < 1e-15:
            raise ValueError("Logarithm base must be positive and not equal to 1")
        return math.log(val) / math.log(base)
