# MATHS LAB — Advanced Scientific Computing Application

**A Desktop Engineering Mathematics Suite with Native C Acceleration and Professional Qt/Web Interface**

---

## 1. Project Overview

MATHS LAB (also known as NEXUS_MATH) is a high-performance scientific computing workstation developed for engineering undergraduates and mathematical researchers. It bridges the numerical speed of compiled **C** with the symbolic and analytical flexibility of **Python**, packaged as an offline, standalone Windows executable (`NEXUS_MATH.exe`).

### Workspaces
1. **Standard Calculator**: Arithmetic precedence, parentheses, memory registers (MC, MR, M+, M-, MS), percentages, reciprocal.
2. **Scientific Calculator**: Trigonometry (Degrees/Radians), hyperbolic functions, natural & arbitrary base logarithms, factorials, permutations ($nPr$), combinations ($nCr$).
3. **Matrix Lab**: Dimensions from $1\times 1$ to $6\times 6$, determinants, Gauss-Jordan matrix inversion, rank, trace, matrix powers, and systems of linear equations ($Ax = b$).
4. **Calculus Lab**: Symbolic derivatives with $n$-th order selection, indefinite and definite integrals (SymPy), limits ($\lim_{x \to c}$), composite Simpson's 1/3 and 3/8 quadrature, and Newton-Raphson / Bisection root finding.
5. **Graph Studio**: Multi-curve 2D plotting with interactive coordinate tracker, asymptote/discontinuity handling, zoom/pan, and PNG export.
6. **Equation Solver**: Linear equations, quadratic equations with discriminant analysis and complex conjugate roots, cubic equations via Cardano's formula, and $2\times 2$ / $3\times 3$ linear systems with Cramer's Rule.
7. **Calculation History**: SQLite-backed persistent audit trail with formula restoration and JSON/CSV export.
8. **Settings & Diagnostics**: Precision configuration, angle mode, live C-engine benchmark suite, and full college project specifications.

---

## 2. Architecture & Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Native Compute Engine** | C99 (`c_engine/math_engine.c`) | Ultra-fast numerical quadrature, matrix operations, and iterative root finding. |
| **Desktop GUI** | PySide6 (Qt 6) | Native cross-platform desktop UI with hardware acceleration. |
| **Web Studio** | React 19 + TypeScript + Tailwind CSS | Instant browser preview and interactive client-side execution. |
| **Symbolic Math** | SymPy | Analytical differentiation, indefinite integration, limits. |
| **Numerical Arrays** | NumPy | High-performance vector math. |
| **Plotting Engine** | Matplotlib / HTML5 Canvas | Publication-quality 2D scientific plotting. |
| **Persistence** | SQLite3 / LocalStorage | Offline session retention without remote telemetry. |
| **Packaging** | PyInstaller + Inno Setup | Standalone `.exe` bundling with embedded DLLs and Python runtime. |

---

## 3. Building the Standalone Windows Executable

### Prerequisites (Developer's Machine Only)
- Windows 10/11 (64-bit)
- Python 3.9+ with pip
- MinGW GCC (`gcc.exe`) or Visual Studio Build Tools (`cl.exe`)

> **Note for End Users**: End users do **NOT** need Python, GCC, VS Code, or any dependencies. They simply double-click `NEXUS_MATH.exe`.

### 1-Click Automated Build
Run the automated script in the root directory:
```cmd
scripts\build_exe.bat
```

This script:
1. Compiles `c_engine/math_engine.c` into `release/math_engine.dll` using `-O3` optimization.
2. Invokes PyInstaller with `nexus_math.spec`.
3. Packages the Python runtime, PySide6 Qt libraries, SymPy, NumPy, Matplotlib, and C DLL into `release/dist/NEXUS_MATH/NEXUS_MATH.exe`.

---

## 4. Running Automated Tests

Run the complete test suite:
```bash
python3 -m unittest discover -s tests
```

---

## 5. License
MIT License - Open for academic evaluation, college projects, and scientific research.
