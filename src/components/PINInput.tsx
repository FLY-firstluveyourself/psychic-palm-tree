import React, { useState, useRef, useEffect } from 'react';
import './PINInput.css';

interface PINInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  onPINChange?: (pin: string) => void;
  error?: string;
  disabled?: boolean;
}

const PINInput: React.FC<PINInputProps> = ({
  length = 6,
  onComplete,
  onPINChange,
  error,
  disabled = false,
}) => {
  const [pin, setPIN] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input on mount
    if (inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [disabled]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newPIN = [...pin];
    newPIN[index] = value;
    setPIN(newPIN);

    // Notify parent of PIN change
    if (onPINChange) {
      onPINChange(newPIN.join(''));
    }

    // Auto-focus next input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if PIN is complete
    if (newPIN.every((digit) => digit !== '') && newPIN.join('').length === length) {
      onComplete(newPIN.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!pin[index] && index > 0) {
        // Move to previous input if current is empty
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newPIN = [...pin];
        newPIN[index] = '';
        setPIN(newPIN);
        if (onPINChange) {
          onPINChange(newPIN.join(''));
        }
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').slice(0, length);
    
    if (/^\d+$/.test(pastedData)) {
      const newPIN = pastedData.split('').concat(Array(length).fill('')).slice(0, length);
      setPIN(newPIN);
      
      if (onPINChange) {
        onPINChange(newPIN.join(''));
      }

      // Focus last filled input or first empty
      const lastFilledIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[lastFilledIndex]?.focus();

      if (pastedData.length === length) {
        onComplete(pastedData);
      }
    }
  };

  const clearPIN = () => {
    setPIN(Array(length).fill(''));
    inputRefs.current[0]?.focus();
    if (onPINChange) {
      onPINChange('');
    }
  };

  return (
    <div className="pin-input-container">
      <div className="pin-input-wrapper">
        {pin.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="password"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            disabled={disabled}
            className={`pin-digit ${error ? 'error' : ''} ${digit ? 'filled' : ''}`}
            autoComplete="off"
          />
        ))}
      </div>
      
      {error && (
        <div className="pin-error">
          <span className="error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}
      
      {pin.some((d) => d !== '') && !disabled && (
        <button onClick={clearPIN} className="clear-pin-btn">
          Clear
        </button>
      )}
    </div>
  );
};

export default PINInput;
