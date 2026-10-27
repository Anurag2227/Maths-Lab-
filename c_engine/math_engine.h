#ifndef MATH_ENGINE_H
#define MATH_ENGINE_H

#ifdef __cplusplus
extern "C" {
#endif

#if defined(_WIN32) || defined(__CYGWIN__)
  #ifdef BUILDING_MATH_ENGINE
    #define MATH_API __declspec(dllexport)
  #else
    #define MATH_API __declspec(dllimport)
  #endif
#else
  #if __GNUC__ >= 4
    #define MATH_API __attribute__((visibility("default")))
  #else
    #define MATH_API
  #endif
#endif

/* System & Version Information */
MATH_API const char* get_engine_version(void);
MATH_API int is_c_engine_active(void);

/* Fundamental High-Speed Arithmetic */
MATH_API double c_add(double a, double b);
MATH_API double c_sub(double a, double b);
MATH_API double c_mul(double a, double b);
MATH_API double c_div(double a, double b, int* error_code);
MATH_API double c_pow(double base, double exp, int* error_code);
MATH_API double c_factorial(int n, int* error_code);
MATH_API double c_permutation(int n, int r, int* error_code);
MATH_API double c_combination(int n, int r, int* error_code);

/* Polynomial & Function Evaluation */
MATH_API double c_eval_poly(const double* coeffs, int degree, double x);
MATH_API double c_eval_poly_derivative(const double* coeffs, int degree, double x);

/* Numerical Differentiation: 4th-order Central Difference with Richardson Extrapolation */
MATH_API double c_diff_4th_order(const double* coeffs, int degree, double x, double h);

/* Numerical Integration */
MATH_API double c_trapezoidal_rule(const double* coeffs, int degree, double a, double b, int intervals);
MATH_API double c_simpsons_rule(const double* coeffs, int degree, double a, double b, int intervals, int* error_code);
MATH_API double c_simpsons_38_rule(const double* coeffs, int degree, double a, double b, int intervals, int* error_code);
MATH_API double c_romberg_integration(const double* coeffs, int degree, double a, double b, int max_steps, double tol);

/* Root Finding Algorithms */
MATH_API double c_bisection_root(const double* coeffs, int degree, double a, double b, double tol, int max_iter, int* iters_out, int* status_out);
MATH_API double c_newton_raphson_root(const double* coeffs, int degree, double x0, double tol, int max_iter, int* iters_out, int* status_out);
MATH_API double c_secant_root(const double* coeffs, int degree, double x0, double x1, double tol, int max_iter, int* iters_out, int* status_out);

/* Linear Algebra & Matrix Engine (Row-Major 1D Arrays) */
MATH_API int c_matrix_add(const double* A, const double* B, double* C_out, int rows, int cols);
MATH_API int c_matrix_sub(const double* A, const double* B, double* C_out, int rows, int cols);
MATH_API int c_matrix_mul(const double* A, int rA, int cA, const double* B, int rB, int cB, double* C_out);
MATH_API int c_matrix_transpose(const double* A, int rows, int cols, double* T_out);
MATH_API double c_matrix_determinant(const double* A, int n, int* error_code);
MATH_API double c_matrix_trace(const double* A, int n);
MATH_API int c_matrix_inverse(const double* A, int n, double* Inv_out);
MATH_API int c_matrix_rank(const double* A, int rows, int cols);
MATH_API int c_solve_linear_system(const double* A, const double* b, int n, double* x_out);

/* Performance Benchmark Routine */
MATH_API double c_benchmark_simpson(int intervals, int repetitions);

#ifdef __cplusplus
}
#endif

#endif /* MATH_ENGINE_H */
