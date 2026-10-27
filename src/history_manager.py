"""
MATHS LAB / NEXUS_MATH
history_manager.py - Persistent SQLite Calculation History Manager

Stores and retrieves chronological computation logs across all 8 workspaces,
allowing session persistence, formula restoration, and CSV/JSON export.
"""

import sqlite3
import os
import json
from datetime import datetime
from typing import List, Dict, Any, Optional

class HistoryManager:
    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            # Default to local app data / project root
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.db_path = os.path.join(base_dir, "nexus_math_history.db")
        else:
            self.db_path = db_path

        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS calculation_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    workspace TEXT NOT NULL,
                    expression TEXT NOT NULL,
                    result TEXT NOT NULL,
                    metadata_json TEXT
                )
            """)
            conn.commit()

    def add_entry(self, workspace: str, expression: str, result: str, metadata: Optional[Dict[str, Any]] = None) -> int:
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        meta_str = json.dumps(metadata) if metadata else "{}"
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO calculation_history (timestamp, workspace, expression, result, metadata_json)
                VALUES (?, ?, ?, ?, ?)
            """, (ts, workspace, expression, result, meta_str))
            conn.commit()
            return cursor.lastrowid

    def get_entries(self, limit: int = 100, workspace_filter: Optional[str] = None) -> List[Dict[str, Any]]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()
            if workspace_filter:
                cursor.execute("""
                    SELECT * FROM calculation_history 
                    WHERE workspace = ?
                    ORDER BY id DESC LIMIT ?
                """, (workspace_filter, limit))
            else:
                cursor.execute("""
                    SELECT * FROM calculation_history 
                    ORDER BY id DESC LIMIT ?
                """, (limit,))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

    def delete_entry(self, entry_id: int):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM calculation_history WHERE id = ?", (entry_id,))
            conn.commit()

    def clear_history(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM calculation_history")
            conn.commit()

    def export_json(self) -> str:
        entries = self.get_entries(limit=1000)
        return json.dumps(entries, indent=2)
