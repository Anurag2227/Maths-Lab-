"""
MATHS LAB / NEXUS_MATH
expression_parser.py - Safe AST-Based Mathematical Expression Parser

Parses and computes mathematical formulas using Python's AST without using eval().
Guarantees sandbox safety against arbitrary code execution while supporting full
algebraic hierarchy, trig, logarithms, and physical constants.
"""

import ast
import math
import operator
from typing import Dict, Any, Union

class SafeExpressionParser:
    def __init__(self, angle_unit: str = "radians"):
        self.angle_unit = angle_unit.lower()  # "radians" or "degrees"

        self.operators = {
            ast.Add: operator.add,
            ast.Sub: operator.sub,
            ast.Mult: operator.mul,
            ast.Div: operator.truediv,
            ast.FloorDiv: operator.floordiv,
            ast.Mod: operator.mod,
            ast.Pow: operator.pow,
            ast.USub: operator.neg,
            ast.UAdd: operator.pos,
        }

        self.constants = {
            'pi': math.pi,
            'PI': math.pi,
            'e': math.e,
            'E': math.e,
            'tau': math.tau,
            'phi': 1.618033988749895,
        }

    def _trig_in(self, x: float) -> float:
        if self.angle_unit == "degrees":
            return math.radians(x)
        return x

    def _trig_out(self, val: float) -> float:
        if self.angle_unit == "degrees":
            return math.degrees(val)
        return val

    def get_functions(self) -> Dict[str, Any]:
        return {
            'sin': lambda x: math.sin(self._trig_in(x)),
            'cos': lambda x: math.cos(self._trig_in(x)),
            'tan': lambda x: math.tan(self._trig_in(x)),
            'asin': lambda x: self._trig_out(math.asin(x)),
            'acos': lambda x: self._trig_out(math.acos(x)),
            'atan': lambda x: self._trig_out(math.atan(x)),
            'atan2': lambda y, x: self._trig_out(math.atan2(y, x)),
            'sinh': math.sinh,
            'cosh': math.cosh,
            'tanh': math.tanh,
            'asinh': math.asinh,
            'acosh': math.acosh,
            'atanh': math.atanh,
            'sqrt': math.sqrt,
            'cbrt': lambda x: math.copysign(abs(x) ** (1.0 / 3.0), x),
            'log': math.log,
            'ln': math.log,
            'log10': math.log10,
            'log2': math.log2,
            'exp': math.exp,
            'abs': abs,
            'floor': math.floor,
            'ceil': math.ceil,
            'round': round,
            'fact': math.factorial,
            'factorial': math.factorial,
            'rad': math.radians,
            'deg': math.degrees,
        }

    def preprocess(self, expr: str) -> str:
        s = expr.strip()
        # Replace common mathematical symbols
        s = s.replace('×', '*').replace('÷', '/').replace('^', '**')
        s = s.replace('π', 'pi').replace('√', 'sqrt')
        return s

    def evaluate(self, expr_str: str, variables: Dict[str, float] = None) -> Union[int, float]:
        if not expr_str or not expr_str.strip():
            raise ValueError("Empty mathematical expression")

        cleaned = self.preprocess(expr_str)
        try:
            tree = ast.parse(cleaned, mode='eval')
        except SyntaxError as e:
            raise ValueError(f"Syntax error in expression: {e.msg}")

        var_context = dict(self.constants)
        if variables:
            var_context.update(variables)

        fn_context = self.get_functions()

        return self._eval_node(tree.body, var_context, fn_context)

    def _eval_node(self, node: ast.AST, vars_dict: Dict[str, float], fns_dict: Dict[str, Any]):
        if isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float)):
                return node.value
            raise ValueError(f"Unsupported constant type: {type(node.value)}")

        if isinstance(node, ast.Name):
            name = node.id
            if name in vars_dict:
                return vars_dict[name]
            raise ValueError(f"Undefined variable or constant: '{name}'")

        if isinstance(node, ast.BinOp):
            left = self._eval_node(node.left, vars_dict, fns_dict)
            right = self._eval_node(node.right, vars_dict, fns_dict)
            op_type = type(node.op)
            if op_type in self.operators:
                if op_type == ast.Div and abs(right) < 1e-15:
                    raise ZeroDivisionError("Division by zero")
                if op_type == ast.Pow:
                    if left == 0 and right < 0:
                        raise ZeroDivisionError("Zero cannot be raised to negative power")
                    if abs(right) > 1000:
                        raise OverflowError("Exponent too large for numerical calculation")
                return self.operators[op_type](left, right)
            raise ValueError(f"Unsupported binary operator: {op_type}")

        if isinstance(node, ast.UnaryOp):
            operand = self._eval_node(node.operand, vars_dict, fns_dict)
            op_type = type(node.op)
            if op_type in self.operators:
                return self.operators[op_type](operand)
            raise ValueError(f"Unsupported unary operator: {op_type}")

        if isinstance(node, ast.Call):
            if isinstance(node.func, ast.Name):
                fn_name = node.func.id
                if fn_name in fns_dict:
                    args = [self._eval_node(arg, vars_dict, fns_dict) for arg in node.args]
                    return fns_dict[fn_name](*args)
                raise ValueError(f"Unknown function: '{fn_name}'")
            raise ValueError("Direct function calls only permitted")

        raise ValueError(f"Disallowed expression node: {type(node).__name__}")
