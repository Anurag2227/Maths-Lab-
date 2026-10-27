import React, { useState, useEffect, useCallback } from 'react';
import { Delete, RotateCcw, ArrowRight } from 'lucide-react';
import { mathCore } from '../engine/mathCore';

interface ScientificCalculatorProps {
  onRecordHistory: (workspace: string, expr: string, result: string) => void;
  angleUnit: 'radians' | 'degrees';
}

export const ScientificCalculator: React.FC<ScientificCalculatorProps> = ({
  onRecordHistory,
  angleUnit,
}) => {
  const [expression, setExpression] = useState<string>('');
  const [resultDisplay, setResultDisplay] = useState<string>('0');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSecondMode, setIsSecondMode] = useState<boolean>(false);
  const [justCalculated, setJustCalculated] = useState<boolean>(false);

  useEffect(() => {
    mathCore.setContext({ angleUnit });
  }, [angleUnit]);

  const handleEvaluate = useCallback(() => {
    const rawExpr = expression || resultDisplay;
    if (!rawExpr || rawExpr === '0') return;

    // Automatically complete any unclosed brackets both visually and computationally
    const exprToEval = mathCore.autoCloseBrackets(rawExpr);
    if (exprToEval !== expression) {
      setExpression(exprToEval);
    }

    try {
      const res = mathCore.evaluate(exprToEval);
      const formatted = mathCore.formatResult(res);
      setResultDisplay(formatted);
      onRecordHistory('Scientific', exprToEval, formatted);
      setErrorMsg(null);
      setJustCalculated(true);
    } catch (err: unknown) {
      const formattedErr = mathCore.formatErrorMessage(err);
      setResultDisplay('Mathematical Error');
      setErrorMsg(formattedErr);
      setJustCalculated(true);
    }
  }, [expression, resultDisplay, onRecordHistory]);

  const insertToken = useCallback((token: string) => {
    setErrorMsg(null);
    if (justCalculated) {
      if (resultDisplay === 'Mathematical Error') {
        setExpression(token);
        setResultDisplay('0');
      } else if (['+', '-', '×', '÷', '*', '/', '^', '%'].includes(token.trim())) {
        setExpression(resultDisplay + token);
      } else if (
        ['sqrt(', 'root(', 'cbrt(', 'sin(', 'cos(', 'tan(', 'asin(', 'acos(', 'atan(',
         'sinh(', 'cosh(', 'tanh(', 'asinh(', 'acosh(', 'atanh(', 'ln(', 'log10(',
         'log2(', 'exp(', '10^(', '(', 'pi', 'e', 'tau', 'phi'].includes(token.trim())
      ) {
        // Multiplies the previous result by the function or constant: e.g. 16777216 × sqrt(
        setExpression(resultDisplay + ' × ' + token);
      } else {
        setExpression(token);
      }
      setJustCalculated(false);
      return;
    }
    setExpression((prev) => prev + token);
  }, [justCalculated, resultDisplay]);

  const handleClear = () => {
    setExpression('');
    setResultDisplay('0');
    setErrorMsg(null);
    setJustCalculated(false);
  };

  const handleBackspace = () => {
    setErrorMsg(null);
    setExpression((prev) => (prev.length > 0 ? prev.slice(0, -1) : ''));
  };

  const handleNegate = () => {
    setErrorMsg(null);
    if (!expression) {
      if (resultDisplay && resultDisplay !== '0') {
        const negated = resultDisplay.startsWith('-') ? resultDisplay.slice(1) : '-' + resultDisplay;
        setResultDisplay(negated);
      }
      return;
    }
    if (expression.startsWith('-(') && expression.endsWith(')')) {
      setExpression(expression.slice(2, -1));
    } else {
      setExpression(`-(${expression})`);
    }
  };

  // Keyboard Event Listener
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key >= '0' && e.key <= '9') {
        insertToken(e.key);
      } else if (e.key === '.') {
        insertToken('.');
      } else if (e.key === '+') {
        insertToken(' + ');
      } else if (e.key === '-') {
        insertToken(' - ');
      } else if (e.key === '*') {
        insertToken(' × ');
      } else if (e.key === '/') {
        e.preventDefault();
        insertToken(' ÷ ');
      } else if (e.key === '(' || e.key === ')') {
        insertToken(e.key);
      } else if (e.key === '^') {
        insertToken('^');
      } else if (e.key === 'r' || e.key === 's') {
        insertToken('sqrt(');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEvaluate();
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [insertToken, handleEvaluate]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 max-w-4xl mx-auto">
      {/* High-contrast calculator body card */}
      <div className="w-full bg-slate-900 border-2 border-slate-700/80 rounded-xl shadow-2xl p-5 flex flex-col gap-4 ring-1 ring-white/10">
        {/* Output Screen */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 text-right flex flex-col justify-between min-h-[110px] shadow-inner">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 mb-1">
            <span className="uppercase text-sky-400 font-semibold tracking-wider">
              {angleUnit} MODE {isSecondMode && '· 2nd ACTIVE'}
            </span>
            <span className="text-slate-400">PRECISION: {mathCore.precision} DIGITS</span>
          </div>
          <div className="text-slate-300 font-mono text-base tracking-wide overflow-x-auto whitespace-nowrap min-h-[24px]">
            {expression || ' '}
          </div>
          <div className={`${resultDisplay === 'Mathematical Error' ? 'text-rose-400 text-2xl font-bold' : 'text-slate-100 text-3xl font-semibold'} font-mono tracking-tight overflow-x-auto whitespace-nowrap`}>
            {resultDisplay}
          </div>
          {errorMsg && (
            <div className="text-rose-400 text-xs font-mono mt-1 text-left font-medium">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Function Keypad Grid: 8 Columns */}
        <div className="grid grid-cols-8 gap-1.5 font-mono text-xs">
          {/* Row 1: 2nd, Trig, Logs, Clear, Negate */}
          <button
            onClick={() => setIsSecondMode(!isSecondMode)}
            className={`py-2 rounded font-semibold transition-colors shadow-sm ${
              isSecondMode
                ? 'bg-sky-500 text-white font-bold ring-2 ring-sky-300'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
            title="Toggle Inverse / Alternate Functions"
          >
            2nd
          </button>
          <button
            onClick={() => insertToken(isSecondMode ? 'asin(' : 'sin(')}
            className="py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded border border-slate-800 transition-colors"
          >
            {isSecondMode ? 'sin⁻¹' : 'sin'}
          </button>
          <button
            onClick={() => insertToken(isSecondMode ? 'acos(' : 'cos(')}
            className="py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded border border-slate-800 transition-colors"
          >
            {isSecondMode ? 'cos⁻¹' : 'cos'}
          </button>
          <button
            onClick={() => insertToken(isSecondMode ? 'atan(' : 'tan(')}
            className="py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded border border-slate-800 transition-colors"
          >
            {isSecondMode ? 'tan⁻¹' : 'tan'}
          </button>
          <button
            onClick={() => insertToken(isSecondMode ? 'exp(' : 'ln(')}
            className="py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded border border-slate-800 transition-colors"
          >
            {isSecondMode ? 'eˣ' : 'ln'}
          </button>
          <button
            onClick={() => insertToken(isSecondMode ? '10^(' : 'log10(')}
            className="py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded border border-slate-800 transition-colors"
          >
            {isSecondMode ? '10ˣ' : 'log₁₀'}
          </button>
          <button
            onClick={handleClear}
            className="py-2 bg-slate-800 text-rose-400 font-bold rounded border border-slate-800 hover:bg-slate-700 flex items-center justify-center gap-1 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>C</span>
          </button>
          <button
            onClick={handleNegate}
            className="py-2 bg-slate-800 text-slate-200 font-bold rounded border border-slate-800 hover:bg-slate-700 text-sm"
            title="Negate (±)"
          >
            ±
          </button>

          {/* Row 2: Hyperbolic, Exp, Parens, Divide */}
          <button
            onClick={() => insertToken(isSecondMode ? 'asinh(' : 'sinh(')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800"
          >
            {isSecondMode ? 'asinh' : 'sinh'}
          </button>
          <button
            onClick={() => insertToken(isSecondMode ? 'acosh(' : 'cosh(')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800"
          >
            {isSecondMode ? 'acosh' : 'cosh'}
          </button>
          <button
            onClick={() => insertToken(isSecondMode ? 'atanh(' : 'tanh(')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800"
          >
            {isSecondMode ? 'atanh' : 'tanh'}
          </button>
          <button
            onClick={() => insertToken('exp(')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800"
          >
            eˣ
          </button>
          <button
            onClick={() => insertToken('10^(')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800"
          >
            10ˣ
          </button>
          <button
            onClick={() => insertToken('(')}
            className="py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded border border-slate-800"
          >
            (
          </button>
          <button
            onClick={() => insertToken(')')}
            className="py-2 bg-slate-800/90 hover:bg-slate-700 text-slate-300 rounded border border-slate-800"
          >
            )
          </button>
          <button
            onClick={() => insertToken(' ÷ ')}
            className="py-2 bg-slate-800 hover:bg-sky-600/30 text-sky-400 font-bold rounded border border-slate-700/60 text-base"
          >
            ÷
          </button>

          {/* Row 3: Powers & Numbers 7 8 9 × */}
          <button
            onClick={() => insertToken('^2')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800"
          >
            x²
          </button>
          <button
            onClick={() => insertToken('^3')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800"
          >
            x³
          </button>
          <button
            onClick={() => insertToken(isSecondMode ? 'root(' : '^')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800"
          >
            {isSecondMode ? 'ⁿ√x' : 'xʸ'}
          </button>
          <button
            onClick={() => insertToken('sqrt(')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800"
          >
            √x
          </button>
          <button
            onClick={() => insertToken('7')}
            className="py-2 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 text-base shadow-sm"
          >
            7
          </button>
          <button
            onClick={() => insertToken('8')}
            className="py-2 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 text-base shadow-sm"
          >
            8
          </button>
          <button
            onClick={() => insertToken('9')}
            className="py-2 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 text-base shadow-sm"
          >
            9
          </button>
          <button
            onClick={() => insertToken(' × ')}
            className="py-2 bg-slate-800 hover:bg-sky-600/30 text-sky-400 font-bold rounded border border-slate-700/60 text-base"
          >
            ×
          </button>

          {/* Row 4: Combinatorics & Numbers 4 5 6 - */}
          <button
            onClick={() => insertToken(isSecondMode ? 'nPr(' : 'fact(')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800"
          >
            {isSecondMode ? 'nPr' : 'n!'}
          </button>
          <button
            onClick={() => insertToken(isSecondMode ? 'nCr(' : 'cbrt(')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800"
          >
            {isSecondMode ? 'nCr' : '∛x'}
          </button>
          <button
            onClick={() => insertToken('abs(')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800"
          >
            |x|
          </button>
          <button
            onClick={() => insertToken(' % ')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800"
          >
            mod
          </button>
          <button
            onClick={() => insertToken('4')}
            className="py-2 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 text-base shadow-sm"
          >
            4
          </button>
          <button
            onClick={() => insertToken('5')}
            className="py-2 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 text-base shadow-sm"
          >
            5
          </button>
          <button
            onClick={() => insertToken('6')}
            className="py-2 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 text-base shadow-sm"
          >
            6
          </button>
          <button
            onClick={() => insertToken(' - ')}
            className="py-2 bg-slate-800 hover:bg-sky-600/30 text-sky-400 font-bold rounded border border-slate-700/60 text-base"
          >
            -
          </button>

          {/* Row 5: Constants & Numbers 1 2 3 + */}
          <button
            onClick={() => insertToken('pi')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800 font-serif text-sm"
          >
            π
          </button>
          <button
            onClick={() => insertToken('e')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800 font-serif text-sm"
          >
            e
          </button>
          <button
            onClick={() => insertToken('1/(')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800"
          >
            1/x
          </button>
          <button
            onClick={() => insertToken('log2(')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800"
          >
            log₂
          </button>
          <button
            onClick={() => insertToken('1')}
            className="py-2 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 text-base shadow-sm"
          >
            1
          </button>
          <button
            onClick={() => insertToken('2')}
            className="py-2 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 text-base shadow-sm"
          >
            2
          </button>
          <button
            onClick={() => insertToken('3')}
            className="py-2 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 text-base shadow-sm"
          >
            3
          </button>
          <button
            onClick={() => insertToken(' + ')}
            className="py-2 bg-slate-800 hover:bg-sky-600/30 text-sky-400 font-bold rounded border border-slate-700/60 text-base"
          >
            +
          </button>

          {/* Row 6 (BOTTOM ROW): Constants, 0, Dot, Backspace (prominent & highlighted), Evaluate */}
          <button
            onClick={() => insertToken('tau')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800 font-serif"
          >
            τ
          </button>
          <button
            onClick={() => insertToken('phi')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800 font-serif"
          >
            φ
          </button>
          <button
            onClick={() => insertToken('deg(')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800"
          >
            deg
          </button>
          <button
            onClick={() => insertToken('rad(')}
            className="py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-800"
          >
            rad
          </button>
          <button
            onClick={() => insertToken('0')}
            className="py-2 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 text-base shadow-sm"
          >
            0
          </button>
          <button
            onClick={() => insertToken('.')}
            className="py-2 bg-slate-950 hover:bg-slate-800 text-slate-100 font-semibold rounded border border-slate-800 text-base shadow-sm"
          >
            .
          </button>
          {/* Backspace Button on Bottom Row, placed right beside Equal/Evaluate, enlarged & highlighted */}
          <button
            onClick={handleBackspace}
            className="py-2.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold rounded-lg border border-amber-400/60 shadow-md transition-all flex items-center justify-center gap-1"
            title="Backspace (Delete last character)"
          >
            <Delete className="w-4 h-4" />
            <span className="font-mono text-xs font-bold">⌫</span>
          </button>
          {/* Evaluate / Equal Button */}
          <button
            onClick={handleEvaluate}
            className="py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold rounded-lg border border-sky-400/60 shadow-md transition-all text-base flex items-center justify-center gap-1"
          >
            <ArrowRight className="w-4 h-4" />
            <span>=</span>
          </button>
        </div>
      </div>
    </div>
  );
};
