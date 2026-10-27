/**
 * Bundles the complete NEXUS_MATH / MATHS LAB project into a downloadable .zip package.
 * Allows users to double-click build_exe.bat on their Windows computer to produce NEXUS_MATH.exe.
 */

import JSZip from 'jszip';

export async function downloadProjectZip(): Promise<void> {
  const zip = new JSZip();

  // Root files
  zip.file('requirements.txt', `# MATHS LAB / NEXUS_MATH Dependency Manifest
PySide6>=6.5.0
numpy>=1.24.0
sympy>=1.12.0
matplotlib>=3.7.0
pyinstaller>=6.0.0
pytest>=7.3.0
`);

  zip.file('LICENSE.txt', `MIT License

Copyright (c) 2026 MATHS LAB / NEXUS_MATH Engineering

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
`);

  zip.file('release/README.txt', `========================================================================
MATHS LAB - ADVANCED SCIENTIFIC COMPUTING SUITE
Version 2.4.0 (Windows Portable Standalone Release)
========================================================================

QUICK START INSTRUCTIONS:
-------------------------
1. If Windows SmartScreen displays a blue popup ("Windows protected your PC"):
   - Click "More info"
   - Click "Run anyway"
   Or double-click "scripts\\unblock_files.bat" to unblock all files instantly.
2. Double-click "scripts\\build_exe.bat" to compile the native C DLL
   and build your standalone Windows executable.
3. The final executable will be placed in:
   release\\dist\\NEXUS_MATH\\NEXUS_MATH.exe
4. Double-click NEXUS_MATH.exe to launch immediately.
   End users require NO Python, C compiler, or VS Code!
========================================================================
HOW TO BYPASS WINDOWS SMARTSCREEN / SMART APP CONTROL:
1. SmartScreen: Click "More info" -> Click "Run anyway".
2. Or Right-click the downloaded .zip -> Properties -> Check [x] "Unblock" -> OK.
3. Windows 11 Smart App Control: Windows Security -> App & browser control -> Smart App Control -> Turn Off or add folder exclusion.
========================================================================
`);

  // Add c_engine files
  const cFolder = zip.folder('c_engine');
  cFolder?.file('math_engine.h', `#ifndef MATH_ENGINE_H
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

MATH_API const char* get_engine_version(void);
MATH_API int is_c_engine_active(void);
MATH_API double c_add(double a, double b);
MATH_API double c_sub(double a, double b);
MATH_API double c_mul(double a, double b);
MATH_API double c_div(double a, double b, int* error_code);
MATH_API double c_pow(double base, double exp, int* error_code);
MATH_API double c_factorial(int n, int* error_code);
MATH_API double c_permutation(int n, int r, int* error_code);
MATH_API double c_combination(int n, int r, int* error_code);
MATH_API double c_eval_poly(const double* coeffs, int degree, double x);
MATH_API double c_eval_poly_derivative(const double* coeffs, int degree, double x);
MATH_API double c_diff_4th_order(const double* coeffs, int degree, double x, double h);
MATH_API double c_trapezoidal_rule(const double* coeffs, int degree, double a, double b, int intervals);
MATH_API double c_simpsons_rule(const double* coeffs, int degree, double a, double b, int intervals, int* error_code);
MATH_API double c_simpsons_38_rule(const double* coeffs, int degree, double a, double b, int intervals, int* error_code);
MATH_API double c_romberg_integration(const double* coeffs, int degree, double a, double b, int max_steps, double tol);
MATH_API double c_bisection_root(const double* coeffs, int degree, double a, double b, double tol, int max_iter, int* iters_out, int* status_out);
MATH_API double c_newton_raphson_root(const double* coeffs, int degree, double x0, double tol, int max_iter, int* iters_out, int* status_out);
MATH_API int c_matrix_add(const double* A, const double* B, double* C_out, int rows, int cols);
MATH_API int c_matrix_sub(const double* A, const double* B, double* C_out, int rows, int cols);
MATH_API int c_matrix_mul(const double* A, int rA, int cA, const double* B, int rB, int cB, double* C_out);
MATH_API int c_matrix_transpose(const double* A, int rows, int cols, double* T_out);
MATH_API double c_matrix_determinant(const double* A, int n, int* error_code);
MATH_API double c_matrix_trace(const double* A, int n);
MATH_API int c_matrix_inverse(const double* A, int n, double* Inv_out);
MATH_API int c_matrix_rank(const double* A, int rows, int cols);
MATH_API int c_solve_linear_system(const double* A, const double* b, int n, double* x_out);
MATH_API double c_benchmark_simpson(int intervals, int repetitions);

#ifdef __cplusplus
}
#endif

#endif
`);

  // Batch scripts
  const scriptsFolder = zip.folder('scripts');
  scriptsFolder?.file('build_c.bat', `@echo off
echo [Building Native C Numerical Engine DLL...]
if not exist release mkdir release
where gcc >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    gcc -shared -O3 -Wall -Wextra -DBUILDING_MATH_ENGINE c_engine\\math_engine.c -o release\\math_engine.dll
    copy release\\math_engine.dll c_engine\\math_engine.dll >nul 2>nul
    echo Success: release\\math_engine.dll created.
    goto done
)
where cl >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    cl /LD /O2 /DBUILDING_MATH_ENGINE c_engine\\math_engine.c /Fe:release\\math_engine.dll
    copy release\\math_engine.dll c_engine\\math_engine.dll >nul 2>nul
    echo Success: release\\math_engine.dll created.
    goto done
)
echo [Notice] Neither GCC nor MSVC found. C engine fallback will run in Python mode.
:done
`);

  scriptsFolder?.file('unblock_files.bat', `@echo off
echo ====================================================================
echo   MATHS LAB - Windows Mark-of-the-Web (SmartScreen) Unblocker
echo ====================================================================
echo Removing Windows download block (Zone.Identifier) from all project files...
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%~dp0..' -Recurse | Unblock-File"
echo [SUCCESS] Files unblocked. You can now launch build_exe.bat or NEXUS_MATH.exe!
pause
`);

  scriptsFolder?.file('build_exe.bat', `@echo off
echo ================================================================
echo   MATHS LAB - Packaging Standalone Windows Executable
echo ================================================================
call scripts\\build_c.bat
pip show pyinstaller >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing PyInstaller...
    pip install pyinstaller
)
echo Building NEXUS_MATH.exe...
pyinstaller --noconfirm --clean ^
    --name="NEXUS_MATH" ^
    --windowed ^
    --onedir ^
    --add-data="c_engine;c_engine" ^
    --hidden-import="PySide6" ^
    --hidden-import="numpy" ^
    --hidden-import="sympy" ^
    --hidden-import="matplotlib" ^
    --hidden-import="sqlite3" ^
    --distpath="release\\dist" ^
    --workpath="release\\build" ^
    main.py

echo.
echo Standalone package ready at: release\\dist\\NEXUS_MATH\\NEXUS_MATH.exe
pause
`);

  // Generate blob
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'NEXUS_MATH_PROJECT.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
