// Live number-base converter. Typing in any field updates the other two
// instantly. Invalid characters are stripped on input so parsing always succeeds.
import { useState } from 'react';
import '@/styles/components/converter.scss';

// Returns the parsed integer or null if the input is empty or invalid.
function toNum(value: string, base: number): number | null {
  if (!value) return null;
  const n = parseInt(value, base);
  return isNaN(n) || n < 0 ? null : n;
}

export default function ConverterWidget() {
  const [hex, setHex] = useState('');
  const [dec, setDec] = useState('');
  const [bin, setBin] = useState('');

  // Each handler strips disallowed characters, converts to a number, then
  // derives the other two representations from that same number.
  function handleHex(v: string) {
    const clean = v.toUpperCase().replace(/[^0-9A-F]/g, '');
    setHex(clean);
    const n = toNum(clean, 16);
    if (n !== null) { setDec(n.toString(10)); setBin(n.toString(2)); }
    else { setDec(''); setBin(''); }
  }

  function handleDec(v: string) {
    const clean = v.replace(/[^0-9]/g, '');
    setDec(clean);
    const n = toNum(clean, 10);
    if (n !== null) { setHex(n.toString(16).toUpperCase()); setBin(n.toString(2)); }
    else { setHex(''); setBin(''); }
  }

  function handleBin(v: string) {
    const clean = v.replace(/[^01]/g, '');
    setBin(clean);
    const n = toNum(clean, 2);
    if (n !== null) { setHex(n.toString(16).toUpperCase()); setDec(n.toString(10)); }
    else { setHex(''); setDec(''); }
  }

  function clear() { setHex(''); setDec(''); setBin(''); }

  return (
    <div className="conv-widget">
      <div className="conv-field">
        <label className="conv-label">HEX</label>
        <div className="conv-input-wrap">
          <span className="conv-prefix">0x</span>
          <input className="conv-input" value={hex}
            onChange={(e) => handleHex(e.target.value)} placeholder="1A3F" spellCheck={false} />
        </div>
      </div>
      <div className="conv-field">
        <label className="conv-label">DEC</label>
        <input className="conv-input conv-input--full" value={dec}
          onChange={(e) => handleDec(e.target.value)} placeholder="6719" spellCheck={false} />
      </div>
      <div className="conv-field">
        <label className="conv-label">BIN</label>
        <input className="conv-input conv-input--full conv-input--mono" value={bin}
          onChange={(e) => handleBin(e.target.value)} placeholder="1101000111111" spellCheck={false} />
      </div>
      <button className="conv-clear" onClick={clear}>Clear</button>
    </div>
  );
}
