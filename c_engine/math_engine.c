/**
 * MATHS LAB / NEXUS_MATH - Native C Numerical Computation Engine
 * Module: math_engine.c
 * 
 * Provides native high-performance arithmetic, numerical differentiation,
 * composite Simpson/Trapezoidal/Romberg quadrature, Bisection & Newton-Raphson
 * root solvers, and Gaussian elimination linear algebra.
 */

#define BUILDING_MATH_ENGINE
#include "math_engine.h"

#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>
#include <float.h>

#define MATH_ENGINE_VERSION_STR "MATHS_LAB_C_ENGINE_v2.4.0_RELEASE"
#define EPSILON 1e-12

const char* get_engine_version(void) {
    return MATH_ENGINE_VERSION_STR;
}

int is_c_engine_active(void) {
    return 1;
}

double c_add(double a, double b) {
    return a + b;
}

double c_sub(double a, double b) {
    return a - b;
}

double c_mul(double a, double b) {
    return a * b;
}

double c_div(double a, double b, int* error_code) {
    if (fabs(b) < EPSILON) {
        if (error_code) *error_code = 1; /* Division by zero */
        return 0.0;
    }
    if (error_code) *error_code = 0;
    return a / b;
}

double c_pow(double base, double exp, int* error_code) {
    if (base < 0.0 && floor(exp) != exp) {
        if (error_code) *error_code = 2; /* Negative base with non-integer exponent */
        return 0.0;
    }
    if (base == 0.0 && exp < 0.0) {
        if (error_code) *error_code = 1; /* Division by zero (0^(-n)) */
        return 0.0;
    }
    if (error_code) *error_code = 0;
    return pow(base, exp);
}

double c_factorial(int n, int* error_code) {
    if (n < 0) {
        if (error_code) *error_code = 3; /* Negative factorial undefined */
        return 0.0;
    }
    if (n > 170) {
        if (error_code) *error_code = 4; /* Overflow 64-bit double limit */
        return INFINITY;
    }
    if (error_code) *error_code = 0;
    double res = 1.0;
    for (int i = 2; i <= n; i++) {
        res *= (double)i;
    }
    return res;
}

double c_permutation(int n, int r, int* error_code) {
    if (n < 0 || r < 0 || r > n) {
        if (error_code) *error_code = 5; /* Invalid parameters */
        return 0.0;
    }
    if (error_code) *error_code = 0;
    double res = 1.0;
    for (int i = 0; i < r; i++) {
        res *= (double)(n - i);
    }
    return res;
}

double c_combination(int n, int r, int* error_code) {
    if (n < 0 || r < 0 || r > n) {
        if (error_code) *error_code = 5;
        return 0.0;
    }
    if (r == 0 || r == n) {
        if (error_code) *error_code = 0;
        return 1.0;
    }
    if (r > n - r) r = n - r;
    if (error_code) *error_code = 0;
    double res = 1.0;
    for (int i = 1; i <= r; i++) {
        res = res * (double)(n - i + 1) / (double)i;
    }
    return res;
}

/* Horner's method polynomial evaluation: coeffs[0] + coeffs[1]*x + ... + coeffs[degree]*x^degree */
double c_eval_poly(const double* coeffs, int degree, double x) {
    if (!coeffs || degree < 0) return 0.0;
    double result = coeffs[degree];
    for (int i = degree - 1; i >= 0; i--) {
        result = result * x + coeffs[i];
    }
    return result;
}

double c_eval_poly_derivative(const double* coeffs, int degree, double x) {
    if (!coeffs || degree <= 0) return 0.0;
    double result = (double)degree * coeffs[degree];
    for (int i = degree - 1; i >= 1; i--) {
        result = result * x + (double)i * coeffs[i];
    }
    return result;
}

/* 4th-order central difference numerical differentiation:
   f'(x) approx (-f(x+2h) + 8f(x+h) - 8f(x-h) + f(x-2h)) / (12h) */
double c_diff_4th_order(const double* coeffs, int degree, double x, double h) {
    if (fabs(h) < 1e-15) h = 1e-5;
    double fm2 = c_eval_poly(coeffs, degree, x - 2.0 * h);
    double fm1 = c_eval_poly(coeffs, degree, x - h);
    double fp1 = c_eval_poly(coeffs, degree, x + h);
    double fp2 = c_eval_poly(coeffs, degree, x + 2.0 * h);
    return (-fp2 + 8.0 * fp1 - 8.0 * fm1 + fm2) / (12.0 * h);
}

