import React, { useState } from 'react'
import '../css/componentCss/CalculatorForms.css'
import '../css/componentCss/CalculatorDisplay.css'
import '../css/componentCss/FormSetup.css'
import '../css/componentCss/VatCalculator.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { ZERO_RATED_CATEGORIES, SARS_VAT_RATE } from '../utils/calculationFunc';
import { Link } from 'react-router-dom'
import { RotateCcwIcon } from 'lucide-react'

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
export default function VatCalculator(
  { //PROPS PASSED FROM PARENT COMPONENT(TaxCalculators.js)
    onCalculate, //called with the calculation result whenever it changes
    onSave, //called when the authenticated user saves the result to history
    isAuthenticated 
  }) {
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

    const toggleZeroRated = () =>setIsZeroRated(prev => (!prev))
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

  //===============JSX RENDERING=============
  return (
   <div id='vatCalculatorDiv'>
   {/* VAT CALCULATOR */}
<form 
  id='vatCalculatorForm' 
  method='' 
  // onSubmit={}
  aria-labelledby='formHeading'
  >
      <div id='vatCalcHeadingBlock'>
      <h3 id='formHeading'>VAT CALCULATOR</h3>
        <p className="calcText">
        South African standard rate: {SARS_VAT_RATE * 100}% (SARS)
      </p>
      </div>
      {/* ====CALCULATOR INPUT */}
      <div id='vatCalculatorInput'>
      {/* GROUP 1: INPUT: Amount + Calculation Type + Zero Rated Check Box*/}
        <div id='vatFormGroup1'>
            <Stack gap={3} id='vatCalculatorStack1'>
            <div className="p-2" id='vatCalculatorBlock1'>
              <label className="taxCalcLabel" htmlFor="vat-amount">
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
            <div className="p-2" id='vatCalculatorBlock2'>
              <label className="taxCalcLabel">Calculation type</label>
              <div id='vatCalcBtnDiv'>
                <Button
                variant='light'
                type="button"
                id='vat-calc-typebtn1'
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
            id='vat-calc-typebtn2'
            className={`vat-calculator__toggle-btn ${
              mode === 'inclusive' ? 'vat-calculator__toggle-btn--active' : ''
            }`}
            onClick={() => handleModeChange('inclusive')}
          >
            Remove VAT (incl. → excl.)
          </Button>
              </div>
            </div>
           </Stack>
           <Stack gap={3} id='vatCalculatorStack2'>
      <div className="p-2" id='vatCalculatorBlock3'>
        <div className='calcInputDiv'>
          <input
          id="vat-zero-rated"
          type="checkbox"
          className="vatCalculatorCheckbox"
          checked={isZeroRated}
          onChange={handleZeroRatedToggle}
        />
<label htmlFor="vat-zero-rated" className="taxCalcLabel">
          This item is zero-rated (0%)
        </label>
        </div>
      </div>
      <div className="p-2" id='vatCalculatorBlock4'>
        <Button
        variant='info'
        id='toggleZeroRatedBtn'
        onClick={toggleZeroRated}
        type='button'
        >ZERO RATED ITEMS</Button>
      </div>
      {/* TOGGLE LIST OF ZERO RATED ITEMS */}
      {isZeroRated && (
        <div className="p-2" id='zeroRatedListBlock'>
          <ul id='zeroRatedList'>
          {/* MAP ZERO RATED ITEMS AS A LIST */}
            {ZERO_RATED_CATEGORIES.map((zero) => (
              <li>{zero}</li>
          ))}
          </ul>
        </div> 
      )}
    </Stack>
      {error && <p className="vat-calculator__error">{error}</p>}     
        </div>
      </div>
      <Stack gap={3} id='vatCalculatorBtnStack'>
      <div className="p-2" id='submitCalcDiv'>
         <Button
      type='submit'
      id='calculateVatBtn'
      variant='light'
      // disabled={}
      // ARIA ATTRIBUTES:
      role='button'
      aria-label='calculateVatBtn'
      // aria-disabled={}
      >CALCULATE VAT</Button>
      </div>
      <div className="p-2" id='resetCalcDiv'>
        <Button
        variant='danger'
        type='button'
        id='resetCalcBtn'
        // onClick={}
        // ARIA ATTRIBUTES:
        >
        <RotateCcwIcon aria-hidden='true' focusable='false'/>RESET
        </Button>
      </div>
    </Stack>
    </form>
    <div id='vatCalcResultsDiv'>
  {result && (
        <div className="vat-calculator__result">
          <div className="vat-calculator__result-row">
            <span className='vatResultSpan'>
            <label className='taxResultLabel'>Amount excl. VAT:</label>
            <p className='taxResult'>{formatCurrency(result.netAmount)}</p>
            </span>
          </div>
          <div className="vat-calculator__result-row">
            <span className='vatResultSpan'>
            <label className='taxResultLabel'></label>
            VAT ({result.ratePercent}%):
            
            </span>
            <span>{formatCurrency(result.vatAmount)}</span>
          </div>
          <div className="vat-calculator__result-row vat-calculator__result-row--total">
            <span>
            <label className='taxResultLabel'>Amount incl. VAT</label>
            <p className='taxResult'>{formatCurrency(result.grossAmount)}</p>
            </span>
          </div>
        </div>
      )}
      {isAuthenticated ? (
        <div id='saveToHistoryDiv'>
        <Button
        variant='light'
          type="button"
          id="saveCalcBtn"
          onClick={handleSave}
          disabled={!result}
          // ARIA ATTRIBUTES:
          aria-label='Save Vat Calculation Button'
          aria-disabled={!result}
        >
          Save to history
        </Button>
        </div>
      ) : (
        result && (
          <p className="vat-calculator__auth-hint">
            Log in to save this calculation to your history.
          </p>
        )
      )}
</div>
  <div id='sarsWebLinkBlock'>
  <Link id='webLink' target='blank' href='https://www.sars.gov.za/types-of-tax/value-added-tax/'>https://www.sars.gov.za/types-of-tax/value-added-tax/</Link>
</div>
   </div> 
    
  )
}
