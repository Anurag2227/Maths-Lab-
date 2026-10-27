#!/usr/bin/env python3
"""
MATHS LAB / NEXUS_MATH
Desktop Application Entry Point

Launches the PySide6 standalone scientific computing desktop suite.
Can be executed directly via Python or compiled to standalone Windows EXE via PyInstaller.
"""

import sys
import os

# Ensure project root is in python path
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
if ROOT_DIR not in sys.path:
    sys.path.insert(0, ROOT_DIR)

from src.c_engine import c_engine

def main():
    print("=" * 60)
    print("  MATHS LAB - Advanced Scientific Computing Application")
    print(f"  Version: 2.4.0-RELEASE")
    print(f"  C-Engine Status: {'LOADED (Native C DLL)' if c_engine.is_loaded else 'PYTHON FALLBACK'}")
    print("=" * 60)

    try:
        from PySide6.QtWidgets import QApplication
        from src.application import NexusMathMainWindow
    except ImportError as e:
        print(f"\n[Notice] PySide6 GUI runtime not detected: {e}")
        print("To launch the GUI on desktop, install PySide6:")
        print("    pip install -r requirements.txt")
        print("\nOr build the standalone Windows executable with 1 click:")
        print("    scripts\\build_exe.bat")
        return 1

    app = QApplication(sys.argv)
    app.setApplicationName("MATHS LAB")
    app.setOrganizationName("Nexus Computing")

    window = NexusMathMainWindow()
    window.show()

    return app.exec()

if __name__ == "__main__":
    sys.exit(main())
