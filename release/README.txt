========================================================================
MATHS LAB - ADVANCED SCIENTIFIC COMPUTING SUITE
Version 2.4.0 (Windows Portable Standalone Release)
========================================================================

QUICK START INSTRUCTIONS:
-------------------------
1. No installation, Python, C compiler, or VS Code is required.
2. Double-click "NEXUS_MATH.exe" to launch MATHS LAB immediately.
3. The software runs completely offline with full mathematical capabilities.

========================================================================
HOW TO BYPASS WINDOWS SMARTSCREEN / SMART APP CONTROL:
========================================================================
Because this is an open-source academic application created without a $500/year 
commercial corporate digital certificate, Windows Defender SmartScreen or 
Windows 11 Smart App Control may display a blue warning:
"Windows protected your PC" or "Smart App Control blocked this app".

METHOD 1: SmartScreen "More Info" (Easiest - 2 Clicks)
------------------------------------------------------
1. On the blue "Windows protected your PC" popup, click the underlined text:
   "More info"
2. A new button will appear: Click "Run anyway".

METHOD 2: Unblock via File Properties (Permanent)
-------------------------------------------------
1. Right-click the downloaded NEXUS_MATH_PROJECT.zip (or NEXUS_MATH.exe).
2. Click "Properties".
3. Under the "General" tab at the bottom, look for "Security".
4. Check the box: [x] "Unblock".
5. Click "Apply", then "OK".
6. Extract and run freely!

METHOD 3: 1-Click Unblock Script (Automated)
--------------------------------------------
Double-click "scripts\unblock_files.bat".
This instantly strips the Windows internet zone identifier from all files.

METHOD 4: Windows 11 Smart App Control (If strictly locked)
-----------------------------------------------------------
If Windows 11 displays "Smart App Control blocked this app":
1. Open Windows Settings -> "Privacy & security" -> "Windows Security".
2. Click "App & browser control" -> "Smart App Control settings".
3. If set to "On" or "Evaluation", it blocks all unsigned custom and open-source EXEs.
   Set it to "Off" (or add the application folder to exclusions in Virus & threat protection).

========================================================================
BUILDING FROM SOURCE (OPTIONAL DEVELOPER MODE):
------------------------------------------------
If you want to recompile the C DLL and package the executable from source:
1. Run "scripts\build_exe.bat".
2. The executable will be generated at "release\dist\NEXUS_MATH\NEXUS_MATH.exe".
========================================================================
