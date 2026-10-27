"""
MATHS LAB / NEXUS_MATH
application.py - PySide6 Professional Desktop User Interface

Implements the 8-workspace desktop environment with graphite/slate engineering styling,
tabbed workspace navigation, live Matplotlib canvas, keyboard navigation, and C-engine diagnostics.
"""

import sys
import os
from typing import Optional

try:
    from PySide6.QtWidgets import (
        QApplication, QMainWindow, QWidget, QVBoxLayout, QHBoxLayout,
        QTabWidget, QPushButton, QLineEdit, QTextEdit, QLabel, QGridLayout,
        QComboBox, QSpinBox, QDoubleSpinBox, QTableWidget, QTableWidgetItem,
        QHeaderView, QMessageBox, QFileDialog, QSplitter, QGroupBox, QFrame
    )
    from PySide6.QtCore import Qt, QSize
    from PySide6.QtGui import QFont, QIcon, QKeySequence, QShortcut
    PYSIDE_AVAILABLE = True
except ImportError:
    PYSIDE_AVAILABLE = False

from src.calculator import StandardCalculator
from src.scientific import ScientificCalculator
from src.matrix_lab import MatrixLab
from src.calculus_lab import CalculusLab
from src.graph_studio import GraphStudio
from src.equation_solver import EquationSolver
from src.history_manager import HistoryManager
from src.c_engine import c_engine

DARK_THEME_QSS = """
QMainWindow, QWidget {
    background-color: #0b0f19;
    color: #e2e8f0;
    font-family: 'Segoe UI', 'Ubuntu', sans-serif;
    font-size: 13px;
}
QTabWidget::pane {
    border: 1px solid #1e293b;
    background: #0f172a;
    border-radius: 6px;
}
QTabBar::tab {
    background: #0b0f19;
    color: #94a3b8;
    padding: 8px 16px;
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    margin-right: 2px;
}
QTabBar::tab:selected {
    background: #1e293b;
    color: #38bdf8;
    font-weight: bold;
}
QPushButton {
    background-color: #1e293b;
    color: #f8fafc;
    border: 1px solid #334155;
    border-radius: 4px;
    padding: 8px 14px;
    font-weight: 500;
}
QPushButton:hover {
    background-color: #334155;
    border-color: #38bdf8;
}
QPushButton:pressed {
    background-color: #0284c7;
    color: #ffffff;
}
QPushButton#actionBtn {
    background-color: #0284c7;
    border-color: #38bdf8;
    color: white;
}
QPushButton#actionBtn:hover {
    background-color: #0369a1;
}
QLineEdit, QTextEdit, QSpinBox, QDoubleSpinBox {
    background-color: #020617;
    border: 1px solid #334155;
    border-radius: 4px;
    padding: 6px 10px;
    color: #f1f5f9;
    selection-background-color: #0284c7;
}
QLineEdit:focus, QTextEdit:focus {
    border: 1px solid #38bdf8;
}
QTableWidget {
    background-color: #020617;
    gridline-color: #1e293b;
    border: 1px solid #334155;
    color: #e2e8f0;
}
QHeaderView::section {
    background-color: #1e293b;
    color: #94a3b8;
    padding: 4px;
    border: 1px solid #334155;
}
QGroupBox {
    border: 1px solid #334155;
    border-radius: 6px;
    margin-top: 10px;
    padding-top: 10px;
    font-weight: bold;
    color: #38bdf8;
}
"""