/* Composite Trapezoidal Rule */
double c_trapezoidal_rule(const double* coeffs, int degree, double a, double b, int intervals) {
    if (intervals <= 0) intervals = 100;
    double h = (b - a) / (double)intervals;
    double sum = 0.5 * (c_eval_poly(coeffs, degree, a) + c_eval_poly(coeffs, degree, b));
    for (int i = 1; i < intervals; i++) {
        double x = a + i * h;
        sum += c_eval_poly(coeffs, degree, x);
    }
    return sum * h;
}

/* Composite Simpson's 1/3 Rule (intervals must be even) */
double c_simpsons_rule(const double* coeffs, int degree, double a, double b, int intervals, int* error_code) {
    if (intervals <= 0) intervals = 100;
    if (intervals % 2 != 0) intervals++; /* Force even */
    if (error_code) *error_code = 0;

    double h = (b - a) / (double)intervals;
    double sum = c_eval_poly(coeffs, degree, a) + c_eval_poly(coeffs, degree, b);

    for (int i = 1; i < intervals; i++) {
        double x = a + i * h;
        double fx = c_eval_poly(coeffs, degree, x);
        if (i % 2 == 1) {
            sum += 4.0 * fx;
        } else {
            sum += 2.0 * fx;
        }
    }
    return (h / 3.0) * sum;
}

/* Composite Simpson's 3/8 Rule */
double c_simpsons_38_rule(const double* coeffs, int degree, double a, double b, int intervals, int* error_code) {
    if (intervals <= 0) intervals = 99;
    while (intervals % 3 != 0) intervals++;
    if (error_code) *error_code = 0;

    double h = (b - a) / (double)intervals;
    double sum = c_eval_poly(coeffs, degree, a) + c_eval_poly(coeffs, degree, b);

    for (int i = 1; i < intervals; i++) {
        double x = a + i * h;
        double fx = c_eval_poly(coeffs, degree, x);
        if (i % 3 == 0) {
            sum += 2.0 * fx;
        } else {
            sum += 3.0 * fx;
        }
    }
    return (3.0 * h / 8.0) * sum;
}

/* Romberg Integration (Richardson extrapolation table) */
double c_romberg_integration(const double* coeffs, int degree, double a, double b, int max_steps, double tol) {
    if (max_steps <= 0 || max_steps > 15) max_steps = 10;
    if (tol <= 0.0) tol = 1e-8;

    double R[16][16];
    memset(R, 0, sizeof(R));

    /* First step: trapezoid with 1 interval */
    double h = b - a;
    R[0][0] = 0.5 * h * (c_eval_poly(coeffs, degree, a) + c_eval_poly(coeffs, degree, b));

    for (int i = 1; i < max_steps; i++) {
        h *= 0.5;
        double sum = 0.0;
        int n_pts = 1 << (i - 1);
        for (int k = 1; k <= n_pts; k++) {
            sum += c_eval_poly(coeffs, degree, a + (2 * k - 1) * h);
        }
        R[i][0] = 0.5 * R[i-1][0] + h * sum;

        for (int j = 1; j <= i; j++) {
            double factor = pow(4.0, j);
            R[i][j] = (factor * R[i][j-1] - R[i-1][j-1]) / (factor - 1.0);
        }

        if (fabs(R[i][i] - R[i-1][i-1]) < tol) {
            return R[i][i];
        }
    }
    return R[max_steps - 1][max_steps - 1];
}

/* Root Finding: Bisection Method */
double c_bisection_root(const double* coeffs, int degree, double a, double b, double tol, int max_iter, int* iters_out, int* status_out) {
    double fa = c_eval_poly(coeffs, degree, a);
    double fb = c_eval_poly(coeffs, degree, b);

    if (fa * fb > 0.0) {
        if (status_out) *status_out = -1; /* Root is not bracketed */
        if (iters_out) *iters_out = 0;
        return 0.0;
    }

    int iter = 0;
    double c = a;
    while ((b - a) / 2.0 > tol && iter < max_iter) {
        c = (a + b) / 2.0;
        double fc = c_eval_poly(coeffs, degree, c);
        if (fabs(fc) < EPSILON) break;
        if (fa * fc < 0.0) {
            b = c;
            fb = fc;
        } else {
            a = c;
            fa = fc;
        }
        iter++;
    }

    if (iters_out) *iters_out = iter;
    if (status_out) *status_out = 0; /* Success */
    return c;
}

/* Root Finding: Newton-Raphson Method */
double c_newton_raphson_root(const double* coeffs, int degree, double x0, double tol, int max_iter, int* iters_out, int* status_out) {
    double x = x0;
    int iter = 0;
    while (iter < max_iter) {
        double fx = c_eval_poly(coeffs, degree, x);
        double fpx = c_eval_poly_derivative(coeffs, degree, x);

        if (fabs(fpx) < 1e-14) {
            if (status_out) *status_out = -2; /* Derivative near zero */
            if (iters_out) *iters_out = iter;
            return x;
        }

        double dx = fx / fpx;
        x -= dx;
        iter++;

        if (fabs(dx) < tol) {
            if (status_out) *status_out = 0; /* Converged */
            if (iters_out) *iters_out = iter;
            return x;
        }
    }

    if (status_out) *status_out = 1; /* Reached max iterations */
    if (iters_out) *iters_out = iter;
    return x;
}

