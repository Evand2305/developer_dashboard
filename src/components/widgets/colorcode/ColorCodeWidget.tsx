// Converts a 6-digit hex color to RGB and HSL with visual channel bars.
// Each result row has a Copy button that writes the formatted string to the clipboard.
import { useState } from 'react';
import '@/styles/components/colorcode.scss';

interface RGB { r: number; g: number; b: number }
interface HSL { h: number; s: number; l: number }

function hexToRgb(hex: string): RGB | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return isNaN(r + g + b) ? null : { r, g, b };
}

function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn)      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
  else if (max === gn) h = ((bn - rn) / d + 2) / 6;
  else                 h = ((rn - gn) / d + 4) / 6;
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function copyText(text: string) {
  void navigator.clipboard.writeText(text);
}

export default function ColorCodeWidget() {
  const [hex, setHex] = useState('');
  const [copied, setCopied] = useState('');

  const clean  = hex.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
  const rgb    = hexToRgb(clean);
  const hsl    = rgb ? rgbToHsl(rgb) : null;
  const valid  = rgb !== null;
  const color  = valid ? `#${clean}` : undefined;

  function handleCopy(text: string, label: string) {
    copyText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 1500);
  }

  const rgbStr = rgb  ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : '';
  const hslStr = hsl  ? `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)` : '';

  return (
    <div className="cc-widget">
      <div className="cc-input-row">
        <span className="cc-hash">#</span>
        <input
          className="cc-input"
          value={hex}
          onChange={(e) => setHex(e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6))}
          placeholder="1a2b3c"
          spellCheck={false}
          maxLength={6}
        />
        <div
          className="cc-swatch"
          style={{ background: color ?? 'transparent', border: valid ? 'none' : '1px solid var(--border-color)' }}
        />
      </div>

      {valid ? (
        <div className="cc-results">
          <div className="cc-result-row">
            <span className="cc-result-label">HEX</span>
            <span className="cc-result-value">{color}</span>
            <button className="cc-copy" onClick={() => handleCopy(color!, 'hex')}>
              {copied === 'hex' ? '✓' : 'Copy'}
            </button>
          </div>
          <div className="cc-result-row">
            <span className="cc-result-label">RGB</span>
            <span className="cc-result-value">{rgbStr}</span>
            <button className="cc-copy" onClick={() => handleCopy(rgbStr, 'rgb')}>
              {copied === 'rgb' ? '✓' : 'Copy'}
            </button>
          </div>
          <div className="cc-result-row">
            <span className="cc-result-label">HSL</span>
            <span className="cc-result-value">{hslStr}</span>
            <button className="cc-copy" onClick={() => handleCopy(hslStr, 'hsl')}>
              {copied === 'hsl' ? '✓' : 'Copy'}
            </button>
          </div>
          <div className="cc-rgb-bars">
            <div className="cc-bar-row">
              <span>R</span>
              <div className="cc-bar"><div className="cc-bar-fill cc-bar-r" style={{ width: `${(rgb!.r / 255) * 100}%` }} /></div>
              <span>{rgb!.r}</span>
            </div>
            <div className="cc-bar-row">
              <span>G</span>
              <div className="cc-bar"><div className="cc-bar-fill cc-bar-g" style={{ width: `${(rgb!.g / 255) * 100}%` }} /></div>
              <span>{rgb!.g}</span>
            </div>
            <div className="cc-bar-row">
              <span>B</span>
              <div className="cc-bar"><div className="cc-bar-fill cc-bar-b" style={{ width: `${(rgb!.b / 255) * 100}%` }} /></div>
              <span>{rgb!.b}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="cc-empty">Enter a 6-digit hex value to convert.</div>
      )}
    </div>
  );
}
