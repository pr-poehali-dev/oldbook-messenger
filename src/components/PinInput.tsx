import { useState } from 'react';

interface PinInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  onClear?: () => void;
  label?: string;
  error?: string;
}

export default function PinInput({ length = 6, onComplete, onClear, label, error }: PinInputProps) {
  const [pin, setPin] = useState('');

  const addDigit = (d: string) => {
    if (pin.length >= length) return;
    const next = pin + d;
    setPin(next);
    if (next.length === length) {
      setTimeout(() => {
        onComplete(next);
        setPin('');
      }, 120);
    }
  };

  const backspace = () => {
    setPin(p => p.slice(0, -1));
    if (onClear && pin.length === 0) onClear();
  };

  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div className="flex flex-col items-center gap-6">
      {label && (
        <p className="font-cormorant text-ink-light text-lg italic tracking-wide">{label}</p>
      )}

      {/* Dots */}
      <div className="flex gap-3">
        {Array.from({ length }).map((_, i) => (
          <div
            key={i}
            className={`pin-dot ${i < pin.length ? 'filled' : ''}`}
          />
        ))}
      </div>

      {error && (
        <p className="text-aged-red text-sm font-cormorant italic animate-fade-in">{error}</p>
      )}

      {/* Numpad */}
      <div className="grid grid-cols-3 gap-3 w-64">
        {keys.map((k, i) => (
          k === '' ? (
            <div key={i} />
          ) : (
            <button
              key={i}
              onClick={() => k === '⌫' ? backspace() : addDigit(k)}
              className={`
                h-14 rounded-sm font-cormorant text-xl font-medium
                transition-all duration-150 active:scale-95
                ${k === '⌫'
                  ? 'bg-transparent text-ink-faded hover:text-aged-red text-2xl'
                  : 'sepia-card hover:bg-sepia-mid text-ink'
                }
              `}
              style={{
                background: k === '⌫' ? 'transparent' : undefined,
              }}
            >
              {k}
            </button>
          )
        ))}
      </div>
    </div>
  );
}
