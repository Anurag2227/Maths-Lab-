import React, { useState } from 'react';
import { MatrixCore, Matrix } from '../engine/matrixCore';
import { RefreshCw } from 'lucide-react';

interface MatrixLabProps {
  onRecordHistory: (workspace: string, expr: string, result: string) => void;
}

export const MatrixLab: React.FC<MatrixLabProps> = ({ onRecordHistory }) => {
  // Dimensions
  const [rowsA, setRowsA] = useState<number>(3);
  const [colsA, setColsA] = useState<number>(3);
  const [rowsB, setRowsB] = useState<number>(3);
  const [colsB, setColsB] = useState<number>(3);

  // String-backed Matrices allowing empty inputs during backspace and preventing zero-prepending
  const [matrixA, setMatrixA] = useState<string[][]>([
    ['2', '1', '-1'],
    ['-3', '-1', '2'],
    ['-2', '1', '2'],
  ]);

  const [matrixB, setMatrixB] = useState<string[][]>([
    ['1', '0', '2'],
    ['0', '1', '-1'],
    ['3', '2', '1'],
  ]);

  // Scalar & Vector b for linear solver
  const [scalarK, setScalarK] = useState<number>(2);
  const [powerK, setPowerK] = useState<number>(2);
  const [vectorB, setVectorB] = useState<string[]>(['8', '-11', '-3']);

  // Results & Errors
  const [resultMatrix, setResultMatrix] = useState<Matrix | null>(null);
  const [resultScalar, setResultScalar] = useState<string | null>(null);
  const [resultVector, setResultVector] = useState<number[] | null>(null);
  const [activeOpName, setActiveOpName] = useState<string>('Ready');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  /**
   * Cleans cell input so typing over 0 replaces it, backspace clears to empty string,
   * and typing new numbers never prepends an unwanted 0.
   */
  const cleanCellInput = (newVal: string, oldVal: string): string => {
    // If user hit backspace and cleared the cell, keep it empty without forcing 0
    if (newVal === '' || newVal === '-') return newVal;

    // If cell was '0' and user types a digit (e.g. '05'), strip the leading '0' -> '5'
    if (oldVal === '0' && /^0[0-9]/.test(newVal)) {
      return newVal.replace(/^0+/, '') || '0';
    }

    // If input starts with '0' followed by non-dot digit (e.g. '05'), strip leading zeros
    if (/^0[0-9]/.test(newVal)) {
      return newVal.replace(/^0+/, '');
    }
    if (/^-0[0-9]/.test(newVal)) {
      return '-' + newVal.slice(2).replace(/^0+/, '');
    }

    // Allow standard numeric strings (optional minus, digits, optional decimal)
    if (/^-?[0-9]*\.?[0-9]*$/.test(newVal)) {
      return newVal;
    }

    return oldVal;
  };

  // Convert string matrices to numeric format for MatrixCore algorithms
  const toNumericA = (): Matrix => {
    return matrixA.map((row) =>
      row.map((cell) => {
        const n = parseFloat(cell);
        return isNaN(n) ? 0 : n;
      })
    );
  };

  const toNumericB = (): Matrix => {
    return matrixB.map((row) =>
      row.map((cell) => {
        const n = parseFloat(cell);
        return isNaN(n) ? 0 : n;
      })
    );
  };

  const toNumericVecB = (): number[] => {
    return vectorB.map((cell) => {
      const n = parseFloat(cell);
      return isNaN(n) ? 0 : n;
    });
  };

  // Resize Handlers
  const handleResizeA = (newR: number, newC: number) => {
    setRowsA(newR);
    setColsA(newC);
    setMatrixA((prev) => {
      const next = Array.from({ length: newR }, () => Array(newC).fill('0'));
      for (let i = 0; i < Math.min(newR, prev.length); i++) {
        for (let j = 0; j < Math.min(newC, prev[0].length); j++) {
          next[i][j] = prev[i][j] !== undefined ? prev[i][j] : '0';
        }
      }
      return next;
    });
    setVectorB(Array(newR).fill('1'));
  };

  const handleResizeB = (newR: number, newC: number) => {
    setRowsB(newR);
    setColsB(newC);
    setMatrixB((prev) => {
      const next = Array.from({ length: newR }, () => Array(newC).fill('0'));
      for (let i = 0; i < Math.min(newR, prev.length); i++) {
        for (let j = 0; j < Math.min(newC, prev[0].length); j++) {
          next[i][j] = prev[i][j] !== undefined ? prev[i][j] : '0';
        }
      }
      return next;
    });
  };

  const handleCellChangeA = (r: number, c: number, rawVal: string) => {
    const cleaned = cleanCellInput(rawVal, matrixA[r][c]);
    setMatrixA((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = cleaned;
      return next;
    });
  };

  const handleCellChangeB = (r: number, c: number, rawVal: string) => {
    const cleaned = cleanCellInput(rawVal, matrixB[r][c]);
    setMatrixB((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = cleaned;
      return next;
    });
  };

  const handleVectorChange = (idx: number, rawVal: string) => {
    const cleaned = cleanCellInput(rawVal, vectorB[idx]);
    setVectorB((prev) => {
      const next = [...prev];
      next[idx] = cleaned;
      return next;
    });
  };

  // Presets
  const applyPresetA = (type: 'identity' | 'zero' | 'random' | 'hilbert') => {
    let next: string[][];
    if (type === 'identity') {
      const n = Math.min(rowsA, colsA);
      next = Array.from({ length: rowsA }, (_, i) =>
        Array.from({ length: colsA }, (_, j) => (i === j ? '1' : '0'))
      );
    } else if (type === 'zero') {
      next = Array.from({ length: rowsA }, () => Array(colsA).fill('0'));
    } else if (type === 'random') {
      next = Array.from({ length: rowsA }, () =>
        Array.from({ length: colsA }, () => (Math.floor(Math.random() * 9) - 4).toString())
      );
    } else {
      // Hilbert matrix: H_ij = 1 / (i + j + 1)
      next = Array.from({ length: rowsA }, (_, i) =>
        Array.from({ length: colsA }, (_, j) => parseFloat((1 / (i + j + 1)).toFixed(4)).toString())
      );
    }
    setMatrixA(next);
  };

  const clearResults = () => {
    setResultMatrix(null);
    setResultScalar(null);
    setResultVector(null);
    setErrorMsg(null);
  };

  // Operations
  const handleAdd = () => {
    clearResults();
    try {
      const res = MatrixCore.add(toNumericA(), toNumericB());
      setResultMatrix(res);
      setActiveOpName('Matrix Addition (A + B)');
      onRecordHistory('Matrix', 'A + B', `Result Matrix [${res.length}x${res[0].length}]`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleSubtract = () => {
    clearResults();
    try {
      const res = MatrixCore.subtract(toNumericA(), toNumericB());
      setResultMatrix(res);
      setActiveOpName('Matrix Subtraction (A - B)');
      onRecordHistory('Matrix', 'A - B', `Result Matrix [${res.length}x${res[0].length}]`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleMultiply = () => {
    clearResults();
    try {
      const res = MatrixCore.multiply(toNumericA(), toNumericB());
      setResultMatrix(res);
      setActiveOpName('Matrix Multiplication (A × B)');
      onRecordHistory('Matrix', 'A × B', `Result Matrix [${res.length}x${res[0].length}]`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleMultiplyScalar = () => {
    clearResults();
    try {
      const res = MatrixCore.multiplyScalar(toNumericA(), scalarK);
      setResultMatrix(res);
      setActiveOpName(`Scalar Multiplication (${scalarK} · A)`);
      onRecordHistory('Matrix', `${scalarK} * A`, `Result Matrix [${res.length}x${res[0].length}]`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleTranspose = () => {
    clearResults();
    try {
      const res = MatrixCore.transpose(toNumericA());
      setResultMatrix(res);
      setActiveOpName('Transpose (Aᵀ)');
      onRecordHistory('Matrix', 'transpose(A)', `Transposed Matrix [${res.length}x${res[0].length}]`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleDeterminant = () => {
    clearResults();
    try {
      const det = MatrixCore.determinant(toNumericA());
      setResultScalar(`det(A) = ${parseFloat(det.toFixed(8))}`);
      setActiveOpName('Determinant |A|');
      onRecordHistory('Matrix', 'det(A)', det.toString());
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleInverse = () => {
    clearResults();
    try {
      const inv = MatrixCore.inverse(toNumericA());
      setResultMatrix(inv);
      setActiveOpName('Matrix Inverse (A⁻¹)');
      onRecordHistory('Matrix', 'inv(A)', 'Matrix Inverted Successfully');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleTrace = () => {
    clearResults();
    try {
      const tr = MatrixCore.trace(toNumericA());
      setResultScalar(`trace(A) = ${tr}`);
      setActiveOpName('Trace tr(A)');
      onRecordHistory('Matrix', 'trace(A)', tr.toString());
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleRank = () => {
    clearResults();
    try {
      const r = MatrixCore.rank(toNumericA());
      setResultScalar(`rank(A) = ${r}`);
      setActiveOpName('Matrix Rank');
      onRecordHistory('Matrix', 'rank(A)', r.toString());
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error');
    }
  };

  const handlePower = () => {
    clearResults();
    try {
      const res = MatrixCore.power(toNumericA(), powerK);
      setResultMatrix(res);
      setActiveOpName(`Matrix Power (A^${powerK})`);
      onRecordHistory('Matrix', `A^${powerK}`, 'Matrix Power Computed');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error');
    }
  };

  const handleSolveLinearSystem = () => {
    clearResults();
    try {
      const x = MatrixCore.solveSystem(toNumericA(), toNumericVecB());
      setResultVector(x);
      setActiveOpName('Linear System Solution (Ax = b)');
      onRecordHistory('Matrix', 'Ax = b', `x = [${x.map((v) => v.toFixed(4)).join(', ')}]`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error');
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 max-w-6xl mx-auto space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100 font-mono">
            Matrix Lab & Linear Algebra Studio
          </h2>
          <p className="text-xs text-slate-300">
            Arbitrary dimension matrix algebra, Gaussian determinant, inversion, rank, and system solver
          </p>
        </div>
      </div>

      {/* Matrix Editors Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matrix A Editor */}
        <div className="bg-slate-900 border-2 border-slate-700/80 rounded-xl shadow-xl p-4 space-y-3 ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-semibold text-sky-400">
              Matrix A [{rowsA} × {colsA}]
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Dim:</span>
              <select
                value={`${rowsA}x${colsA}`}
                onChange={(e) => {
                  const [r, c] = e.target.value.split('x').map(Number);
                  handleResizeA(r, c);
                }}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200"
              >
                <option value="2x2">2 × 2</option>
                <option value="3x3">3 × 3</option>
                <option value="4x4">4 × 4</option>
                <option value="2x3">2 × 3</option>
                <option value="3x2">3 × 2</option>
                <option value="3x4">3 × 4</option>
              </select>
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap gap-1.5 text-xs font-mono">
            <button
              onClick={() => applyPresetA('identity')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700/60 transition-colors"
            >
              Identity (I)
            </button>
            <button
              onClick={() => applyPresetA('zero')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700/60 transition-colors"
            >
              Zero
            </button>
            <button
              onClick={() => applyPresetA('random')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700/60 transition-colors"
            >
              Random
            </button>
            <button
              onClick={() => applyPresetA('hilbert')}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 border border-slate-700/60 transition-colors"
            >
              Hilbert
            </button>
          </div>

          {/* Matrix A Grid */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-x-auto shadow-inner">
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${colsA}, minmax(52px, 1fr))`,
              }}
            >
              {matrixA.map((row, r) =>
                row.map((val, c) => (
                  <input
                    key={`A-${r}-${c}`}
                    type="text"
                    inputMode="decimal"
                    value={val}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleCellChangeA(r, c, e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-center font-mono text-sm text-slate-100 focus:border-sky-400 focus:bg-slate-800/90 focus:outline-none transition-colors shadow-sm"
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Matrix B Editor */}
        <div className="bg-slate-900 border-2 border-slate-700/80 rounded-xl shadow-xl p-4 space-y-3 ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm font-semibold text-emerald-400">
              Matrix B [{rowsB} × {colsB}]
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Dim:</span>
              <select
                value={`${rowsB}x${colsB}`}
                onChange={(e) => {
                  const [r, c] = e.target.value.split('x').map(Number);
                  handleResizeB(r, c);
                }}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-200"
              >
                <option value="2x2">2 × 2</option>
                <option value="3x3">3 × 3</option>
                <option value="4x4">4 × 4</option>
                <option value="2x3">2 × 3</option>
                <option value="3x2">3 × 2</option>
                <option value="3x4">3 × 4</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono py-1">
            Used for binary operations (A + B, A - B, A × B)
          </div>

          {/* Matrix B Grid */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 overflow-x-auto shadow-inner">
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `repeat(${colsB}, minmax(52px, 1fr))`,
              }}
            >
              {matrixB.map((row, r) =>
                row.map((val, c) => (
                  <input
                    key={`B-${r}-${c}`}
                    type="text"
                    inputMode="decimal"
                    value={val}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleCellChangeB(r, c, e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-2 text-center font-mono text-sm text-slate-100 focus:border-emerald-400 focus:bg-slate-800/90 focus:outline-none transition-colors shadow-sm"
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Matrix Operations Toolbar */}
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-xl shadow-xl p-4 space-y-3 ring-1 ring-white/10">
        <span className="text-xs font-mono text-slate-400 font-semibold uppercase tracking-wider">
          Matrix Operations
        </span>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs font-mono">
          <button
            onClick={handleAdd}
            className="py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold rounded border border-slate-700/80 transition-colors shadow-sm"
          >
            A + B
          </button>
          <button
            onClick={handleSubtract}
            className="py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-300 font-semibold rounded border border-slate-700/80 transition-colors shadow-sm"
          >
            A - B
          </button>
          <button
            onClick={handleMultiply}
            className="py-2.5 bg-sky-700 hover:bg-sky-600 text-white font-bold rounded border border-sky-500/50 shadow-md transition-colors"
          >
            A × B
          </button>
          <button
            onClick={handleDeterminant}
            className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded border border-slate-700/80 transition-colors shadow-sm"
          >
            det(A)
          </button>
          <button
            onClick={handleInverse}
            className="py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold rounded border border-slate-700/80 transition-colors shadow-sm"
          >
            inv(A) A⁻¹
          </button>
          <button
            onClick={handleTranspose}
            className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded border border-slate-700/80 transition-colors shadow-sm"
          >
            transpose Aᵀ
          </button>
          <button
            onClick={handleRank}
            className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded border border-slate-700/80 transition-colors shadow-sm"
          >
            rank(A)
          </button>
          <button
            onClick={handleTrace}
            className="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded border border-slate-700/80 transition-colors shadow-sm"
          >
            trace(A)
          </button>

          {/* Scalar Mul */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-2">
            <span className="text-slate-400">k=</span>
            <input
              type="number"
              value={scalarK}
              onChange={(e) => setScalarK(parseFloat(e.target.value) || 1)}
              className="w-12 bg-transparent text-center text-slate-100 focus:outline-none"
            />
            <button
              onClick={handleMultiplyScalar}
              className="text-sky-400 hover:text-sky-300 font-bold ml-auto"
            >
              k·A
            </button>
          </div>

          {/* Matrix Power */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded px-2">
            <span className="text-slate-400">A^</span>
            <input
              type="number"
              value={powerK}
              onChange={(e) => setPowerK(parseInt(e.target.value, 10) || 1)}
              className="w-12 bg-transparent text-center text-slate-100 focus:outline-none"
            />
            <button
              onClick={handlePower}
              className="text-sky-400 hover:text-sky-300 font-bold ml-auto"
            >
              Calc
            </button>
          </div>
        </div>

        {/* System of Linear Equations Ax = b Solver */}
        <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-3">
          <span className="text-xs font-mono text-emerald-400 font-semibold">
            Solve Ax = b:
          </span>
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono">
            <span className="text-slate-400">b = [</span>
            {vectorB.map((val, idx) => (
              <input
                key={`vecB-${idx}`}
                type="text"
                inputMode="decimal"
                value={val}
                onFocus={(e) => e.target.select()}
                onChange={(e) => handleVectorChange(idx, e.target.value)}
                className="w-14 bg-slate-900 border border-slate-700 rounded text-center text-slate-100 focus:border-emerald-400 focus:outline-none px-1.5 py-1"
              />
            ))}
            <span className="text-slate-400">]ᵀ</span>
          </div>
          <button
            onClick={handleSolveLinearSystem}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-mono font-bold transition-colors shadow-md"
          >
            Solve System (x = A⁻¹b)
          </button>
        </div>
      </div>

      {/* Output / Result Matrix Display */}
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-xl shadow-xl p-5 space-y-3 ring-1 ring-white/10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-slate-300 font-semibold">
            COMPUTATION RESULT — {activeOpName}
          </span>
          {resultMatrix && (
            <button
              onClick={() => {
                // Copy result to Matrix A for chained operations
                setRowsA(resultMatrix.length);
                setColsA(resultMatrix[0].length);
                setMatrixA(
                  resultMatrix.map((row) =>
                    row.map((v) =>
                      Math.abs(v) < 1e-10 ? '0' : parseFloat(v.toFixed(6)).toString()
                    )
                  )
                );
              }}
              className="text-xs text-sky-400 hover:text-sky-300 font-mono flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Copy Result to Matrix A</span>
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-400 text-xs font-mono">
            Error: {errorMsg}
          </div>
        )}

        {resultScalar && (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono text-2xl font-bold text-sky-400 shadow-inner">
            {resultScalar}
          </div>
        )}

        {resultVector && (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg font-mono space-y-2 shadow-inner">
            <div className="text-xs text-slate-400">Solution Vector x:</div>
            <div className="flex flex-wrap gap-4">
              {resultVector.map((val, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-base">
                  <span className="text-sky-400">x{idx + 1} =</span>
                  <span className="font-bold text-slate-100">
                    {parseFloat(val.toFixed(6))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {resultMatrix && (
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg overflow-x-auto shadow-inner">
            <div
              className="grid gap-2 inline-grid"
              style={{
                gridTemplateColumns: `repeat(${resultMatrix[0].length}, minmax(64px, auto))`,
              }}
            >
              {resultMatrix.map((row, r) =>
                row.map((val, c) => (
                  <div
                    key={`res-${r}-${c}`}
                    className="p-2.5 bg-slate-900 border border-slate-800 rounded text-center font-mono text-sm text-sky-300 font-semibold shadow-sm"
                  >
                    {Math.abs(val) < 1e-10 ? 0 : parseFloat(val.toFixed(6))}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {!resultMatrix && !resultScalar && !resultVector && !errorMsg && (
          <div className="text-xs text-slate-400 font-mono text-center py-4">
            Select a matrix operation above to compute and display results.
          </div>
        )}
      </div>
    </div>
  );
};
