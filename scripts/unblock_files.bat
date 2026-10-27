@echo off
echo ====================================================================
echo   MATHS LAB - Windows Mark-of-the-Web (SmartScreen) Unblocker
echo ====================================================================
echo Removing Windows download block (Zone.Identifier) from all project files...

powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -Path '%~dp0..' -Recurse | Unblock-File"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [SUCCESS] All files unblocked successfully!
    echo You can now run build_exe.bat or NEXUS_MATH.exe without SmartScreen blocks.
) else (
    echo.
    echo [NOTE] If you saw an error, you can manually unblock:
    echo 1. Right-click the downloaded .zip or .exe file
    echo 2. Click Properties -> Check 'Unblock' at the bottom -> Click OK.
)
echo.
pause
