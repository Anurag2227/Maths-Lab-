"""
MATHS LAB / NEXUS_MATH
calculator.py - Standard Arithmetic & Desktop Calculator Engine

Implements arithmetic workflows, register memory (MC, MR, M+, M-, MS),
nested parentheses, percentages, reciprocal, square root, and history hooks.
"""

from typing import Optional, Tuple
from src.expression_parser import SafeExpressionParser
from src.c_engine import c_engine

class StandardCalculator:
    def __init__(self):
        self.parser = SafeExpressionParser(angle_unit="radians")
        self.memory: float = 0.0
        self.current_expression: str = ""
        self.last_result: Optional[float] = None

    def set_expression(self, expr: str):
        self.current_expression = expr

    def append(self, text: str):
        self.current_expression += text

    def backspace(self):
        if self.current_expression:
            self.current_expression = self.current_expression[:-1]

    def clear(self):
        self.current_expression = ""

    def clear_all(self):
        self.current_expression = ""
        self.last_result = None

    def evaluate(self, precision: int = 10) -> Tuple[float, str]:
        if not self.current_expression.strip():
            return 0.0, "0"

        # Safe evaluation
        res = self.parser.evaluate(self.current_expression)
        self.last_result = float(res)

        # Format clean string representation
        if abs(res - round(res)) < 1e-11:
            formatted = str(int(round(res)))
        else:
            formatted = f"{res:.{precision}g}"

        return self.last_result, formatted

    # Memory Operations
    def memory_clear(self):
        self.memory = 0.0

    def memory_recall(self) -> float:
        return self.memory

    def memory_add(self, val: Optional[float] = None):
        if val is None:
            val = self.last_result or 0.0
        self.memory = c_engine.add(self.memory, val)

    def memory_subtract(self, val: Optional[float] = None):
        if val is None:
            val = self.last_result or 0.0
        self.memory = c_engine.sub(self.memory, val)

    def memory_store(self, val: Optional[float] = None):
        if val is None:
            val = self.last_result or 0.0
        self.memory = float(val)

    # Fast Instant Unary Ops
    def apply_reciprocal(self, x: float) -> float:
        return c_engine.div(1.0, x)

    def apply_percent(self, base: float, percent: float) -> float:
        return c_engine.div(c_engine.mul(base, percent), 100.0)
