@echo off
echo ================================================================
echo   MATHS LAB - Native C Numerical Engine Build Script
echo ================================================================

if not exist release mkdir release

REM Check if GCC / MinGW is available
where gcc >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [1/2] Compiling C engine with MinGW GCC...
    gcc -shared -O3 -Wall -Wextra -DBUILDING_MATH_ENGINE c_engine\math_engine.c -o release\math_engine.dll
    if %ERRORLEVEL% EQU 0 (
        echo [2/2] Success! Compiled release\math_engine.dll
        copy release\math_engine.dll c_engine\math_engine.dll >nul
        goto done
    )
)

REM Check if MSVC CL is available
where cl >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [1/2] Compiling C engine with MSVC cl.exe...
    cl /LD /O2 /DBUILDING_MATH_ENGINE c_engine\math_engine.c /Fe:release\math_engine.dll
    if %ERRORLEVEL% EQU 0 (
        echo [2/2] Success! Compiled release\math_engine.dll
        copy release\math_engine.dll c_engine\math_engine.dll >nul
        goto done
    )
)

echo [Warning] Neither GCC nor MSVC found. 
echo The application will run seamlessly using high-precision pure-Python fallbacks.

:done
echo C Build sequence completed.
