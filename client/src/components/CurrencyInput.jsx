import { useState, useEffect, useRef } from 'react';
import { formatRupiah, parseRupiah } from '../lib/currency';

export default function CurrencyInput({ value, onChange, placeholder, className, required, disabled, name, id }) {
  const [display, setDisplay] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (document.activeElement !== ref.current) {
      setDisplay(value != null && value !== '' && !isNaN(value) ? formatRupiah(value) : '');
    }
  }, [value]);

  const handleChange = (e) => {
    const raw = e.target.value;
    const num = parseRupiah(raw);
    setDisplay(raw.replace(/[^0-9.,]/g, ''));
    onChange(num);
  };

  const handleBlur = () => {
    if (value != null && value !== '' && !isNaN(value)) {
      setDisplay(formatRupiah(value));
    } else {
      setDisplay('');
    }
  };

  const handleFocus = () => {
    if (value != null && value !== '' && !isNaN(value)) {
      setDisplay(formatRupiah(value));
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const num = parseRupiah(pasted);
    setDisplay(formatRupiah(num));
    onChange(num);
  };

  return (
    <div className="currency-input-wrapper">
      <span className="currency-prefix">Rp</span>
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        className={`currency-input-field ${className || ''}`}
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        onPaste={handlePaste}
        placeholder={placeholder || '0'}
        required={required}
        disabled={disabled}
        name={name}
        id={id}
      />
    </div>
  );
}
