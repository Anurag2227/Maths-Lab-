import React, { useState } from 'react';
import { Trash2, Copy, Download, Search, Check, RefreshCw } from 'lucide-react';

export interface HistoryItem {
  id: string;
  timestamp: string;
  workspace: string;
  expression: string;
  result: string;
}

interface HistoryWorkspaceProps {
  history: HistoryItem[];
  onClearHistory: () => void;
  onDeleteEntry: (id: string) => void;
  onRestoreExpression?: (expr: string) => void;
}

export const HistoryWorkspace: React.FC<HistoryWorkspaceProps> = ({
  history,
  onClearHistory,
  onDeleteEntry,
  onRestoreExpression,
}) => {
  const [filterWorkspace, setFilterWorkspace] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = history.filter((item) => {
    const matchesWs = filterWorkspace === 'All' || item.workspace.toLowerCase() === filterWorkspace.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      item.expression.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.result.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWs && matchesSearch;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'MATHS_LAB_history.json';
    a.click();
  };

  const handleExportCSV = () => {
    let csv = 'Timestamp,Workspace,Expression,Result\n';
    history.forEach((h) => {
      csv += `"${h.timestamp}","${h.workspace}","${h.expression.replace(/"/g, '""')}","${h.result.replace(/"/g, '""')}"\n`;
    });
    const dataStr = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = 'MATHS_LAB_history.csv';
    a.click();
  };

  return (
    <div className="h-full flex flex-col p-4 max-w-5xl mx-auto space-y-4 overflow-hidden">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 shrink-0">
        <div>
          <h2 className="text-base font-semibold text-slate-100 font-mono">
            Calculation History & Session Logs
          </h2>
          <p className="text-xs text-slate-400">
            Persistent offline audit trail stored locally ({history.length} total entries)
          </p>
        </div>

        {/* Export / Clear buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-mono border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>
          <button
            onClick={onClearHistory}
            className="flex items-center gap-1.5 px-3 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded text-xs font-mono border border-rose-800/60 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search calculation or result..."
            className="w-full bg-slate-900 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs font-mono text-slate-100 focus:border-sky-500 focus:outline-none"
          />
        </div>

        {/* Workspace Pill Filters */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded border border-slate-800 text-xs font-mono">
          {['All', 'Standard', 'Scientific', 'Matrix', 'Calculus', 'Equations'].map((ws) => (
            <button
              key={ws}
              onClick={() => setFilterWorkspace(ws)}
              className={`px-2.5 py-1 rounded transition-colors ${
                filterWorkspace === ws ? 'bg-sky-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {ws}
            </button>
          ))}
        </div>
      </div>

      {/* History Items List */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-3 overflow-y-auto space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-mono text-xs">
            No calculation records found. Compute any expression in the workspaces to record it here!
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="p-3 bg-slate-950 border border-slate-800/80 rounded hover:border-slate-700 transition-colors flex items-center justify-between gap-4 font-mono text-xs"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span className="text-sky-400 font-semibold">{item.workspace}</span>
                  <span>·</span>
                  <span>{item.timestamp}</span>
                </div>
                <div className="text-slate-300 truncate font-medium">
                  {item.expression}
                </div>
                <div className="text-emerald-400 font-bold truncate text-sm">
                  = {item.result}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleCopy(item.id, item.result)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-900"
                  title="Copy Result"
                >
                  {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => onDeleteEntry(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-900"
                  title="Delete Entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
