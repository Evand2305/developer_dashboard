// Standard 4-function calculator. State machine tracks the current display
// value, the pending operator, and the previous operand. fresh=true means the
// next digit press starts a new number rather than appending to the current one.
import { useState } from 'react';
import '@/styles/components/calculator.scss';

const OPS = ['+', '−', '×', '÷'];

function compute(a: number, op: string, b: number): number {
  switch (op) {
    case '+': return a + b;
    case '−': return a - b;
    case '×': return a * b;
    case '÷': return b !== 0 ? a / b : NaN;
    default:  return b;
  }
}

function fmt(n: number): string {
  if (!isFinite(n)) return 'Error';
  const s = parseFloat(n.toPrecision(10)).toString();
  return s.length > 14 ? parseFloat(n.toFixed(6)).toString() : s;
}

const BUTTONS = [
  { label: 'C',  kind: 'fn' },
  { label: '±',  kind: 'fn' },
  { label: '%',  kind: 'fn' },
  { label: '÷',  kind: 'op' },
  { label: '7',  kind: 'num' },
  { label: '8',  kind: 'num' },
  { label: '9',  kind: 'num' },
  { label: '×',  kind: 'op' },
  { label: '4',  kind: 'num' },
  { label: '5',  kind: 'num' },
  { label: '6',  kind: 'num' },
  { label: '−',  kind: 'op' },
  { label: '1',  kind: 'num' },
  { label: '2',  kind: 'num' },
  { label: '3',  kind: 'num' },
  { label: '+',  kind: 'op' },
  { label: '0',  kind: 'zero' },
  { label: '.',  kind: 'num' },
  { label: '=',  kind: 'eq' },
] as const;

export default function CalculatorWidget() {
  const [current, setCurrent] = useState('0');
  const [prev, setPrev]       = useState<number | null>(null);
  const [op, setOp]           = useState<string | null>(null);
  const [expr, setExpr]       = useState('');
  const [fresh, setFresh]     = useState(false);

  function digit(d: string) {
    if (fresh || current === '0') {
      setCurrent(d);
      setFresh(false);
    } else if (current.length < 14) {
      setCurrent(current + d);
    }
  }

  function decimal() {
    if (fresh) { setCurrent('0.'); setFresh(false); return; }
    if (!current.includes('.')) setCurrent(current + '.');
  }

  function clear() {
    setCurrent('0'); setPrev(null); setOp(null); setExpr(''); setFresh(false);
  }

  function toggleSign() {
    setCurrent(current.startsWith('-') ? current.slice(1) : '-' + current);
  }

  function percent() {
    const v = parseFloat(current);
    if (!isNaN(v)) setCurrent(fmt(v / 100));
  }

  function operator(nextOp: string) {
    const val = parseFloat(current);
    if (op && prev !== null && !fresh) {
      const result = compute(prev, op, val);
      setCurrent(fmt(result));
      setPrev(result);
      setExpr(`${fmt(result)} ${nextOp}`);
    } else {
      setPrev(val);
      setExpr(`${current} ${nextOp}`);
    }
    setOp(nextOp);
    setFresh(true);
  }

  function equals() {
    if (!op || prev === null) return;
    const val    = parseFloat(current);
    const result = compute(prev, op, val);
    setExpr(`${expr} ${current} =`);
    setCurrent(fmt(result));
    setPrev(null); setOp(null); setFresh(true);
  }

  function press(label: string) {
    if ('0123456789'.includes(label)) return digit(label);
    switch (label) {
      case '.':  return decimal();
      case 'C':  return clear();
      case '±':  return toggleSign();
      case '%':  return percent();
      case '=':  return equals();
      default:   return operator(label);
    }
  }

  return (
    <div className="calc-widget">
      <div className="calc-display">
        <div className="calc-expr">{expr || ' '}</div>
        <div className="calc-current">{current}</div>
      </div>
      <div className="calc-buttons">
        {BUTTONS.map(({ label, kind }) => (
          <button
            key={label}
            className={`calc-btn calc-btn--${kind}`}
            onClick={() => press(label)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
