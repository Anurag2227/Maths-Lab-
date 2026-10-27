import React, { useState, useRef, useEffect, useCallback } from 'react';
import { mathCore } from '../engine/mathCore';
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Download,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Compass,
  AlertTriangle,
  Move
} from 'lucide-react';

interface PlotFunction {
  id: string;
  expr: string;
  color: string;
  visible: boolean;
}

const COLOR_PALETTE = ['#38bdf8', '#34d399', '#f43f5e', '#fbbf24', '#a855f7', '#ec4899'];

const PRESET_FUNCTIONS = [
  'sin(x)',
  'cos(x)',
  'x^2 - 4',
  '1/x',
  'e^x',
  'abs(x)',
  'x^3 - 3*x'
];

export const GraphStudio: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [functions, setFunctions] = useState<PlotFunction[]>([
    { id: '1', expr: 'sin(x)', color: '#38bdf8', visible: true },
    { id: '2', expr: 'cos(x)', color: '#34d399', visible: true },
    { id: '3', expr: 'x^2 / 4 - 3', color: '#fbbf24', visible: false },
  ]);

  const [newExpr, setNewExpr] = useState<string>('');
  const [inputError, setInputError] = useState<string | null>(null);

  // Angle unit for graphing: 'radians' (mathematical standard) or 'degrees'
  const [angleMode, setAngleMode] = useState<'radians' | 'degrees'>('radians');

  // Plot Ranges
  const [xMin, setXMin] = useState<number>(-10);
  const [xMax, setXMax] = useState<number>(10);
  const [yMin, setYMin] = useState<number>(-6);
  const [yMax, setYMax] = useState<number>(6);

  // Mouse interaction state (crosshair & pan)
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; xMin: number; xMax: number; yMin: number; yMax: number } | null>(null);

  // Render Graph on Canvas
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Determine dimensions with fallbacks
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(rect.width, canvas.clientWidth || 600);
    const height = Math.max(rect.height, canvas.clientHeight || 450);

    if (width <= 0 || height <= 0) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.floor(width * dpr) || canvas.height !== Math.floor(height * dpr)) {
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    // Coordinate conversion utilities
    const toScreenX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
    const toScreenY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;

    // Grid lines
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#1e293b';
    ctx.font = '10px monospace';
    ctx.fillStyle = '#64748b';

    // Grid X
    const xRange = Math.max(xMax - xMin, 1e-6);
    const xStep = Math.pow(10, Math.floor(Math.log10(xRange))) / (xRange > 20 ? 1 : 2);
    const startX = Math.floor(xMin / xStep) * xStep;

    for (let x = startX; x <= xMax; x += xStep) {
      const sx = toScreenX(x);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();

      if (Math.abs(x) > 1e-6) {
        ctx.fillText(x.toFixed(xStep < 1 ? 2 : 0), sx + 3, Math.min(Math.max(toScreenY(0) + 12, 14), height - 4));
      }
    }

    // Grid Y
    const yRange = Math.max(yMax - yMin, 1e-6);
    const yStep = Math.pow(10, Math.floor(Math.log10(yRange))) / (yRange > 15 ? 1 : 2);
    const startY = Math.floor(yMin / yStep) * yStep;

    for (let y = startY; y <= yMax; y += yStep) {
      const sy = toScreenY(y);
      ctx.beginPath();
      ctx.moveTo(0, sy);
      ctx.lineTo(width, sy);
      ctx.stroke();

      if (Math.abs(y) > 1e-6) {
        ctx.fillText(y.toFixed(yStep < 1 ? 2 : 0), Math.min(Math.max(toScreenX(0) + 4, 4), width - 30), sy - 3);
      }
    }

    // Axes lines
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#475569';

    // X-axis
    const yZero = toScreenY(0);
    ctx.beginPath();
    ctx.moveTo(0, yZero);
    ctx.lineTo(width, yZero);
    ctx.stroke();

    // Y-axis
    const xZero = toScreenX(0);
    ctx.beginPath();
    ctx.moveTo(xZero, 0);
    ctx.lineTo(xZero, height);
    ctx.stroke();

    // Draw Function Curves
    const numSamples = Math.min(Math.max(Math.floor(width * 2), 400), 2000);
    const dx = (xMax - xMin) / numSamples;

    functions.forEach((fn) => {
      if (!fn.visible || !fn.expr.trim()) return;

      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = fn.color;

      let isDrawing = false;
      let prevY = 0;

      for (let i = 0; i <= numSamples; i++) {
        const x = xMin + i * dx;
        try {
          const y = mathCore.evaluate(fn.expr, { x, X: x }, { angleUnit: angleMode });

          if (isNaN(y) || !isFinite(y)) {
            isDrawing = false;
            continue;
          }

          // Singularities / asymptote jumps
          if (isDrawing && Math.abs(y - prevY) > (yMax - yMin) * 3) {
            isDrawing = false;
          }

          const sx = toScreenX(x);
          const sy = toScreenY(y);

          if (!isDrawing) {
            ctx.moveTo(sx, sy);
            isDrawing = true;
          } else {
            ctx.lineTo(sx, sy);
          }
          prevY = y;
        } catch {
          isDrawing = false;
        }
      }
      ctx.stroke();
    });

    // Crosshair rendering
    if (hoverCoord) {
      const hx = toScreenX(hoverCoord.x);
      const hy = toScreenY(hoverCoord.y);

      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(hx, 0);
      ctx.lineTo(hx, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, hy);
      ctx.lineTo(width, hy);
      ctx.stroke();

      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [xMin, xMax, yMin, yMax, functions, hoverCoord, angleMode]);

  // Redraw on state changes, window resize, and container mount
  useEffect(() => {
    drawGraph();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ro = new ResizeObserver(() => {
      drawGraph();
    });
    ro.observe(canvas);

    const frameId = requestAnimationFrame(drawGraph);
    const timerId = setTimeout(drawGraph, 60);

    window.addEventListener('resize', drawGraph);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timerId);
      ro.disconnect();
      window.removeEventListener('resize', drawGraph);
    };
  }, [drawGraph]);

  // Mouse & Touch interaction: Pan & Coordinates
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return; // Left click only
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      xMin,
      xMax,
      yMin,
      yMax,
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const x = xMin + (px / rect.width) * (xMax - xMin);
    const y = yMax - (py / rect.height) * (yMax - yMin);

    if (isDragging && dragStartRef.current) {
      const dxPixels = e.clientX - dragStartRef.current.clientX;
      const dyPixels = e.clientY - dragStartRef.current.clientY;

      const xSpan = dragStartRef.current.xMax - dragStartRef.current.xMin;
      const ySpan = dragStartRef.current.yMax - dragStartRef.current.yMin;

      const dxMath = (dxPixels / rect.width) * xSpan;
      const dyMath = (dyPixels / rect.height) * ySpan;

      setXMin(dragStartRef.current.xMin - dxMath);
      setXMax(dragStartRef.current.xMax - dxMath);
      setYMin(dragStartRef.current.yMin + dyMath);
      setYMax(dragStartRef.current.yMax + dyMath);
    } else {
      setHoverCoord({ x, y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    dragStartRef.current = null;
    setHoverCoord(null);
  };

  // Mouse Wheel Zoom centered at cursor
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const cursorX = xMin + (px / rect.width) * (xMax - xMin);
    const cursorY = yMax - (py / rect.height) * (yMax - yMin);

    const zoomFactor = e.deltaY < 0 ? 0.85 : 1.15;

    const newXMin = cursorX - (cursorX - xMin) * zoomFactor;
    const newXMax = cursorX + (xMax - cursorX) * zoomFactor;
    const newYMin = cursorY - (cursorY - yMin) * zoomFactor;
    const newYMax = cursorY + (yMax - cursorY) * zoomFactor;

    setXMin(newXMin);
    setXMax(newXMax);
    setYMin(newYMin);
    setYMax(newYMax);
  };

  // Clean and add function
  const sanitizeExpr = (raw: string): string => {
    let s = raw.trim();
    // Strip leading y= or f(x)=
    s = s.replace(/^[a-zA-Z](?:\([a-zA-Z]\))?\s*=\s*/, '');
    // Auto-close brackets
    s = mathCore.autoCloseBrackets(s);
    return s;
  };

  const handleAddFunction = (exprToAdd?: string) => {
    setInputError(null);
    const candidate = exprToAdd || newExpr;
    if (!candidate.trim()) return;

    const clean = sanitizeExpr(candidate);

    // Validate that the function is evaluatable at representative x values
    try {
      let validSample = false;
      for (const testX of [0, 1, 2, 0.5, -1]) {
        try {
          const testVal = mathCore.evaluate(clean, { x: testX, X: testX }, { angleUnit: angleMode });
          if (!isNaN(testVal)) {
            validSample = true;
            break;
          }
        } catch {
          // continue checking other test values
        }
      }
      if (!validSample) {
        // Run once directly to catch specific syntax error
        mathCore.evaluate(clean, { x: 1, X: 1 }, { angleUnit: angleMode });
      }
    } catch (err: unknown) {
      setInputError(mathCore.formatErrorMessage(err));
      return;
    }

    const color = COLOR_PALETTE[functions.length % COLOR_PALETTE.length];
    setFunctions((prev) => [
      ...prev,
      { id: Date.now().toString(), expr: clean, color, visible: true },
    ]);
    if (!exprToAdd) setNewExpr('');
  };

  const toggleVisibility = (id: string) => {
    setFunctions((prev) =>
      prev.map((f) => (f.id === id ? { ...f, visible: !f.visible } : f))
    );
  };

  const removeFunction = (id: string) => {
    setFunctions((prev) => prev.filter((f) => f.id !== id));
  };

  // Zoom controls
  const handleZoom = (factor: number) => {
    const xCenter = (xMin + xMax) / 2;
    const yCenter = (yMin + yMax) / 2;
    const xHalf = ((xMax - xMin) / 2) * factor;
    const yHalf = ((yMax - yMin) / 2) * factor;
    setXMin(xCenter - xHalf);
    setXMax(xCenter + xHalf);
    setYMin(yCenter - yHalf);
    setYMax(yCenter + yHalf);
  };

  const handleResetRanges = () => {
    setXMin(-10);
    setXMax(10);
    setYMin(-6);
    setYMax(6);
  };

  const handlePresetTrig = () => {
    setAngleMode('radians');
    setXMin(-Math.PI * 2);
    setXMax(Math.PI * 2);
    setYMin(-2.5);
    setYMax(2.5);
  };

  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MATHS_LAB_graph_plot.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div ref={containerRef} className="w-full flex-1 flex flex-col p-4 max-w-6xl mx-auto space-y-4">
      {/* Studio Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-100 font-mono">
              Graph Studio & 2D Curve Visualizer
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-950 text-sky-400 border border-sky-800">
              Interactive 2D
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Multi-function plotting, drag-to-pan, scroll zoom, and continuous curve sampling
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Angle Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded p-0.5">
            <button
              onClick={() => setAngleMode('radians')}
              className={`px-2 py-1 text-[11px] font-mono font-semibold rounded ${
                angleMode === 'radians'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Standard Radians (Recommended for continuous calculus & trig curves)"
            >
              RAD
            </button>
            <button
              onClick={() => setAngleMode('degrees')}
              className={`px-2 py-1 text-[11px] font-mono font-semibold rounded ${
                angleMode === 'degrees'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Degrees Mode"
            >
              DEG
            </button>
          </div>

          <button
            onClick={() => handleZoom(0.8)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(1.25)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handlePresetTrig}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-mono border border-slate-700 transition-colors"
            title="Preset Trig Window [-2π, 2π]"
          >
            [-2π, 2π]
          </button>
          <button
            onClick={handleResetRanges}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors"
            title="Reset Range to [-10, 10]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportPNG}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-mono font-medium shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PNG</span>
          </button>
        </div>
      </div>

      {/* Main Canvas & Function List Split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1 min-h-[500px]">
        {/* Canvas Area */}
        <div className="lg:col-span-3 min-h-[460px] h-[500px] lg:h-auto bg-slate-950 border-2 border-slate-800 rounded-xl relative overflow-hidden flex flex-col shadow-2xl">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onWheel={handleWheel}
            className={`w-full h-full block flex-1 ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
          />

          {/* Coordinate & Function Value Inspector Overlay */}
          <div className="absolute bottom-2.5 left-2.5 max-w-[90%] px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-md text-[11px] font-mono text-slate-300 backdrop-blur-md pointer-events-none shadow-lg">
            {hoverCoord ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span>
                  X: <strong className="text-sky-400 font-semibold">{hoverCoord.x.toFixed(3)}</strong>
                </span>
                <span>
                  Y: <strong className="text-emerald-400 font-semibold">{hoverCoord.y.toFixed(3)}</strong>
                </span>
                {/* Real-time evaluation of visible curves at current x */}
                {functions
                  .filter((fn) => fn.visible && fn.expr.trim())
                  .slice(0, 3)
                  .map((fn) => {
                    let yValStr = 'undef';
                    try {
                      const val = mathCore.evaluate(fn.expr, { x: hoverCoord.x, X: hoverCoord.x }, { angleUnit: angleMode });
                      if (!isNaN(val) && isFinite(val)) yValStr = val.toFixed(3);
                    } catch {
                      yValStr = 'undef';
                    }
                    return (
                      <span key={fn.id} className="text-slate-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: fn.color }} />
                        <span>{yValStr}</span>
                      </span>
                    );
                  })}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-slate-400">
                <Move className="w-3 h-3 text-slate-500" />
                <span>Drag to pan · Scroll to zoom · Bounds: X[{xMin.toFixed(1)}, {xMax.toFixed(1)}] Y[{yMin.toFixed(1)}, {yMax.toFixed(1)}]</span>
              </div>
            )}
          </div>

          {/* Angle mode watermark badge */}
          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-slate-900/80 border border-slate-800 rounded text-[10px] font-mono text-slate-400 backdrop-blur-sm pointer-events-none">
            ANGLE: {angleMode.toUpperCase()}
          </div>
        </div>

        {/* Function Control Sidebar */}
        <div className="bg-slate-900 border-2 border-slate-800 rounded-xl p-4 flex flex-col gap-3 shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-300 font-semibold uppercase tracking-wider">
              Plotted Functions
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {functions.filter((f) => f.visible).length} active
            </span>
          </div>

          {/* Add Function Input */}
          <div className="space-y-1">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newExpr}
                onChange={(e) => {
                  setNewExpr(e.target.value);
                  if (inputError) setInputError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleAddFunction()}
                placeholder="e.g. sin(x), x^2 - 4"
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-2 text-xs font-mono text-slate-100 placeholder-slate-500 focus:border-sky-500 focus:ring-1 focus:ring-sky-500 focus:outline-none"
              />
              <button
                onClick={() => handleAddFunction()}
                className="px-3 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-mono font-bold shadow transition-colors flex items-center justify-center"
                title="Add Function (Enter)"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {inputError && (
              <div className="flex items-start gap-1 p-1.5 bg-rose-950/60 border border-rose-800/60 rounded text-[11px] font-mono text-rose-300">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400 mt-0.5" />
                <span className="break-all">{inputError}</span>
              </div>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wide block mb-1">
              Sample Curves
            </span>
            <div className="flex flex-wrap gap-1">
              {PRESET_FUNCTIONS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => handleAddFunction(preset)}
                  className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono border border-slate-700/80 transition-colors"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Function Items List */}
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[240px] pr-1">
            {functions.map((fn, idx) => (
              <div
                key={fn.id}
                className={`flex items-center justify-between p-2.5 rounded-lg text-xs font-mono border transition-colors ${
                  fn.visible
                    ? 'bg-slate-950 border-slate-800 text-slate-200'
                    : 'bg-slate-950/40 border-slate-900 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1 mr-2">
                  <div
                    className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: fn.visible ? fn.color : '#475569' }}
                  />
                  <span className="text-slate-400 shrink-0 font-medium">f{idx + 1}(x) =</span>
                  <span className="font-semibold truncate">{fn.expr}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleVisibility(fn.id)}
                    className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                    title={fn.visible ? 'Hide Curve' : 'Show Curve'}
                  >
                    {fn.visible ? <Eye className="w-3.5 h-3.5 text-sky-400" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => removeFunction(fn.id)}
                    className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete Curve"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Range Settings */}
          <div className="pt-3 border-t border-slate-800 space-y-2 text-xs font-mono">
            <span className="text-slate-300 font-semibold block text-[11px] uppercase tracking-wider">
              Axis Limits
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">X Min:</label>
                <input
                  type="number"
                  step="any"
                  value={xMin}
                  onChange={(e) => setXMin(parseFloat(e.target.value) || -10)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">X Max:</label>
                <input
                  type="number"
                  step="any"
                  value={xMax}
                  onChange={(e) => setXMax(parseFloat(e.target.value) || 10)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Y Min:</label>
                <input
                  type="number"
                  step="any"
                  value={yMin}
                  onChange={(e) => setYMin(parseFloat(e.target.value) || -6)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Y Max:</label>
                <input
                  type="number"
                  step="any"
                  value={yMax}
                  onChange={(e) => setYMax(parseFloat(e.target.value) || 6)}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
