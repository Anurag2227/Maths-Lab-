import React, { useState } from 'react';
import { mathCore } from '../engine/mathCore';
import { ArrowRight, Table, Activity } from 'lucide-react';

interface CalculusLabProps {
  onRecordHistory: (workspace: string, expr: string, result: string) => void;
  angleUnit: 'radians' | 'degrees';
}

type CalculusTab = 'differentiation' | 'integration' | 'limits' | 'roots';

export const CalculusLab: React.FC<CalculusLabProps> = ({ onRecordHistory, angleUnit }) => {
  const [activeTab, setActiveTab] = useState<CalculusTab>('differentiation');

  // Differentiation state
  const [diffExpr, setDiffExpr] = useState<string>('x^3 - 3*x^2 + 4');
  const [diffOrder, setDiffOrder] = useState<number>(1);
  const [diffEvalPoint, setDiffEvalPoint] = useState<number>(2);
  const [diffResult, setDiffResult] = useState<{
    derivativeVal: number;
    tangentLine: string;
    fx0: number;
  } | null>(null);

  // Integration state
  const [intExpr, setIntExpr] = useState<string>('3*x^2 - 2*x + 5');
  const [intBoundA, setIntBoundA] = useState<number>(0);
  const [intBoundB, setIntBoundB] = useState<number>(2);
  const [intIntervals, setIntIntervals] = useState<number>(100);
  const [intMethod, setIntMethod] = useState<'simpson' | 'simpson_38' | 'trapezoidal' | 'romberg'>('simpson');
  const [intResult, setIntResult] = useState<{
    value: number;
    rombergTable?: number[][];
  } | null>(null);

  // Limits state
  const [limExpr, setLimExpr] = useState<string>('sin(x) / x');
  const [limPoint, setLimPoint] = useState<number>(0);
  const [limDirection, setLimDirection] = useState<'both' | 'left' | 'right'>('both');
  const [limResult, setLimResult] = useState<{
    value: number | string;
    leftVal: number;
    rightVal: number;
  } | null>(null);

  // Root Finding state
  const [rootExpr, setRootExpr] = useState<string>('x^3 - 2*x - 5');
  const [rootMethod, setRootMethod] = useState<'newton' | 'bisection'>('newton');
  const [rootX0, setRootX0] = useState<number>(2.0);
  const [rootBoundA, setRootBoundA] = useState<number>(2.0);
  const [rootBoundB, setRootBoundB] = useState<number>(3.0);
  const [rootTol, setRootTol] = useState<number>(1e-6);
  const [rootMaxIter, setRootMaxIter] = useState<number>(50);
  const [rootResult, setRootResult] = useState<{
    root: number;
    converged: boolean;
    iterations: any[];
  } | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- Handlers ---

  const handleComputeDerivative = () => {
    setErrorMsg(null);
    try {
      const closed = mathCore.autoCloseBrackets(diffExpr);
      if (closed !== diffExpr) setDiffExpr(closed);
      const f = (xVal: number) => mathCore.evaluate(closed, { x: xVal });
      let derivVal = 0;

      if (diffOrder === 1) {
        derivVal = mathCore.numericalDerivative(f, diffEvalPoint);
      } else if (diffOrder === 2) {
        // Second derivative: f''(x) = (f(x+h) - 2f(x) + f(x-h)) / h^2
        const h = 1e-4;
        derivVal = (f(diffEvalPoint + h) - 2 * f(diffEvalPoint) + f(diffEvalPoint - h)) / (h * h);
      } else {
        // Higher orders via repeated numerical derivative
        const d1 = (x: number) => mathCore.numericalDerivative(f, x);
        const d2 = (x: number) => mathCore.numericalDerivative(d1, x);
        derivVal = mathCore.numericalDerivative(d2, diffEvalPoint);
      }

      const fx0 = f(diffEvalPoint);
      // Tangent line: y = m(x - x0) + y0 -> y = mx + (y0 - m*x0)
      const c = fx0 - derivVal * diffEvalPoint;
      const tangentLine = `y = ${parseFloat(derivVal.toFixed(4))}x ${c >= 0 ? '+ ' + parseFloat(c.toFixed(4)) : '- ' + parseFloat(Math.abs(c).toFixed(4))}`;

      setDiffResult({ derivativeVal: derivVal, tangentLine, fx0 });
      onRecordHistory('Calculus', `d${diffOrder}/dx [${closed}] at x=${diffEvalPoint}`, derivVal.toFixed(6));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Derivative calculation error');
    }
  };

  const handleComputeIntegration = () => {
    setErrorMsg(null);
    try {
      const closed = mathCore.autoCloseBrackets(intExpr);
      if (closed !== intExpr) setIntExpr(closed);
      const f = (xVal: number) => mathCore.evaluate(closed, { x: xVal });
      let val = 0;
      let rTable: number[][] | undefined = undefined;

      if (intMethod === 'simpson') {
        val = mathCore.simpsonIntegrate(f, intBoundA, intBoundB, intIntervals);
      } else if (intMethod === 'simpson_38') {
        // Simpson 3/8
        let n = intIntervals;
        while (n % 3 !== 0) n++;
        const h = (intBoundB - intBoundA) / n;
        let sum = f(intBoundA) + f(intBoundB);
        for (let i = 1; i < n; i++) {
          sum += (i % 3 === 0 ? 2 : 3) * f(intBoundA + i * h);
        }
        val = (3 * h / 8) * sum;
      } else if (intMethod === 'trapezoidal') {
        val = mathCore.trapezoidalIntegrate(f, intBoundA, intBoundB, intIntervals);
      } else if (intMethod === 'romberg') {
        const romb = mathCore.rombergIntegrate(f, intBoundA, intBoundB, 8, 1e-8);
        val = romb.value;
        rTable = romb.table;
      }

      setIntResult({ value: val, rombergTable: rTable });
      onRecordHistory('Calculus', `∫[${intBoundA}, ${intBoundB}] (${closed}) dx`, val.toFixed(8));
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Integration error');
    }
  };

  const handleComputeLimits = () => {
    setErrorMsg(null);
    try {
      const closed = mathCore.autoCloseBrackets(limExpr);
      if (closed !== limExpr) setLimExpr(closed);
      const f = (xVal: number) => mathCore.evaluate(closed, { x: xVal });
      // Numerical approach with decreasing step h
      const h = 1e-7;
      let leftVal = 0;
      let rightVal = 0;

      try {
        leftVal = f(limPoint - h);
      } catch {
        leftVal = NaN;
      }

      try {
        rightVal = f(limPoint + h);
      } catch {
        rightVal = NaN;
      }

      let finalVal: number | string = 'Undefined';
      if (!isNaN(leftVal) && !isNaN(rightVal)) {
        if (Math.abs(leftVal - rightVal) < 1e-4) {
          finalVal = (leftVal + rightVal) / 2;
        } else {
          finalVal = 'Limit does not exist (left != right)';
        }
      } else if (!isNaN(rightVal) && limDirection === 'right') {
        finalVal = rightVal;
      } else if (!isNaN(leftVal) && limDirection === 'left') {
        finalVal = leftVal;
      }

      setLimResult({ value: finalVal, leftVal, rightVal });
      onRecordHistory('Calculus', `lim(x->${limPoint}) [${closed}]`, finalVal.toString());
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Limit calculation error');
    }
  };

  const handleComputeRoots = () => {
    setErrorMsg(null);
    try {
      const closed = mathCore.autoCloseBrackets(rootExpr);
      if (closed !== rootExpr) setRootExpr(closed);
      const f = (xVal: number) => mathCore.evaluate(closed, { x: xVal });

      if (rootMethod === 'newton') {
        const df = (xVal: number) => mathCore.numericalDerivative(f, xVal);
        const res = mathCore.newtonRaphson(f, df, rootX0, rootTol, rootMaxIter);
        setRootResult(res);
        onRecordHistory('Calculus', `Newton Root [${closed}]`, res.root.toFixed(8));
      } else {
        const res = mathCore.bisection(f, rootBoundA, rootBoundB, rootTol, rootMaxIter);
        setRootResult(res);
        onRecordHistory('Calculus', `Bisection Root [${closed}]`, res.root.toFixed(8));
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Root finding error');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 max-w-5xl mx-auto space-y-6">
      {/* Workspace Header */}
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-base font-semibold text-slate-100 font-mono">
          Calculus Lab & Numerical Methods
        </h2>
        <p className="text-xs text-slate-400">
          Symbolic & numerical differentiation, Simpson/Romberg quadrature, limits, and Newton-Raphson root solvers
        </p>
      </div>

      {/* Sub-Tabs */}
      <div className="flex border-b border-slate-800 gap-1">
        <button
          onClick={() => { setActiveTab('differentiation'); setErrorMsg(null); }}
          className={`px-4 py-2 text-xs font-mono font-medium transition-colors border-b-2 ${
            activeTab === 'differentiation'
              ? 'border-sky-500 text-sky-400 font-semibold bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          1. Differentiation (f')
        </button>
        <button
          onClick={() => { setActiveTab('integration'); setErrorMsg(null); }}
          className={`px-4 py-2 text-xs font-mono font-medium transition-colors border-b-2 ${
            activeTab === 'integration'
              ? 'border-sky-500 text-sky-400 font-semibold bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          2. Integration (∫)
        </button>
        <button
          onClick={() => { setActiveTab('limits'); setErrorMsg(null); }}
          className={`px-4 py-2 text-xs font-mono font-medium transition-colors border-b-2 ${
            activeTab === 'limits'
              ? 'border-sky-500 text-sky-400 font-semibold bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          3. Limits (lim)
        </button>
        <button
          onClick={() => { setActiveTab('roots'); setErrorMsg(null); }}
          className={`px-4 py-2 text-xs font-mono font-medium transition-colors border-b-2 ${
            activeTab === 'roots'
              ? 'border-sky-500 text-sky-400 font-semibold bg-slate-900/60'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          4. Root Finding (Newton / Bisection)
        </button>
      </div>

      {/* Tab 1: Differentiation */}
      {activeTab === 'differentiation' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-300 font-medium">Function f(x):</label>
            <input
              type="text"
              value={diffExpr}
              onChange={(e) => setDiffExpr(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 font-mono text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              placeholder="e.g. x^3 - 3*x^2 + 4, sin(x)*exp(x)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300 font-medium">Derivative Order:</label>
              <select
                value={diffOrder}
                onChange={(e) => setDiffOrder(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 font-mono text-xs text-slate-200"
              >
                <option value={1}>1st Derivative f'(x)</option>
                <option value={2}>2nd Derivative f''(x)</option>
                <option value={3}>3rd Derivative f'''(x)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300 font-medium">Evaluate at Point (x₀):</label>
              <input
                type="number"
                value={diffEvalPoint}
                onChange={(e) => setDiffEvalPoint(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 font-mono text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleComputeDerivative}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold rounded shadow-sm transition-colors flex items-center gap-2"
          >
            <span>Compute Derivative & Tangent Line</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {diffResult && (
            <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded space-y-2 font-mono">
              <div className="text-xs text-slate-400">Results at x = {diffEvalPoint}:</div>
              <div className="text-xl font-bold text-sky-400">
                f{diffOrder === 1 ? "'" : diffOrder === 2 ? "''" : "'''"}({diffEvalPoint}) = {parseFloat(diffResult.derivativeVal.toFixed(8))}
              </div>
              <div className="text-sm text-slate-300">
                Function Value f({diffEvalPoint}) = {parseFloat(diffResult.fx0.toFixed(8))}
              </div>
              <div className="text-sm text-emerald-400 font-semibold">
                Tangent Line Equation: {diffResult.tangentLine}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Integration */}
      {activeTab === 'integration' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-300 font-medium">Integrand f(x):</label>
            <input
              type="text"
              value={intExpr}
              onChange={(e) => setIntExpr(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 font-mono text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              placeholder="e.g. 3*x^2 - 2*x + 5, sin(x)^2"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300 font-medium">Lower Bound (a):</label>
              <input
                type="number"
                value={intBoundA}
                onChange={(e) => setIntBoundA(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 font-mono text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300 font-medium">Upper Bound (b):</label>
              <input
                type="number"
                value={intBoundB}
                onChange={(e) => setIntBoundB(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 font-mono text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300 font-medium">Quadrature Method:</label>
              <select
                value={intMethod}
                onChange={(e) => setIntMethod(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 font-mono text-xs text-slate-200"
              >
                <option value="simpson">Composite Simpson's 1/3</option>
                <option value="simpson_38">Composite Simpson's 3/8</option>
                <option value="trapezoidal">Trapezoidal Rule</option>
                <option value="romberg">Romberg Extrapolation</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleComputeIntegration}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold rounded shadow-sm transition-colors flex items-center gap-2"
          >
            <span>Evaluate Definite Integral ∫[a,b] f(x) dx</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {intResult && (
            <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded space-y-3 font-mono">
              <div className="text-xs text-slate-400">
                Definite Integral of ({intExpr}) from {intBoundA} to {intBoundB}:
              </div>
              <div className="text-2xl font-bold text-sky-400">
                ∫ = {parseFloat(intResult.value.toFixed(10))}
              </div>

              {intResult.rombergTable && (
                <div className="space-y-1 pt-2 border-t border-slate-800">
                  <div className="text-xs text-slate-400">Romberg Table (Richardson Extrapolation):</div>
                  <div className="overflow-x-auto text-[11px] text-slate-300">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500">
                          <th className="p-1">Step</th>
                          <th className="p-1">R(k, 0)</th>
                          <th className="p-1">R(k, 1)</th>
                          <th className="p-1">R(k, 2)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {intResult.rombergTable.map((row, rIdx) => (
                          <tr key={rIdx} className="border-b border-slate-900">
                            <td className="p-1 text-sky-400 font-bold">{rIdx + 1}</td>
                            {row.slice(0, 3).map((v, cIdx) => (
                              <td key={cIdx} className="p-1">{v.toFixed(8)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Limits */}
      {activeTab === 'limits' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-300 font-medium">Expression f(x):</label>
            <input
              type="text"
              value={limExpr}
              onChange={(e) => setLimExpr(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 font-mono text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              placeholder="e.g. sin(x)/x, (x^2 - 4)/(x - 2)"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300 font-medium">Approach Point (c):</label>
              <input
                type="number"
                value={limPoint}
                onChange={(e) => setLimPoint(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 font-mono text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300 font-medium">Direction:</label>
              <select
                value={limDirection}
                onChange={(e) => setLimDirection(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 font-mono text-xs text-slate-200"
              >
                <option value="both">Two-Sided (x → c)</option>
                <option value="left">Left-Hand (x → c⁻)</option>
                <option value="right">Right-Hand (x → c⁺)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleComputeLimits}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold rounded shadow-sm transition-colors flex items-center gap-2"
          >
            <span>Compute Limit lim(x → {limPoint})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {limResult && (
            <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded space-y-2 font-mono">
              <div className="text-xs text-slate-400">Limit Analysis:</div>
              <div className="text-xl font-bold text-sky-400">
                lim(x → {limPoint}) = {typeof limResult.value === 'number' ? parseFloat(limResult.value.toFixed(8)) : limResult.value}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                <div>Left-hand: f({limPoint}⁻) = {isNaN(limResult.leftVal) ? 'NaN' : limResult.leftVal.toFixed(6)}</div>
                <div>Right-hand: f({limPoint}⁺) = {isNaN(limResult.rightVal) ? 'NaN' : limResult.rightVal.toFixed(6)}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Root Finding */}
      {activeTab === 'roots' && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-300 font-medium">Equation f(x) = 0:</label>
            <input
              type="text"
              value={rootExpr}
              onChange={(e) => setRootExpr(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 font-mono text-sm text-slate-100 focus:border-sky-500 focus:outline-none"
              placeholder="e.g. x^3 - 2*x - 5"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-300 font-medium">Algorithm:</label>
              <select
                value={rootMethod}
                onChange={(e) => setRootMethod(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 font-mono text-xs text-slate-200"
              >
                <option value="newton">Newton-Raphson Method</option>
                <option value="bisection">Bisection Method</option>
              </select>
            </div>

            {rootMethod === 'newton' ? (
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300 font-medium">Initial Guess (x₀):</label>
                <input
                  type="number"
                  value={rootX0}
                  onChange={(e) => setRootX0(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 font-mono text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                />
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300 font-medium">Lower Bound (a):</label>
                  <input
                    type="number"
                    value={rootBoundA}
                    onChange={(e) => setRootBoundA(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 font-mono text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300 font-medium">Upper Bound (b):</label>
                  <input
                    type="number"
                    value={rootBoundB}
                    onChange={(e) => setRootBoundB(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 font-mono text-xs text-slate-100 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleComputeRoots}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded shadow-sm transition-colors flex items-center gap-2"
          >
            <span>Solve for Root f(x) = 0</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {rootResult && (
            <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded space-y-3 font-mono">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {rootResult.converged ? 'Converged Successfully:' : 'Did not fully converge:'}
                </span>
                <span className="text-xs text-slate-500">{rootResult.iterations.length} Iterations</span>
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                Root x ≈ {parseFloat(rootResult.root.toFixed(8))}
              </div>

              {/* Iteration Table */}
              <div className="pt-2 border-t border-slate-800 space-y-1">
                <div className="text-xs text-slate-400">Convergence Iteration Table:</div>
                <div className="max-h-48 overflow-y-auto text-xs text-slate-300 border border-slate-800 rounded">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 sticky top-0 text-slate-400">
                      <tr>
                        <th className="p-2">Iter</th>
                        <th className="p-2">{rootMethod === 'newton' ? 'x_i' : 'c_mid'}</th>
                        <th className="p-2">f(x)</th>
                        <th className="p-2">{rootMethod === 'newton' ? 'Δx' : 'Error'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rootResult.iterations.map((item, idx) => (
                        <tr key={idx} className="border-t border-slate-900 hover:bg-slate-900/40">
                          <td className="p-2 text-sky-400 font-bold">{item.iter}</td>
                          <td className="p-2">{(item.x ?? item.c).toFixed(6)}</td>
                          <td className="p-2">{(item.fx ?? item.fc).toFixed(6)}</td>
                          <td className="p-2">{(item.dx ?? item.error).toFixed(6)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 text-xs font-mono">
          Error: {errorMsg}
        </div>
      )}
    </div>
  );
};
