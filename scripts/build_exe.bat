@echo off
setlocal enabledelayedexpansion

echo ================================================================
echo   MATHS LAB - Standalone Windows Executable Packager
echo   Produces: release\NEXUS_MATH.exe
echo ================================================================

REM Step 1: Compile Native C Library
call scripts\build_c.bat

REM Step 2: Ensure PyInstaller is installed
pip show pyinstaller >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [Setup] Installing PyInstaller...
    pip install pyinstaller
)

REM Step 3: Run PyInstaller Build
echo [Build] Packaging complete standalone application...
pyinstaller --noconfirm --clean ^
    --name="NEXUS_MATH" ^
    --windowed ^
    --onedir ^
    --add-data="c_engine;c_engine" ^
    --add-data="release\math_engine.dll;." ^
    --hidden-import="PySide6" ^
    --hidden-import="numpy" ^
    --hidden-import="sympy" ^
    --hidden-import="matplotlib" ^
    --hidden-import="sqlite3" ^
    --distpath="release\dist" ^
    --workpath="release\build" ^
    main.py

if exist "release\dist\NEXUS_MATH\NEXUS_MATH.exe" (
    echo.
    echo ================================================================
    echo   BUILD SUCCESSFUL!
    echo   Standalone Distribution created at:
    echo   release\dist\NEXUS_MATH\NEXUS_MATH.exe
    echo ================================================================
    echo The application can be moved to any clean Windows PC.
    echo Double-click NEXUS_MATH.exe to launch immediately without Python or C compiler.
) else (
    echo [Error] Build did not produce expected output executable.
)
pause
