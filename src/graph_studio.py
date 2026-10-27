"""
MATHS LAB / NEXUS_MATH
graph_studio.py - 2D Mathematical Graphing Studio

Provides high-resolution mathematical plotting via Matplotlib, handling multiple
concurrent curves, asymptotes, discontinuities, range styling, and image export.
"""

from typing import List, Dict, Any, Tuple, Optional
import math
from src.expression_parser import SafeExpressionParser

class GraphStudio:
    def __init__(self):
        self.parser = SafeExpressionParser(angle_unit="radians")
        self.functions: List[Dict[str, Any]] = [
            {"id": "1", "expr": "sin(x)", "color": "#38bdf8", "visible": True},
            {"id": "2", "expr": "x^2 - 4", "color": "#34d399", "visible": False},
        ]
        self.x_min: float = -10.0
        self.x_max: float = 10.0
        self.y_min: float = -10.0
        self.y_max: float = 10.0
        self.points_count: int = 500

    def add_function(self, expr: str, color: str = "#38bdf8") -> str:
        fn_id = str(len(self.functions) + 1)
        self.functions.append({"id": fn_id, "expr": expr, "color": color, "visible": True})
        return fn_id

    def remove_function(self, fn_id: str):
        self.functions = [f for f in self.functions if f["id"] != fn_id]

    def set_visibility(self, fn_id: str, visible: bool):
        for f in self.functions:
            if f["id"] == fn_id:
                f["visible"] = visible

    def set_ranges(self, x_min: float, x_max: float, y_min: float, y_max: float):
        if x_min >= x_max:
            raise ValueError("X min must be strictly less than X max")
        if y_min >= y_max:
            raise ValueError("Y min must be strictly less than Y max")
        self.x_min = x_min
        self.x_max = x_max
        self.y_min = y_min
        self.y_max = y_max

    def generate_points(self, expr: str, points: int = 500) -> List[Tuple[float, Optional[float]]]:
        """Calculates (x, y) coordinates with automatic asymptote and NaN filtering."""
        step = (self.x_max - self.x_min) / max(10, points)
        data = []
        last_y = None

        for i in range(points + 1):
            x = self.x_min + i * step
            try:
                y = float(self.parser.evaluate(expr, variables={'x': x}))
                # Discontinuity filtering for steep vertical jumps (e.g., tan(x))
                if last_y is not None and abs(y - last_y) > (self.y_max - self.y_min) * 5:
                    data.append((x, None))
                elif math.isnan(y) or math.isinf(y):
                    data.append((x, None))
                else:
                    data.append((x, y))
                last_y = y
            except Exception:
                data.append((x, None))
                last_y = None

        return data
