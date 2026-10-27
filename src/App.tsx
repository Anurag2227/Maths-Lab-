/**
 * MATHS LAB - Advanced Scientific Computing Workstation
 * Application Root Component
 */

import React, { useState, useEffect } from 'react';
import { Header, WorkspaceTab } from './components/Header';
import { StandardCalculator } from './components/StandardCalculator';
import { ScientificCalculator } from './components/ScientificCalculator';
import { MatrixLab } from './components/MatrixLab';
import { CalculusLab } from './components/CalculusLab';
import { GraphStudio } from './components/GraphStudio';
import { EquationSolver } from './components/EquationSolver';
import { HistoryWorkspace, HistoryItem } from './components/HistoryWorkspace';
import { SettingsAndAbout } from './components/SettingsAndAbout';

const LOCAL_STORAGE_HISTORY_KEY = 'nexus_maths_lab_history_v1';
const LOCAL_STORAGE_PREFS_KEY = 'nexus_maths_lab_prefs_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('standard');
  const [angleUnit, setAngleUnit] = useState<'radians' | 'degrees'>('radians');
  const [precision, setPrecision] = useState<number>(10);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load persistent history & prefs from localStorage
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      } else {
        // Sample starter calculations for college demo
        const initialSamples: HistoryItem[] = [
          {
            id: 'init-1',
            timestamp: new Date().toLocaleTimeString(),
            workspace: 'Calculus',
            expression: '∫[0, 2] (3x² - 2x + 5) dx',
            result: '14.000000',
          },
          {
            id: 'init-2',
            timestamp: new Date().toLocaleTimeString(),
            workspace: 'Matrix',
            expression: 'det(A) where A = [[2,1,-1],[-3,-1,2],[-2,1,2]]',
            result: '-1.000000',
          },
          {
            id: 'init-3',
            timestamp: new Date().toLocaleTimeString(),
            workspace: 'Equations',
            expression: 'x² - 5x + 6 = 0',
            result: 'x₁ = 3, x₂ = 2',
          },
        ];
        setHistory(initialSamples);
      }

      const storedPrefs = localStorage.getItem(LOCAL_STORAGE_PREFS_KEY);
      if (storedPrefs) {
        const parsed = JSON.parse(storedPrefs);
        if (parsed.angleUnit) setAngleUnit(parsed.angleUnit);
        if (parsed.precision) setPrecision(parsed.precision);
      }
    } catch {
      // Fallback
    }
  }, []);

  // Save history on change
  const saveHistoryToStorage = (updated: HistoryItem[]) => {
    setHistory(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleRecordHistory = (workspace: string, expression: string, result: string) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      workspace,
      expression,
      result,
    };
    saveHistoryToStorage([newItem, ...history]);
  };

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all calculation history?')) {
      saveHistoryToStorage([]);
    }
  };

  const handleDeleteEntry = (id: string) => {
    saveHistoryToStorage(history.filter((h) => h.id !== id));
  };

  const handleToggleAngleUnit = () => {
    const next = angleUnit === 'radians' ? 'degrees' : 'radians';
    setAngleUnit(next);
    try {
      localStorage.setItem(
        LOCAL_STORAGE_PREFS_KEY,
        JSON.stringify({ angleUnit: next, precision })
      );
    } catch {
      // ignore
    }
  };

  const handleUpdatePrecision = (newPrec: number) => {
    setPrecision(newPrec);
    try {
      localStorage.setItem(
        LOCAL_STORAGE_PREFS_KEY,
        JSON.stringify({ angleUnit, precision: newPrec })
      );
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      {/* Desktop Header and Tabs */}
      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        angleUnit={angleUnit}
        onToggleAngleUnit={handleToggleAngleUnit}
        historyCount={history.length}
      />

      {/* Main Workspace Frame with Contrasting Grey Studio Workbench */}
      <main className="flex-1 overflow-hidden workbench-bg relative">
        {activeTab === 'standard' && (
          <StandardCalculator
            onRecordHistory={handleRecordHistory}
            angleUnit={angleUnit}
          />
        )}

        {activeTab === 'scientific' && (
          <ScientificCalculator
            onRecordHistory={handleRecordHistory}
            angleUnit={angleUnit}
          />
        )}

        {activeTab === 'matrix' && (
          <MatrixLab onRecordHistory={handleRecordHistory} />
        )}

        {activeTab === 'calculus' && (
          <CalculusLab
            onRecordHistory={handleRecordHistory}
            angleUnit={angleUnit}
          />
        )}

        {activeTab === 'graph' && <GraphStudio />}

        {activeTab === 'equations' && (
          <EquationSolver onRecordHistory={handleRecordHistory} />
        )}

        {activeTab === 'history' && (
          <HistoryWorkspace
            history={history}
            onClearHistory={handleClearHistory}
            onDeleteEntry={handleDeleteEntry}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsAndAbout
            precision={precision}
            onUpdatePrecision={handleUpdatePrecision}
            angleUnit={angleUnit}
            onUpdateAngleUnit={setAngleUnit}
          />
        )}
      </main>

      {/* Engineering Status Footer */}
      <footer className="h-6 px-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 shrink-0">
        <div className="flex items-center gap-3">
          <span>Active: {activeTab.toUpperCase()}</span>
          <span>·</span>
          <span>Angle: {angleUnit.toUpperCase()}</span>
          <span>·</span>
          <span>Precision: {precision} Digits</span>
        </div>
        <div className="flex items-center gap-2">
          <span>MATHS LAB v2.4.0</span>
          <span>·</span>
          <span className="text-emerald-400">Offline Standalone Verified</span>
        </div>
      </footer>
    </div>
  );
}
