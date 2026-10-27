"""
Unit tests for Standard Calculator & Expression Parser
"""

import unittest
from src.calculator import StandardCalculator
from src.expression_parser import SafeExpressionParser

class TestStandardCalculator(unittest.TestCase):
    def setUp(self):
        self.calc = StandardCalculator()
        self.parser = SafeExpressionParser()

    def test_basic_arithmetic(self):
        self.assertEqual(self.parser.evaluate("2 + 3 * 4"), 14)
        self.assertEqual(self.parser.evaluate("(2 + 3) * 4"), 20)
        self.assertEqual(self.parser.evaluate("10 - 4 / 2"), 8)

    def test_powers_and_roots(self):
        self.assertEqual(self.parser.evaluate("2^3"), 8)
        self.assertEqual(self.parser.evaluate("sqrt(16)"), 4)

    def test_memory_functions(self):
        self.calc.memory_store(42.0)
        self.assertEqual(self.calc.memory_recall(), 42.0)
        self.calc.memory_add(8.0)
        self.assertEqual(self.calc.memory_recall(), 50.0)
        self.calc.memory_subtract(20.0)
        self.assertEqual(self.calc.memory_recall(), 30.0)
        self.calc.memory_clear()
        self.assertEqual(self.calc.memory_recall(), 0.0)

    def test_division_by_zero(self):
        with self.assertRaises(ZeroDivisionError):
            self.parser.evaluate("10 / 0")

    def test_syntax_safety(self):
        with self.assertRaises(ValueError):
            self.parser.evaluate("__import__('os').system('ls')")

if __name__ == '__main__':
    unittest.main()
