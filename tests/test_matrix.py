"""
Unit tests for Matrix Lab & Linear Algebra
"""

import unittest
from src.matrix_lab import MatrixLab

class TestMatrixLab(unittest.TestCase):
    def test_matrix_add(self):
        A = [[1, 2], [3, 4]]
        B = [[5, 6], [7, 8]]
        C = MatrixLab.add(A, B)
        self.assertEqual(C, [[6, 8], [10, 12]])

    def test_matrix_mul(self):
        A = [[1, 2], [3, 4]]
        B = [[2, 0], [1, 2]]
        C = MatrixLab.multiply(A, B)
        self.assertEqual(C, [[4, 4], [10, 8]])

    def test_determinant(self):
        A = [[1, 2], [3, 4]]
        det = MatrixLab.determinant(A)
        self.assertAlmostEqual(det, -2.0)

    def test_inverse(self):
        A = [[4, 7], [2, 6]]
        inv = MatrixLab.inverse(A)
        ident = MatrixLab.multiply(A, inv)
        for i in range(2):
            for j in range(2):
                expected = 1.0 if i == j else 0.0
                self.assertAlmostEqual(ident[i][j], expected, places=5)

    def test_singular_matrix(self):
        singular = [[1, 2], [2, 4]]
        with self.assertRaises(ValueError):
            MatrixLab.inverse(singular)

    def test_linear_system(self):
        # 2x + y = 5, x + 3y = 10 -> x = 1, y = 3
        A = [[2, 1], [1, 3]]
        b = [5, 10]
        x = MatrixLab.solve_system(A, b)
        self.assertAlmostEqual(x[0], 1.0)
        self.assertAlmostEqual(x[1], 3.0)

if __name__ == '__main__':
    unittest.main()
