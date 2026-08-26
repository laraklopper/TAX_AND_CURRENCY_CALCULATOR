import React, { useState } from 'react'
import '../css/componentCss/CalculatorForms.css'
import '../css/componentCss/CalculatorDisplay.css'
import '../css/componentCss/FormSetup.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';

// SARS standard VAT rate. Centralised here so a future rate change
// (as nearly happened for 2025/2026) only needs updating in one place.
const SARS_VAT_RATE = 0.15;

const ZERO_RATED_CATEGORIES = [
  'Brown bread',
  'Maize meal',
  'Rice',
  'Vegetables',
  'Fruit',
  'Milk',
  'Eggs',
  'Vegetable oil',
  'Dried beans',
  'Lentils',
  'Paraffin',
  'Brown wheaten meal',
  'Pilchards/sardinella in tins',
];

/**
 * VatCalculatorForm
 *
 * Calculates VAT (add or remove) at the SARS standard rate, with an
 * option to flag an item as zero-rated. Follows the calculator module
 * pattern used elsewhere in the app: public calculation, auth-gated save.
 *
 * Props:
 *  - onCalculate(result): called with the calculation result whenever it changes
 *  - onSave(result): called when the authenticated user saves the result to history
 *  - isAuthenticated: bool, gates the Save button
 */
export default function VatCalculator({ onCalculate, onSave, isAuthenticated }) {
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('exclusive')// 'exclusive' (add VAT) | 'inclusive' (remove VAT)
  const [isZeroRated, setIsZeroRated] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(value);

  const calculateVat = (rawAmount, calcMode, zeroRated) => {
    const rate = zeroRated ? 0 : SARS_VAT_RATE;

    let netAmount;
    let vatAmount;
    let grossAmount;

    if (calcMode === 'exclusive') {
      // User entered the amount excluding VAT — add VAT on top
      netAmount = rawAmount;
      vatAmount = netAmount * rate;
      grossAmount = netAmount + vatAmount;
    } else {
      // User entered the amount including VAT — strip VAT back out
      grossAmount = rawAmount;
      netAmount = rate === 0 ? grossAmount : grossAmount / (1 + rate);
      vatAmount = grossAmount - netAmount;
    }

    return {
      mode: calcMode,
      isZeroRated: zeroRated,
      ratePercent: rate * 100,
      netAmount: Number(netAmount.toFixed(2)),
      vatAmount: Number(vatAmount.toFixed(2)),
      grossAmount: Number(grossAmount.toFixed(2)),
      calculatedAt: new Date().toISOString(),
    };
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    setAmount(value);
    runCalculation(value, mode, isZeroRated);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    runCalculation(amount, newMode, isZeroRated);
  };

  const handleZeroRatedToggle = (e) => {
    const checked = e.target.checked;
    setIsZeroRated(checked);
    runCalculation(amount, mode, checked);
  };

  const runCalculation = (rawValue, calcMode, zeroRated) => {
    const parsed = parseFloat(rawValue);

    if (rawValue === '' || Number.isNaN(parsed)) {
      setResult(null);
      setError('');
      return;
    }

    if (parsed < 0) {
      setError('Amount cannot be negative.');
      setResult(null);
      return;
    }

    setError('');
    const calcResult = calculateVat(parsed, calcMode, zeroRated);
    setResult(calcResult);

    if (onCalculate) {
      onCalculate(calcResult);
    }
  };

  const handleSave = () => {
    if (result && onSave) {
      onSave(result);
    }
  };

  return (
    <div>
<form id='vat-calculator-form'>
      <div id='formHeadingBlock'>
      <h3 id='formHeading'>VAT CALCULATOR</h3>
        <p className="vat-calculator__subtitle">
        South African standard rate: {SARS_VAT_RATE * 100}% (SARS)
      </p>
      </div>
      <div id='vat-calculator-input'>
        <div id='vat-form-group1'>
            <Stack gap={3}>
            <div className="p-2">
              <label className="vat-calculator-label" htmlFor="vat-amount">
          Amount (ZAR)
        </label>
        <input
          id="vat-amount"
          type="number"
          min="0"
          step="0.01"
          className="input"
          value={amount}
          onChange={handleAmountChange}
          placeholder="0.00"
        />
            </div>
            <div className="p-2">
              <label>Calculation type</label>
              <div>
                <Button
                variant='light'
                type="button"
                id='vatCalculatorToggleBtn'
            className={`vat-calculator__toggle-btn ${
              mode === 'exclusive' ? 'vat-calculator__toggle-btn--active' : ''
            }`}
            onClick={() => handleModeChange('exclusive')}
                >
                  Add VAT (excl. → incl.)
                </Button>
                 <Button
                 variant='light'
            type="button"
            className={`vat-calculator__toggle-btn ${
              mode === 'inclusive' ? 'vat-calculator__toggle-btn--active' : ''
            }`}
            onClick={() => handleModeChange('inclusive')}
          >
            Remove VAT (incl. → excl.)
          </Button>
              </div>
            </div>
            <div className="p-2">
               <input
          id="vat-zero-rated"
          type="checkbox"
          className="vat-calculator__checkbox"
          checked={isZeroRated}
          onChange={handleZeroRatedToggle}
        />
        <label htmlFor="vat-zero-rated" className="vat-calculator__checkbox-label">
          This item is zero-rated (0%)
        </label>
            </div>
           </Stack>

        </div>
        
      </div>
      <div>
          {isZeroRated && (
        <p className="vat-calculator__hint">
          Common zero-rated items: {ZERO_RATED_CATEGORIES.slice(0, 6).join(', ')}, and more.
        </p>
      )}

      {error && <p className="vat-calculator__error">{error}</p>}

      {result && (
        <div className="vat-calculator__result">
          <div className="vat-calculator__result-row">
            <span>Amount excl. VAT</span>
            <span>{formatCurrency(result.netAmount)}</span>
          </div>
          <div className="vat-calculator__result-row">
            <span>VAT ({result.ratePercent}%)</span>
            <span>{formatCurrency(result.vatAmount)}</span>
          </div>
          <div className="vat-calculator__result-row vat-calculator__result-row--total">
            <span>Amount incl. VAT</span>
            <span>{formatCurrency(result.grossAmount)}</span>
          </div>
        </div>
      )}

      {isAuthenticated ? (
        <Button
        variant='light'
          type="button"
          className="vat-calculator__save-btn"
          onClick={handleSave}
          disabled={!result}
        >
          Save to history
        </Button>
      ) : (
        result && (
          <p className="vat-calculator__auth-hint">
            Log in to save this calculation to your history.
          </p>
        )
      )}
    </div>
    </form>
    
    </div>
    
  )
}
