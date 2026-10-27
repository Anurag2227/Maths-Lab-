import React from 'react';
import { 
  Calculator, 
  Binary, 
  Grid3X3, 
  TrendingUp, 
  Activity, 
  Equal, 
  History, 
  Settings, 
  Download,
  Cpu
} from 'lucide-react';
import { downloadProjectZip } from '../engine/exportZip';

export type WorkspaceTab = 
  | 'standard' 
  | 'scientific' 
  | 'matrix' 
  | 'calculus' 
  | 'graph' 
  | 'equations' 
  | 'history' 
  | 'settings';

interface HeaderProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  angleUnit: 'radians' | 'degrees';
  onToggleAngleUnit: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  angleUnit,
  onToggleAngleUnit,
  historyCount
}) => {
  const tabs: Array<{ id: WorkspaceTab; label: string; icon: React.ReactNode }> = [
    { id: 'standard', label: 'Standard', icon: <Calculator className="w-4 h-4" /> },
    { id: 'scientific', label: 'Scientific', icon: <Binary className="w-4 h-4" /> },
    { id: 'matrix', label: 'Matrix Lab', icon: <Grid3X3 className="w-4 h-4" /> },
    { id: 'calculus', label: 'Calculus Lab', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'graph', label: 'Graph Studio', icon: <Activity className="w-4 h-4" /> },
    { id: 'equations', label: 'Equations', icon: <Equal className="w-4 h-4" /> },
    { id: 'history', label: `History (${historyCount})`, icon: <History className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings & Package', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-200 select-none shrink-0">
      {/* Top Application Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded bg-sky-500/10 border border-sky-500/30 text-sky-400 font-bold text-base tracking-wider font-mono">
            NL
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-100 tracking-wide text-sm font-mono">
                MATHS LAB
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                v2.4.0-RELEASE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Professional Scientific Computing Suite & Native C Engine Workstation
            </p>
          </div>
        </div>

        {/* Action Badges & Buttons */}
        <div className="flex items-center gap-2">
          {/* C-Engine Badge */}
          <div 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] text-emerald-400 cursor-pointer hover:border-emerald-500/40 transition-colors"
            title="Native C numerical engine active with SIMD & Richardson extrapolation"
            onClick={() => onSelectTab('settings')}
          >
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono font-medium">C-ENGINE ACTIVE</span>
          </div>

          {/* Angle Unit Toggle */}
          <button
            onClick={onToggleAngleUnit}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono font-medium text-slate-200 border border-slate-700 transition-colors"
            title="Toggle Trigonometric Angle Mode"
          >
            {angleUnit === 'radians' ? 'RAD' : 'DEG'}
          </button>

          {/* Download Windows Package Button */}
          <button
            onClick={downloadProjectZip}
            className="flex items-center gap-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-medium border border-sky-400/40 shadow-sm transition-all"
            title="Download full project source code, C engine, and build_exe.bat package"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Download Windows Package</span>
            <span className="md:hidden">EXE Pkg</span>
          </button>
        </div>
      </div>

      {/* Workspace Navigation Tabs */}
      <nav className="flex items-center px-2 overflow-x-auto scrollbar-none bg-slate-950/70">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? 'border-sky-500 text-sky-400 bg-slate-900/80 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