/* Root Finding: Secant Method */
double c_secant_root(const double* coeffs, int degree, double x0, double x1, double tol, int max_iter, int* iters_out, int* status_out) {
    int iter = 0;
    while (iter < max_iter) {
        double f0 = c_eval_poly(coeffs, degree, x0);
        double f1 = c_eval_poly(coeffs, degree, x1);

        if (fabs(f1 - f0) < 1e-14) {
            if (status_out) *status_out = -3; /* Flat denominator */
            if (iters_out) *iters_out = iter;
            return x1;
        }

        double x2 = x1 - f1 * (x1 - x0) / (f1 - f0);
        iter++;

        if (fabs(x2 - x1) < tol) {
            if (status_out) *status_out = 0;
            if (iters_out) *iters_out = iter;
            return x2;
        }

        x0 = x1;
        x1 = x2;
    }

    if (status_out) *status_out = 1;
    if (iters_out) *iters_out = iter;
    return x1;
}

/* Linear Algebra: Matrix Addition */
int c_matrix_add(const double* A, const double* B, double* C_out, int rows, int cols) {
    if (!A || !B || !C_out || rows <= 0 || cols <= 0) return -1;
    int size = rows * cols;
    for (int i = 0; i < size; i++) {
        C_out[i] = A[i] + B[i];
    }
    return 0;
}

/* Linear Algebra: Matrix Subtraction */
int c_matrix_sub(const double* A, const double* B, double* C_out, int rows, int cols) {
    if (!A || !B || !C_out || rows <= 0 || cols <= 0) return -1;
    int size = rows * cols;
    for (int i = 0; i < size; i++) {
        C_out[i] = A[i] - B[i];
    }
    return 0;
}

/* Linear Algebra: Matrix Multiplication A(rA x cA) * B(rB x cB) -> C(rA x cB) */
int c_matrix_mul(const double* A, int rA, int cA, const double* B, int rB, int cB, double* C_out) {
    if (!A || !B || !C_out || cA != rB || rA <= 0 || cA <= 0 || cB <= 0) return -1;
    for (int i = 0; i < rA; i++) {
        for (int j = 0; j < cB; j++) {
            double sum = 0.0;
            for (int k = 0; k < cA; k++) {
                sum += A[i * cA + k] * B[k * cB + j];
            }
            C_out[i * cB + j] = sum;
        }
    }
    return 0;
}

/* Linear Algebra: Transpose */
int c_matrix_transpose(const double* A, int rows, int cols, double* T_out) {
    if (!A || !T_out || rows <= 0 || cols <= 0) return -1;
    for (int i = 0; i < rows; i++) {
        for (int j = 0; j < cols; j++) {
            T_out[j * rows + i] = A[i * cols + j];
        }
    }
    return 0;
}

/* Linear Algebra: Determinant via Gaussian Elimination with Partial Pivoting */
double c_matrix_determinant(const double* A, int n, int* error_code) {
    if (!A || n <= 0) {
        if (error_code) *error_code = -1;
        return 0.0;
    }
    if (n == 1) {
        if (error_code) *error_code = 0;
        return A[0];
    }
    if (n == 2) {
        if (error_code) *error_code = 0;
        return A[0] * A[3] - A[1] * A[2];
    }

    double* M = (double*)malloc(n * n * sizeof(double));
    if (!M) {
        if (error_code) *error_code = -2;
        return 0.0;
    }
    memcpy(M, A, n * n * sizeof(double));

    double det = 1.0;
    for (int i = 0; i < n; i++) {
        /* Find pivot */
        int pivot = i;
        double max_val = fabs(M[i * n + i]);
        for (int r = i + 1; r < n; r++) {
            double val = fabs(M[r * n + i]);
            if (val > max_val) {
                max_val = val;
                pivot = r;
            }
        }

        if (max_val < 1e-14) {
            free(M);
            if (error_code) *error_code = 0;
            return 0.0; /* Singular */
        }

        if (pivot != i) {
            /* Swap rows */
            for (int c = 0; c < n; c++) {
                double tmp = M[i * n + c];
                M[i * n + c] = M[pivot * n + c];
                M[pivot * n + c] = tmp;
            }
            det = -det;
        }

        det *= M[i * n + i];

        for (int r = i + 1; r < n; r++) {
            double factor = M[r * n + i] / M[i * n + i];
            for (int c = i; c < n; c++) {
                M[r * n + c] -= factor * M[i * n + c];
            }
        }
    }

    free(M);
    if (error_code) *error_code = 0;
    return det;
}