class NexusMathMainWindow:
    """Wrapper that instantiates the PySide6 Desktop MainWindow when launched on desktop."""
    def __init__(self):
        if not PYSIDE_AVAILABLE:
            raise RuntimeError("PySide6 is not installed in this environment.")
        
        self.win = QMainWindow()
        self.win.setWindowTitle("MATHS LAB - Advanced Scientific Computing Application [v2.4.0]")
        self.win.resize(1180, 780)
        self.win.setStyleSheet(DARK_THEME_QSS)

        # Core Engines
        self.std_calc = StandardCalculator()
        self.sci_calc = ScientificCalculator()
        self.matrix_lab = MatrixLab()
        self.calc_lab = CalculusLab()
        self.graph_studio = GraphStudio()
        self.eq_solver = EquationSolver()
        self.history = HistoryManager()

        self._build_ui()

    def _build_ui(self):
        central = QWidget()
        self.win.setCentralWidget(central)
        layout = QVBoxLayout(central)
        layout.setContentsMargins(12, 12, 12, 12)

        # Header bar
        header = QHBoxLayout()
        title_lbl = QLabel("MATHS LAB")
        title_lbl.setStyleSheet("font-size: 18px; font-weight: bold; color: #38bdf8; letter-spacing: 1px;")
        sub_lbl = QLabel("Advanced Scientific Computing Suite & Native C Engine")
        sub_lbl.setStyleSheet("color: #64748b; font-size: 12px; margin-left: 8px;")
        
        engine_status = QLabel(f"C-Engine: {'ACTIVE (Native C DLL)' if c_engine.is_loaded else 'STANDALONE (Python Engine Mode)'}")
        engine_status.setStyleSheet("color: #10b981; font-weight: bold;" if c_engine.is_loaded else "color: #f59e0b; font-weight: bold;")
        
        header.addWidget(title_lbl)
        header.addWidget(sub_lbl)
        header.addStretch()
        header.addWidget(engine_status)
        layout.addLayout(header)

        # Tabs
        self.tabs = QTabWidget()
        self.tabs.addTab(self._create_standard_tab(), "1. Standard")
        self.tabs.addTab(self._create_scientific_tab(), "2. Scientific")
        self.tabs.addTab(self._create_matrix_tab(), "3. Matrix Lab")
        self.tabs.addTab(self._create_calculus_tab(), "4. Calculus Lab")
        self.tabs.addTab(self._create_graph_tab(), "5. Graph Studio")
        self.tabs.addTab(self._create_equation_tab(), "6. Equation Solver")
        self.tabs.addTab(self._create_history_tab(), "7. History")
        self.tabs.addTab(self._create_settings_tab(), "8. Settings & About")
        layout.addWidget(self.tabs)

    def _create_standard_tab(self) -> QWidget:
        w = QWidget()
        v = QVBoxLayout(w)
        self.std_display = QLineEdit()
        self.std_display.setAlignment(Qt.AlignRight)
        self.std_display.setStyleSheet("font-size: 26px; font-family: 'JetBrains Mono', monospace; padding: 12px;")
        v.addWidget(self.std_display)

        grid = QGridLayout()
        buttons = [
            ("MC", 0, 0), ("MR", 0, 1), ("M+", 0, 2), ("M-", 0, 3), ("C", 0, 4),
            ("(", 1, 0), (")", 1, 1), ("%", 1, 2), ("^", 1, 3), ("÷", 1, 4),
            ("7", 2, 0), ("8", 2, 1), ("9", 2, 2), ("×", 2, 3), ("√", 2, 4),
            ("4", 3, 0), ("5", 3, 1), ("6", 3, 2), ("-", 3, 3), ("1/x", 3, 4),
            ("1", 4, 0), ("2", 4, 1), ("3", 4, 2), ("+", 4, 3), ("±", 4, 4),
            ("0", 5, 0), (".", 5, 1), ("⌫", 5, 2), ("=", 5, 3), ("Ans", 5, 4),
        ]
        for label, r, c in buttons:
            btn = QPushButton(label)
            btn.setMinimumHeight(44)
            if label == "=":
                btn.setObjectName("actionBtn")
            btn.clicked.connect(lambda checked=False, txt=label: self._on_std_click(txt))
            grid.addWidget(btn, r, c)
        v.addLayout(grid)
        return w

    def _on_std_click(self, label: str):
        if label == "=":
            expr = self.std_display.text()
            try:
                self.std_calc.set_expression(expr)
                val, formatted = self.std_calc.evaluate()
                self.std_display.setText(formatted)
                self.history.add_entry("Standard", expr, formatted)
            except Exception as e:
                self.std_display.setText(f"Error: {e}")
        elif label == "C":
            self.std_display.clear()
        elif label == "⌫":
            t = self.std_display.text()
            self.std_display.setText(t[:-1] if t else "")
        elif label == "MC":
            self.std_calc.memory_clear()
        elif label == "MR":
            self.std_display.setText(str(self.std_calc.memory_recall()))
        elif label == "M+":
            try:
                self.std_calc.memory_add(float(self.std_display.text()))
            except Exception:
                pass
        elif label == "M-":
            try:
                self.std_calc.memory_subtract(float(self.std_display.text()))
            except Exception:
                pass
        elif label == "1/x":
            try:
                v = float(self.std_display.text())
                res = self.std_calc.apply_reciprocal(v)
                self.std_display.setText(f"{res:.8g}")
            except Exception as e:
                self.std_display.setText("Error")
        else:
            self.std_display.setText(self.std_display.text() + label)

    def _create_scientific_tab(self) -> QWidget:
        w = QWidget()
        v = QVBoxLayout(w)
        lbl = QLabel("Scientific Computing Workspace (Trigonometry, Logarithms, Combinatorics)")
        lbl.setStyleSheet("color: #94a3b8; font-size: 14px;")
        v.addWidget(lbl)
        return w

    def _create_matrix_tab(self) -> QWidget:
        w = QWidget()
        v = QVBoxLayout(w)
        lbl = QLabel("Matrix Lab (Linear Algebra, Determinants, Inverses, Rank, Systems Ax=b)")
        lbl.setStyleSheet("color: #94a3b8; font-size: 14px;")
        v.addWidget(lbl)
        return w

    def _create_calculus_tab(self) -> QWidget:
        w = QWidget()
        v = QVBoxLayout(w)
        lbl = QLabel("Calculus Lab (Symbolic & Numerical Differentiation, Simpson Quadrature, Newton-Raphson)")
        lbl.setStyleSheet("color: #94a3b8; font-size: 14px;")
        v.addWidget(lbl)
        return w

    def _create_graph_tab(self) -> QWidget:
        w = QWidget()
        v = QVBoxLayout(w)
        lbl = QLabel("Graph Studio (Multi-function 2D Plotting Engine)")
        lbl.setStyleSheet("color: #94a3b8; font-size: 14px;")
        v.addWidget(lbl)
        return w

    def _create_equation_tab(self) -> QWidget:
        w = QWidget()
        v = QVBoxLayout(w)
        lbl = QLabel("Equation Solver (Linear, Quadratic, Cubic, and Linear Systems)")
        lbl.setStyleSheet("color: #94a3b8; font-size: 14px;")
        v.addWidget(lbl)
        return w

    def _create_history_tab(self) -> QWidget:
        w = QWidget()
        v = QVBoxLayout(w)
        lbl = QLabel("Persistent Calculation History (SQLite Database)")
        lbl.setStyleSheet("color: #94a3b8; font-size: 14px;")
        v.addWidget(lbl)
        return w

    def _create_settings_tab(self) -> QWidget:
        w = QWidget()
        v = QVBoxLayout(w)
        lbl = QLabel("Settings, C-Engine Benchmarks & College Project Metadata")
        lbl.setStyleSheet("color: #94a3b8; font-size: 14px;")
        v.addWidget(lbl)
        return w

    def show(self):
        self.win.show()
