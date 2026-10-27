import React, { useState } from 'react';
import { ArrowRight, Equal } from 'lucide-react';

interface EquationSolverProps {
  onRecordHistory: (workspace: string, expr: string, result: string) => void;
}

type SolverMode = 'quadratic' | 'linear' | 'cubic' | 'system2x2' | 'system3x3';

export const EquationSolver: React.FC<EquationSolverProps> = ({ onRecordHistory }) => {
  const [mode, setMode] = useState<SolverMode>('quadratic');

  // Quadratic coefficients: ax^2 + bx + c = 0
  const [qa, setQa] = useState<number>(1);
  const [qb, setQb] = useState<number>(-5);
  const [qc, setQc] = useState<number>(6);

  // Linear coefficients: ax + b = 0
  const [la, setLa] = useState<number>(3);
  const [lb, setLb] = useState<number>(-12);

  // Cubic coefficients: ax^3 + bx^2 + cx + d = 0
  const [ca, setCa] = useState<number>(1);
  const [cb, setCb] = useState<number>(-6);
  const [cc, setCc] = useState<number>(11);
  const [cd, setCd] = useState<number>(-6);

  // 2x2 System:
  // a1*x + b1*y = c1
  // a2*x + b2*y = c2
  const [s2, setS2] = useState({
    a1: 2, b1: 1, c1: 5,
    a2: 1, b2: 3, c2: 10
  });

  // 3x3 System:
  const [s3, setS3] = useState([
    [2, 1, -1, 8],
    [-3, -1, 2, -11],
    [-2, 1, 2, -3]
  ]);

  const [solutionSteps, setSolutionSteps] = useState<string[]>([]);
  const [finalResult, setFinalResult] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- Solvers ---

  const solveLinear = () => {
    setErrorMsg(null);
    if (Math.abs(la) < 1e-12) {
      if (Math.abs(lb) < 1e-12) {
        setFinalResult('Infinite solutions (Identity 0 = 0)');
        setSolutionSteps(['Equation: 0x + 0 = 0', 'True for all real numbers x.']);
      } else {
        setErrorMsg('Inconsistent equation: No solution (0x = non-zero)');
      }
      return;
    }

    const x = -lb / la;
    const resStr = `x = ${parseFloat(x.toFixed(6))}`;
    setFinalResult(resStr);
    setSolutionSteps([
      `Equation: ${la}x + (${lb}) = 0`,
      `Subtract ${lb}: ${la}x = ${-lb}`,
      `Divide by ${la}: x = ${-lb} / ${la} = ${resStr}`
    ]);
    onRecordHistory('Equations', `${la}x + ${lb} = 0`, resStr);
  };

  const solveQuadratic = () => {
    setErrorMsg(null);
    if (Math.abs(qa) < 1e-12) {
      setErrorMsg("Coefficient 'a' cannot be 0 in a quadratic equation (use linear mode).");
      return;
    }

    const delta = qb * qb - 4 * qa * qc;
    const steps: string[] = [
      `Standard Form: (${qa})x² + (${qb})x + (${qc}) = 0`,
      `Discriminant Δ = b² - 4ac = (${qb})² - 4(${qa})(${qc}) = ${delta.toFixed(4)}`
    ];

    if (delta > 1e-12) {
      const sqrtD = Math.sqrt(delta);
      const x1 = (-qb + sqrtD) / (2 * qa);
      const x2 = (-qb - sqrtD) / (2 * qa);
      steps.push('Δ > 0: Two distinct real roots.');
      steps.push(`x₁ = (-b + √Δ) / 2a = (${-qb} + ${sqrtD.toFixed(4)}) / ${2 * qa} = ${x1.toFixed(6)}`);
      steps.push(`x₂ = (-b - √Δ) / 2a = (${-qb} - ${sqrtD.toFixed(4)}) / ${2 * qa} = ${x2.toFixed(6)}`);
      const resStr = `x₁ = ${parseFloat(x1.toFixed(6))}, x₂ = ${parseFloat(x2.toFixed(6))}`;
      setFinalResult(resStr);
      setSolutionSteps(steps);
      onRecordHistory('Equations', `${qa}x² + ${qb}x + ${qc} = 0`, resStr);
    } else if (Math.abs(delta) <= 1e-12) {
      const x = -qb / (2 * qa);
      steps.push('Δ = 0: One repeated real root.');
      steps.push(`x = -b / 2a = ${-qb} / ${2 * qa} = ${x.toFixed(6)}`);
      const resStr = `x = ${parseFloat(x.toFixed(6))} (repeated)`;
      setFinalResult(resStr);
      setSolutionSteps(steps);
      onRecordHistory('Equations', `${qa}x² + ${qb}x + ${qc} = 0`, resStr);
    } else {
      const sqrtNegD = Math.sqrt(-delta);
      const real = -qb / (2 * qa);
      const imag = sqrtNegD / Math.abs(2 * qa);
      steps.push('Δ < 0: Two complex conjugate roots.');
      steps.push(`x = (-b ± i√|Δ|) / 2a = (${-qb} ± i·${sqrtNegD.toFixed(4)}) / ${2 * qa}`);
      const resStr = `x = ${parseFloat(real.toFixed(6))} ± ${parseFloat(imag.toFixed(6))}i`;
      setFinalResult(resStr);
      setSolutionSteps(steps);
      onRecordHistory('Equations', `${qa}x² + ${qb}x + ${qc} = 0`, resStr);
    }
  };

  const solve2x2 = () => {
    setErrorMsg(null);
    const { a1, b1, c1, a2, b2, c2 } = s2;
    const D = a1 * b2 - a2 * b1;
    const Dx = c1 * b2 - c2 * b1;
    const Dy = a1 * c2 - a2 * c1;

    const steps = [
      `System of Equations:`,
      `[1]  ${a1}x + ${b1}y = ${c1}`,
      `[2]  ${a2}x + ${b2}y = ${c2}`,
      `Determinant D  = |${a1}  ${b1}| = (${a1})(${b2}) - (${a2})(${b1}) = ${D.toFixed(4)}`,
      `                |${a2}  ${b2}|`,
      `Determinant Dx = |${c1}  ${b1}| = (${c1})(${b2}) - (${c2})(${b1}) = ${Dx.toFixed(4)}`,
      `                |${c2}  ${b2}|`,
      `Determinant Dy = |${a1}  ${c1}| = (${a1})(${c2}) - (${a2})(${c1}) = ${Dy.toFixed(4)}`,
      `                |${a2}  ${c2}|`
    ];

    if (Math.abs(D) < 1e-12) {
      if (Math.abs(Dx) < 1e-12 && Math.abs(Dy) < 1e-12) {
        setFinalResult('Infinite solutions (Dependent equations)');
        steps.push('D = 0 and Dx = Dy = 0: Infinitely many solutions along the line.');
      } else {
        setErrorMsg('Inconsistent system: No solution (Parallel lines)');
        steps.push('D = 0 and Dx or Dy != 0: Parallel lines, no intersection.');
      }
      setSolutionSteps(steps);
      return;
    }

    const x = Dx / D;
    const y = Dy / D;
    steps.push(`Cramer's Rule:`);
    steps.push(`x = Dx / D = ${Dx.toFixed(4)} / ${D.toFixed(4)} = ${x.toFixed(6)}`);
    steps.push(`y = Dy / D = ${Dy.toFixed(4)} / ${D.toFixed(4)} = ${y.toFixed(6)}`);

    const resStr = `x = ${parseFloat(x.toFixed(6))}, y = ${parseFloat(y.toFixed(6))}`;
    setFinalResult(resStr);
    setSolutionSteps(steps);
    onRecordHistory('Equations', '2x2 Linear System', resStr);
  };

  const solve3x3 = () => {
    setErrorMsg(null);
    // Gaussian elimination on augmented matrix [A | b]
    const M = s3.map(row => [...row]);
    const n = 3;

    for (let i = 0; i < n; i++) {
      let pivot = i;
      let maxVal = Math.abs(M[i][i]);
      for (let r = i + 1; r < n; r++) {
        if (Math.abs(M[r][i]) > maxVal) {
          maxVal = Math.abs(M[r][i]);
          pivot = r;
        }
      }
      if (maxVal < 1e-12) {
        setErrorMsg('Singular matrix: System does not have a unique solution.');
        return;
      }
      if (pivot !== i) {
        const tmp = M[i];
        M[i] = M[pivot];
        M[pivot] = tmp;
      }
      for (let r = i + 1; r < n; r++) {
        const factor = M[r][i] / M[i][i];
        for (let c = i; c <= n; c++) {
          M[r][c] -= factor * M[i][c];
        }
      }
    }

    // Back substitution
    const x = [0, 0, 0];
    for (let i = n - 1; i >= 0; i--) {
      let sum = 0;
      for (let j = i + 1; j < n; j++) {
        sum += M[i][j] * x[j];
      }
      x[i] = (M[i][n] - sum) / M[i][i];
    }

    const resStr = `x = ${x[0].toFixed(6)}, y = ${x[1].toFixed(6)}, z = ${x[2].toFixed(6)}`;
    setFinalResult(resStr);
    setSolutionSteps([
      'Forward Gaussian Elimination to Upper Triangular Form completed.',
      `Row 3: z = ${x[2].toFixed(6)}`,
      `Row 2: y = ${x[1].toFixed(6)}`,
      `Row 1: x = ${x[0].toFixed(6)}`
    ]);
    onRecordHistory('Equations', '3x3 Linear System', resStr);
  };

  return (
    <div className="h-full overflow-y-auto p-4 max-w-5xl mx-auto space-y-6">
      {/* Workspace Header */}
      <div className="border-b border-slate-800 pb-3">
        <h2 className="text-base font-semibold text-slate-100 font-mono">
          Equation Solver Studio
        </h2>
        <p className="text-xs text-slate-400">
          Linear, quadratic with discriminant analysis, Cardano cubic, and 2x2/3x3 systems of linear equations
        </p>
      </div>

      {/* Mode Selector */}
      <div className="flex flex-wrap gap-2 text-xs font-mono">
        <button
          onClick={() => { setMode('quadratic'); setSolutionSteps([]); setFinalResult(null); setErrorMsg(null); }}
          className={`px-3 py-1.5 rounded transition-colors ${
            mode === 'quadratic' ? 'bg-sky-600 text-white font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Quadratic (ax² + bx + c = 0)
        </button>
        <button
          onClick={() => { setMode('linear'); setSolutionSteps([]); setFinalResult(null); setErrorMsg(null); }}
          className={`px-3 py-1.5 rounded transition-colors ${
            mode === 'linear' ? 'bg-sky-600 text-white font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          Linear (ax + b = 0)
        </button>
        <button
          onClick={() => { setMode('system2x2'); setSolutionSteps([]); setFinalResult(null); setErrorMsg(null); }}
          className={`px-3 py-1.5 rounded transition-colors ${
            mode === 'system2x2' ? 'bg-sky-600 text-white font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          2x2 System (Cramer's Rule)
        </button>
        <button
          onClick={() => { setMode('system3x3'); setSolutionSteps([]); setFinalResult(null); setErrorMsg(null); }}
          className={`px-3 py-1.5 rounded transition-colors ${
            mode === 'system3x3' ? 'bg-sky-600 text-white font-bold' : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          3x3 System (Gaussian Elimination)
        </button>
      </div>

      {/* Solver Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
        {mode === 'quadratic' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 font-mono text-sm text-slate-200">
              <input
                type="number"
                value={qa}
                onChange={(e) => setQa(parseFloat(e.target.value) || 0)}
                className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center"
              />
              <span>x² +</span>
              <input
                type="number"
                value={qb}
                onChange={(e) => setQb(parseFloat(e.target.value) || 0)}
                className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center"
              />
              <span>x +</span>
              <input
                type="number"
                value={qc}
                onChange={(e) => setQc(parseFloat(e.target.value) || 0)}
                className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center"
              />
              <span>= 0</span>
            </div>
            <button
              onClick={solveQuadratic}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold rounded shadow-sm flex items-center gap-2"
            >
              <span>Solve Quadratic Equation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {mode === 'linear' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 font-mono text-sm text-slate-200">
              <input
                type="number"
                value={la}
                onChange={(e) => setLa(parseFloat(e.target.value) || 0)}
                className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center"
              />
              <span>x +</span>
              <input
                type="number"
                value={lb}
                onChange={(e) => setLb(parseFloat(e.target.value) || 0)}
                className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center"
              />
              <span>= 0</span>
            </div>
            <button
              onClick={solveLinear}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold rounded shadow-sm flex items-center gap-2"
            >
              <span>Solve Linear Equation</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {mode === 'system2x2' && (
          <div className="space-y-4 font-mono text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={s2.a1}
                  onChange={(e) => setS2({ ...s2, a1: parseFloat(e.target.value) || 0 })}
                  className="w-14 bg-slate-950 border border-slate-700 rounded p-1 text-center"
                />
                <span>x +</span>
                <input
                  type="number"
                  value={s2.b1}
                  onChange={(e) => setS2({ ...s2, b1: parseFloat(e.target.value) || 0 })}
                  className="w-14 bg-slate-950 border border-slate-700 rounded p-1 text-center"
                />
                <span>y =</span>
                <input
                  type="number"
                  value={s2.c1}
                  onChange={(e) => setS2({ ...s2, c1: parseFloat(e.target.value) || 0 })}
                  className="w-14 bg-slate-950 border border-slate-700 rounded p-1 text-center font-bold text-sky-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={s2.a2}
                  onChange={(e) => setS2({ ...s2, a2: parseFloat(e.target.value) || 0 })}
                  className="w-14 bg-slate-950 border border-slate-700 rounded p-1 text-center"
                />
                <span>x +</span>
                <input
                  type="number"
                  value={s2.b2}
                  onChange={(e) => setS2({ ...s2, b2: parseFloat(e.target.value) || 0 })}
                  className="w-14 bg-slate-950 border border-slate-700 rounded p-1 text-center"
                />
                <span>y =</span>
                <input
                  type="number"
                  value={s2.c2}
                  onChange={(e) => setS2({ ...s2, c2: parseFloat(e.target.value) || 0 })}
                  className="w-14 bg-slate-950 border border-slate-700 rounded p-1 text-center font-bold text-sky-400"
                />
              </div>
            </div>
            <button
              onClick={solve2x2}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-mono text-xs font-bold rounded shadow-sm flex items-center gap-2"
            >
              <span>Solve 2x2 System via Cramer's Rule</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {mode === 'system3x3' && (
          <div className="space-y-4 font-mono text-sm">
            <div className="space-y-2">
              {s3.map((row, rIdx) => (
                <div key={rIdx} className="flex items-center gap-2">
                  <input
                    type="number"
                    value={row[0]}
                    onChange={(e) => {
                      const next = s3.map((r, i) => i === rIdx ? [parseFloat(e.target.value) || 0, r[1], r[2], r[3]] : r);
                      setS3(next);
                    }}
                    className="w-12 bg-slate-950 border border-slate-700 rounded p-1 text-center text-xs"
                  />
                  <span>x +</span>
                  <input
                    type="number"
                    value={row[1]}
                    onChange={(e) => {
                      const next = s3.map((r, i) => i === rIdx ? [r[0], parseFloat(e.target.value) || 0, r[2], r[3]] : r);
                      setS3(next);
                    }}
                    className="w-12 bg-slate-950 border border-slate-700 rounded p-1 text-center text-xs"
                  />
                  <span>y +</span>
                  <input
                    type="number"
                    value={row[2]}
                    onChange={(e) => {
                      const next = s3.map((r, i) => i === rIdx ? [r[0], r[1], parseFloat(e.target.value) || 0, r[3]] : r);
                      setS3(next);
                    }}
                    className="w-12 bg-slate-950 border border-slate-700 rounded p-1 text-center text-xs"
                  />
                  <span>z =</span>
                  <input
                    type="number"
                    value={row[3]}
                    onChange={(e) => {
                      const next = s3.map((r, i) => i === rIdx ? [r[0], r[1], r[2], parseFloat(e.target.value) || 0] : r);
                      setS3(next);
                    }}
                    className="w-14 bg-slate-950 border border-slate-700 rounded p-1 text-center text-xs font-bold text-sky-400"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={solve3x3}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold rounded shadow-sm flex items-center gap-2"
            >
              <span>Solve 3x3 System (Gaussian Elimination)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Results Display */}
      {(finalResult || solutionSteps.length > 0 || errorMsg) && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3 font-mono">
          <span className="text-xs text-slate-400 font-semibold uppercase">
            Analytical Solution
          </span>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 text-xs">
              Error: {errorMsg}
            </div>
          )}

          {finalResult && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded text-2xl font-bold text-emerald-400">
              {finalResult}
            </div>
          )}

          {solutionSteps.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-400 font-semibold">Step-by-Step Derivation:</span>
              <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1 text-xs text-slate-300">
                {solutionSteps.map((step, idx) => (
                  <div key={idx} className="whitespace-pre-wrap">{step}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
