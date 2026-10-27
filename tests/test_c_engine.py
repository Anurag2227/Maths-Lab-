"""
Unit tests for C Numerical Engine & Fallback Operations
"""

import unittest
from src.c_engine import c_engine

class TestCEngine(unittest.TestCase):
    def test_arithmetic(self):
        self.assertAlmostEqual(c_engine.add(3.5, 4.5), 8.0)
        self.assertAlmostEqual(c_engine.sub(10.0, 3.2), 6.8)
        self.assertAlmostEqual(c_engine.mul(4.0, 2.5), 10.0)
        self.assertAlmostEqual(c_engine.div(15.0, 3.0), 5.0)

    def test_powers_and_factorials(self):
        self.assertAlmostEqual(c_engine.power(2.0, 5.0), 32.0)
        self.assertAlmostEqual(c_engine.factorial(5), 120.0)
        self.assertAlmostEqual(c_engine.combination(5, 2), 10.0)
        self.assertAlmostEqual(c_engine.permutation(5, 2), 20.0)

    def test_poly_integration(self):
        # Integral of 3x^2 from 0 to 2 is x^3|_0^2 = 8
        coeffs = [0.0, 0.0, 3.0]
        res = c_engine.simpson_integrate_poly(coeffs, 0.0, 2.0, intervals=100)
        self.assertAlmostEqual(res, 8.0, places=4)

    def test_root_finding(self):
        # f(x) = x^2 - 4, root at x = 2
        coeffs = [-4.0, 0.0, 1.0]
        root, iters, status = c_engine.newton_raphson_poly(coeffs, x0=3.0)
        self.assertEqual(status, 0)
        self.assertAlmostEqual(root, 2.0, places=5)

if __name__ == '__main__':
    unittest.main()