double c_matrix_trace(const double* A, int n) {
    if (!A || n <= 0) return 0.0;
    double tr = 0.0;
    for (int i = 0; i < n; i++) {
        tr += A[i * n + i];
    }
    return tr;
}

/* Matrix Inversion using Gauss-Jordan with Augmented Matrix */
int c_matrix_inverse(const double* A, int n, double* Inv_out) {
    if (!A || !Inv_out || n <= 0) return -1;

    double* aug = (double*)malloc(n * 2 * n * sizeof(double));
    if (!aug) return -2;

    int cols = 2 * n;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            aug[i * cols + j] = A[i * n + j];
            aug[i * cols + (j + n)] = (i == j) ? 1.0 : 0.0;
        }
    }

    for (int i = 0; i < n; i++) {
        int pivot = i;
        double max_val = fabs(aug[i * cols + i]);
        for (int r = i + 1; r < n; r++) {
            double val = fabs(aug[r * cols + i]);
            if (val > max_val) {
                max_val = val;
                pivot = r;
            }
        }

        if (max_val < 1e-14) {
            free(aug);
            return -3; /* Singular matrix, non-invertible */
        }

        if (pivot != i) {
            for (int c = 0; c < cols; c++) {
                double tmp = aug[i * cols + c];
                aug[i * cols + c] = aug[pivot * cols + c];
                aug[pivot * cols + c] = tmp;
            }
        }

        double diag = aug[i * cols + i];
        for (int c = 0; c < cols; c++) {
            aug[i * cols + c] /= diag;
        }

        for (int r = 0; r < n; r++) {
            if (r != i) {
                double factor = aug[r * cols + i];
                for (int c = 0; c < cols; c++) {
                    aug[r * cols + c] -= factor * aug[i * cols + c];
                }
            }
        }
    }

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            Inv_out[i * n + j] = aug[i * cols + (j + n)];
        }
    }

    free(aug);
    return 0;
}

/* Matrix Rank via Row Echelon Form */
int c_matrix_rank(const double* A, int rows, int cols) {
    if (!A || rows <= 0 || cols <= 0) return 0;

    double* M = (double*)malloc(rows * cols * sizeof(double));
    if (!M) return 0;
    memcpy(M, A, rows * cols * sizeof(double));

    int rank = cols;
    for (int row = 0; row < rank; row++) {
        if (M[row * cols + row] != 0.0) {
            for (int col = 0; col < rows; col++) {
                if (col != row) {
                    double mult = M[col * cols + row] / M[row * cols + row];
                    for (int i = 0; i < rank; i++) {
                        M[col * cols + i] -= mult * M[row * cols + i];
                    }
                }
            }
        } else {
            int reduce = 1;
            for (int i = row + 1; i < rows; i++) {
                if (M[i * cols + row] != 0.0) {
                    for (int j = 0; j < rank; j++) {
                        double tmp = M[row * cols + j];
                        M[row * cols + j] = M[i * cols + j];
                        M[i * cols + j] = tmp;
                    }
                    reduce = 0;
                    break;
                }
            }
            if (reduce) {
                rank--;
                for (int i = 0; i < rows; i++) {
                    M[i * cols + row] = M[i * cols + rank];
                }
            }
            row--;
        }
    }
    free(M);
    return rank;
}

/* Linear System Solver: Ax = b (n x n) */
int c_solve_linear_system(const double* A, const double* b, int n, double* x_out) {
    if (!A || !b || !x_out || n <= 0) return -1;

    double* Inv = (double*)malloc(n * n * sizeof(double));
    if (!Inv) return -2;

    int inv_status = c_matrix_inverse(A, n, Inv);
    if (inv_status != 0) {
        free(Inv);
        return inv_status; /* Singular or invalid */
    }

    /* x = Inv * b */
    for (int i = 0; i < n; i++) {
        double sum = 0.0;
        for (int j = 0; j < n; j++) {
            sum += Inv[i * n + j] * b[j];
        }
        x_out[i] = sum;
    }

    free(Inv);
    return 0;
}

/* Performance benchmark: integrates f(x) = 3x^4 - 2x^2 + 5 from 0 to 10 repeatedly */
double c_benchmark_simpson(int intervals, int repetitions) {
    double coeffs[] = {5.0, 0.0, -2.0, 0.0, 3.0};
    int degree = 4;
    double last_res = 0.0;
    int err = 0;
    for (int r = 0; r < repetitions; r++) {
        last_res = c_simpsons_rule(coeffs, degree, 0.0, 10.0, intervals, &err);
    }
    return last_res;
}
