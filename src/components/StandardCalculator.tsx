import React, { useState, useEffect, useCallback } from 'react';
import { Delete, RotateCcw } from 'lucide-react';
import { mathCore } from '../engine/mathCore';

interface StandardCalculatorProps {
  onRecordHistory: (workspace: string, expr: string, result: string) => void;
  angleUnit: 'radians' | 'degrees';
}

export const StandardCalculator: React.FC<StandardCalculatorProps> = ({
  onRecordHistory,
  angleUnit,
}) => {
  const [expression, setExpression] = useState<string>('');
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [memory, setMemory] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [justCalculated, setJustCalculated] = useState<boolean>(false);

  // Sync angle unit with math core
  useEffect(() => {
    mathCore.setContext({ angleUnit });
  }, [angleUnit]);

  const handleCalculate = useCallback(() => {
    const rawExpr = expression || displayValue;
    if (!rawExpr || rawExpr === '0') return;

    // Automatically complete any unclosed brackets both visually and computationally
    const exprToEval = mathCore.autoCloseBrackets(rawExpr);
    if (exprToEval !== expression) {
      setExpression(exprToEval);
    }

    try {
      const res = mathCore.evaluate(exprToEval);
      const formatted = mathCore.formatResult(res);
      setDisplayValue(formatted);
      onRecordHistory('Standard', exprToEval, formatted);
      setJustCalculated(true);
      setErrorMsg(null);
    } catch (err: unknown) {
      const formattedErr = mathCore.formatErrorMessage(err);
      setDisplayValue('Mathematical Error');
      setErrorMsg(formattedErr);
      setJustCalculated(true);
    }
  }, [expression, displayValue, onRecordHistory]);

  const handleInput = useCallback((val: string) => {
    setErrorMsg(null);
    if (justCalculated) {
      if (displayValue === 'Mathematical Error') {
        setExpression(val);
        setDisplayValue(val);
      } else if (['+', '-', '×', '÷', '*', '/', '^', '%'].includes(val.trim())) {
        // Continuing calculation with operator
        setExpression(displayValue + ' ' + val.trim() + ' ');
      } else if (val.trim() === '(' || val.trim() === 'sqrt(') {
        // Chaining with parenthesis or sqrt function: e.g. 16777216 × sqrt(
        setExpression(displayValue + ' × ' + val.trim());
      } else {
        setExpression(val);
        setDisplayValue(val);
      }
      setJustCalculated(false);
      return;
    }

    setExpression((prev) => prev + val);
  }, [justCalculated, displayValue]);

  const handleClear = () => {
    setExpression('');
    setDisplayValue('0');
    setErrorMsg(null);
    setJustCalculated(false);
  };

  const handleBackspace = () => {
    setErrorMsg(null);
    if (expression.length > 0) {
      setExpression((prev) => prev.slice(0, -1));
    } else {
      setDisplayValue('0');
    }
  };

  const handleReciprocal = () => {
    setErrorMsg(null);
    const target = parseFloat(displayValue || expression || '0');
    if (isNaN(target)) return;
    if (target === 0) {
      setErrorMsg('Mathematical Error: Cannot divide by zero');
      setDisplayValue('Mathematical Error');
      return;
    }
    const res = 1 / target;
    const formatted = mathCore.formatResult(res);
    setDisplayValue(formatted);
    setExpression(`1/(${target})`);
    onRecordHistory('Standard', `1/(${target})`, formatted);
    setJustCalculated(true);
  };

  const handleSqrt = () => {
    setErrorMsg(null);
    // Case 1: Result was just calculated (e.g. 8^8 = 16777216)
    // User wants to write root in its multiple: e.g. 16777216 × sqrt(
    if (justCalculated && displayValue && displayValue !== 'Mathematical Error') {
      setExpression(displayValue + ' × sqrt(');
      setJustCalculated(false);
      return;
    }

    // Case 2: Expression ends with an operator, opening parenthesis, or is empty
    // e.g. "16777216 × " or "( " or ""
    const trimmed = expression.trim();
    const endsWithOp =
      !trimmed ||
      ['+', '-', '×', '÷', '*', '/', '^', '%', '('].some((op) => trimmed.endsWith(op));

    if (endsWithOp) {
      setExpression((prev) => prev + 'sqrt(');
      return;
    }

    // Case 3: User entered a number and clicked √x
    // Chain with multiplication so user can enter root value without directly rooting (e.g. 16777216 × sqrt()
    setExpression((prev) => prev + ' × sqrt(');
  };

  const handleNegate = () => {
    if (displayValue && displayValue !== '0') {
      if (displayValue.startsWith('-')) {
        setDisplayValue(displayValue.slice(1));
      } else {
        setDisplayValue('-' + displayValue);
      }
    }
  };

  // Memory Handlers
  const handleMemoryClear = () => setMemory(0);
  const handleMemoryRecall = () => {
    handleInput(memory.toString());
  };
  const handleMemoryAdd = () => {
    const val = parseFloat(displayValue) || 0;
    setMemory((prev) => prev + val);
  };
  const handleMemorySubtract = () => {
    const val = parseFloat(displayValue) || 0;
    setMemory((prev) => prev - val);
  };
  const handleMemoryStore = () => {
    const val = parseFloat(displayValue) || 0;
    setMemory(val);
  };

  // Keyboard Event Listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key >= '0' && e.key <= '9') {
        handleInput(e.key);
      } else if (e.key === '.') {
        handleInput('.');
      } else if (e.key === '+') {
        handleInput(' + ');
      } else if (e.key === '-') {
        handleInput(' - ');
      } else if (e.key === '*') {
        handleInput(' × ');
      } else if (e.key === '/') {
        e.preventDefault();
        handleInput(' ÷ ');
      } else if (e.key === '(' || e.key === ')') {
        handleInput(e.key);
      } else if (e.key === '^') {
        handleInput('^');
      } else if (e.key === 'r' || e.key === 's') {
        handleSqrt();
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleCalculate();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleInput, handleCalculate]);

  return (
    <div className="h-full flex items-center justify-center p-4">
      {/* High-contrast calculator body card */}
      <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700/80 rounded-xl shadow-2xl p-5 flex flex-col gap-4 ring-1 ring-white/10">
        {/* Display Screen */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-right flex flex-col justify-between min-h-[105px] shadow-inner">
          <div className="text-slate-400 font-mono text-sm tracking-wide overflow-x-auto whitespace-nowrap min-h-[20px]">
            {expression || ' '}
          </div>
          <div className={`${displayValue === 'Mathematical Error' ? 'text-rose-400 text-2xl font-bold' : 'text-slate-100 text-3xl font-semibold'} font-mono tracking-tight overflow-x-auto whitespace-nowrap`}>
            {displayValue}
          </div>
          {errorMsg && (
            <div className="text-rose-400 text-xs font-mono mt-1 text-left">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Memory Bar */}
        <div className="grid grid-cols-5 gap-1.5 text-xs font-mono font-medium">
          <button
            onClick={handleMemoryClear}
            className={`py-1.5 rounded border border-slate-800 transition-colors ${
              memory !== 0 ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-950 text-slate-600'
            }`}
            title="Memory Clear"
          >
            MC
          </button>
          <button
            onClick={handleMemoryRecall}
            className={`py-1.5 rounded border border-slate-800 transition-colors ${
              memory !== 0 ? 'bg-slate-800 text-sky-400 hover:bg-slate-700 font-bold' : 'bg-slate-950 text-slate-600'
            }`}
            title="Memory Recall"
          >
            MR
          </button>
          <button
            onClick={handleMemoryAdd}
            className="py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800 transition-colors"
            title="Memory Add"
          >
            M+
          </button>
          <button
            onClick={handleMemorySubtract}
            className="py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800 transition-colors"
            title="Memory Subtract"
          >
            M-
          </button>
          <button
            onClick={handleMemoryStore}
            className="py-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800 transition-colors"
            title="Memory Store"
          >
            MS
          </button>
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-4 gap-2 font-mono">
          {/* Row 1: Clear, Negate, Power, Divide */}
          <button
            onClick={handleClear}
            className="py-3 bg-slate-800/90 hover:bg-slate-700 text-rose-400 font-semibold rounded border border-slate-800 transition-colors flex items-center justify-center gap-1 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>C</span>
          </button>
          <button
            onClick={handleNegate}
            className="py-3 bg-slate-800/90 hover:bg-slate-700 text-slate-200 font-semibold rounded border border-slate-800 transition-colors text-base"
          >
            ±
          </button>
          <button
            onClick={() => handleInput('^')}
            className="py-3 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded border border-slate-800 transition-colors"
          >
            xʸ
          </button>
          <button
            onClick={() => handleInput(' ÷ ')}
            className="py-3 bg-slate-800 hover:bg-sky-600/30 text-sky-400 font-bold rounded border border-slate-700/60 transition-colors text-lg"
          >
            ÷
          </button>

          {/* Row 2: Sqrt, Parens, Multiply */}
          <button
            onClick={handleSqrt}
            className="py-3 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded border border-slate-800 transition-colors"
          >
            √x
          </button>
          <button
            onClick={() => handleInput('(')}
            className="py-3 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded border border-slate-800 transition-colors"
          >
            (
          </button>
          <button
            onClick={() => handleInput(')')}
            className="py-3 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded border border-slate-800 transition-colors"
          >
            )
          </button>
          <button
            onClick={() => handleInput(' × ')}
            className="py-3 bg-slate-800 hover:bg-sky-600/30 text-sky-400 font-bold rounded border border-slate-700/60 transition-colors text-lg"
          >
            ×
          </button>

          {/* Row 3: 7 8 9 - */}
          <button
            onClick={() => handleInput('7')}
            className="py-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 transition-colors text-lg shadow-sm"
          >
            7
          </button>
          <button
            onClick={() => handleInput('8')}
            className="py-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 transition-colors text-lg shadow-sm"
          >
            8
          </button>
          <button
            onClick={() => handleInput('9')}
            className="py-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 transition-colors text-lg shadow-sm"
          >
            9
          </button>
          <button
            onClick={() => handleInput(' - ')}
            className="py-3 bg-slate-800 hover:bg-sky-600/30 text-sky-400 font-bold rounded border border-slate-700/60 transition-colors text-lg"
          >
            -
          </button>

          {/* Row 4: 4 5 6 + */}
          <button
            onClick={() => handleInput('4')}
            className="py-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 transition-colors text-lg shadow-sm"
          >
            4
          </button>
          <button
            onClick={() => handleInput('5')}
            className="py-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 transition-colors text-lg shadow-sm"
          >
            5
          </button>
          <button
            onClick={() => handleInput('6')}
            className="py-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 transition-colors text-lg shadow-sm"
          >
            6
          </button>
          <button
            onClick={() => handleInput(' + ')}
            className="py-3 bg-slate-800 hover:bg-sky-600/30 text-sky-400 font-bold rounded border border-slate-700/60 transition-colors text-lg"
          >
            +
          </button>

          {/* Row 5: 1 2 3 1/x */}
          <button
            onClick={() => handleInput('1')}
            className="py-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 transition-colors text-lg shadow-sm"
          >
            1
          </button>
          <button
            onClick={() => handleInput('2')}
            className="py-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 transition-colors text-lg shadow-sm"
          >
            2
          </button>
          <button
            onClick={() => handleInput('3')}
            className="py-3 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 transition-colors text-lg shadow-sm"
          >
            3
          </button>
          <button
            onClick={handleReciprocal}
            className="py-3 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded border border-slate-800 transition-colors"
          >
            1/x
          </button>

          {/* Row 6 (BOTTOM ROW): 0, Dot, Backspace (prominent & highlighted), Equal */}
          <button
            onClick={() => handleInput('0')}
            className="py-3.5 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 transition-colors text-lg shadow-sm"
          >
            0
          </button>
          <button
            onClick={() => handleInput('.')}
            className="py-3.5 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 transition-colors text-lg shadow-sm"
          >
            .
          </button>
          {/* Backspace Button placed right beside Equal, slightly enlarged and highlighted in amber */}
          <button
            onClick={handleBackspace}
            className="py-3.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold rounded-lg border border-amber-400/60 shadow-md transition-all flex items-center justify-center gap-1.5"
            title="Backspace (Delete last character)"
          >
            <Delete className="w-5 h-5" />
            <span className="text-xs font-mono font-bold tracking-wider">⌫</span>
          </button>
          {/* Equal Button */}
          <button
            onClick={handleCalculate}
            className="py-3.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold rounded-lg border border-sky-400/60 shadow-md transition-all text-2xl flex items-center justify-center"
          >
            =
          </button>
        </div>
      </div>
    </div>
  );
};
