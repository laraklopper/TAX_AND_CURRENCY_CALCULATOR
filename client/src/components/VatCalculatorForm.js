import React, { useState } from 'react'
import '../css/componentCss/CalculatorForms.css'
import '../css/componentCss/CalculatorDisplay.css'
import '../css/componentCss/FormSetup.css'
import '../css/componentCss/VatCalculator.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { ZERO_RATED_CATEGORIES, SARS_VAT_RATE } from '../utils/calculationFunc';
import { RotateCcwIcon } from 'lucide-react'

/**
 * VatCalculatorForm
 *
 * Calculates VAT (add or remove) at the SARS standard rate, with an
 * option to flag an item as zero-rated. Follows the calculator module
 * pattern used elsewhere in the app: the inputs are posted on submit, the
 * backend does the maths, and saving is auth-gated.
 *
 * Props:
 *  - onCalculate(payload): async fn, posts { amount, mode, isZeroRated } to
 *    /vat/calculate and returns the API result shape:
 *    { mode, isZeroRated, ratePercent, enteredAmount, netAmount, vatAmount, grossAmount }
 *  - onSave(payload, result): optional async fn, called when the authenticated
 *    user saves the result to history
 *  - isAuthenticated: bool, gates the Save button
 */
export default function VatCalculator(
  { //PROPS PASSED FROM PARENT COMPONENT(TaxCalculators.js)
    onCalculate, //posts the inputs to the backend and returns the result
    onSave, //called when the authenticated user saves the result to history
    isAuthenticated
  }) {
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('exclusive')// 'exclusive' (add VAT) | 'inclusive' (remove VAT)
  const [isZeroRated, setIsZeroRated] = useState(false);
  const [showZeroRatedList, setShowZeroRatedList] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState(null);// null | 'calculating'
  const [saveStatus, setSaveStatus] = useState(null);// null | 'saving' | 'saved' | 'error'

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(value);

  const toggleZeroRatedList = () => setShowZeroRatedList(prev => !prev)

  /* The request body sent to /vat/calculate and /vat/save. Only the inputs are
  sent: the backend works the figures out itself. */
  const buildVatPayload = () => ({
    amount: parseFloat(amount),
    mode,
    isZeroRated,
  });

  /* Any edit clears the result and the save status, so the figures on screen
  always belong to the inputs above them. */
  const clearResult = () => {
    setResult(null);
    setSaveStatus(null);
    setError('');
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
    clearResult();
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    clearResult();
  };

  const handleZeroRatedToggle = (e) => {
    setIsZeroRated(e.target.checked);
    clearResult();
  };

  const resetForm = () => {
    setAmount('');
    setMode('exclusive');
    setIsZeroRated(false);
    setShowZeroRatedList(false);
    setStatus(null);
    clearResult();
  };

  // Returns an error message for the amount, or '' when it is usable
  const validateAmount = () => {
    const parsed = parseFloat(amount);
    if (amount === '' || Number.isNaN(parsed)) return 'Please enter an amount.';
    if (parsed < 0) return 'Amount cannot be negative.';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus(null);

    const validationError = validateAmount();
    if (validationError) {
      setError(validationError);
      setResult(null);
      return;
    }

    if (!onCalculate) {
      setError('No calculation handler was provided to this form.');
      return;
    }

    setError('');
    setStatus('calculating');

    try {
      const data = await onCalculate(buildVatPayload());
      setResult(data);
    } catch (err) {
      setResult(null);
      setError(err?.message || 'Could not calculate VAT. Please try again.');
    } finally {
      setStatus(null);
    }
  };

  const handleSave = async () => {
    if (!result || !onSave) return;
    setSaveStatus('saving');
    try {
      await onSave(buildVatPayload(), result);
      setSaveStatus('saved');
    } catch (err) {
      setSaveStatus('error');
    }
  };

  const isCalculating = status === 'calculating';

  //===============JSX RENDERING=============
  return (
   <div id='vatCalculatorDiv'>
   {/* VAT CALCULATOR */}
<form
  id='vatCalculatorForm'
  onSubmit={handleSubmit}
  aria-labelledby='formHeading'
  noValidate
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
          aria-invalid={Boolean(error)}
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
            aria-pressed={mode === 'exclusive'}
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
            aria-pressed={mode === 'inclusive'}
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
        onClick={toggleZeroRatedList}
        type='button'
        aria-expanded={showZeroRatedList}
        aria-controls='zeroRatedListBlock'
        >ZERO RATED ITEMS</Button>
      </div>
      {/* TOGGLE LIST OF ZERO RATED ITEMS */}
      {showZeroRatedList && (
        <div className="p-2" id='zeroRatedListBlock'>
          <ul id='zeroRatedList'>
          {/* MAP ZERO RATED ITEMS AS A LIST */}
            {ZERO_RATED_CATEGORIES.map((zero) => (
              <li key={zero}>{zero}</li>
          ))}
          </ul>
        </div>
      )}
    </Stack>
      {error && <p className="vat-calculator__error" role="alert">{error}</p>}
        </div>
      </div>
      <Stack gap={3} id='vatCalculatorBtnStack'>
      <div className="p-2" id='submitCalcDiv'>
         <Button
      type='submit'
      id='calculateTaxBtn'
      variant='light'
      disabled={isCalculating}
      // ARIA ATTRIBUTES:
      aria-label='calculateVatBtn'
      aria-disabled={isCalculating}
      >{isCalculating ? 'CALCULATING...' : 'CALCULATE VAT'}</Button>
      </div>
      <div className="p-2" id='resetCalcDiv'>
        <Button
        variant='danger'
        type='button'
        id='resetCalcBtn'
        onClick={resetForm}
        // ARIA ATTRIBUTES:
        aria-label='Reset VAT calculator'
        >
        <RotateCcwIcon aria-hidden='true' focusable='false'/>RESET
        </Button>
      </div>
    </Stack>
    </form>
    {/* RESULTS: only rendered once the form has been submitted and the backend has answered */}
    {result && (
    <div id='vatCalcResultsDiv' aria-live='polite'>
    <div className='vatResultHeader'>
      <h4 className='results__title'>RESULT</h4>
    </div>
        <div className="vat-calculator__result">
          <div className="vat-calculator__result-row">
            <span className='vatResultSpan'>
            <label className='taxResultLabel'>Amount excl. VAT:</label>
            <p className='taxResult'>{formatCurrency(result.netAmount)}</p>
            </span>
          </div>
          <div className="vat-calculator__result-row">
            <span className='vatResultSpan'>
            <label className='taxResultLabel'>VAT ({result.ratePercent}%):</label>
            <p className='taxResult'>{formatCurrency(result.vatAmount)}</p>
            </span>
          </div>
          <div className="vat-calculator__result-row vat-calculator__result-row--total">
            <span className='vatResultSpan'>
            <label className='taxResultLabel'>Amount incl. VAT:</label>
            <p className='taxResult'>{formatCurrency(result.grossAmount)}</p>
            </span>
          </div>
        </div>
      {isAuthenticated && onSave ? (
        <div id='saveToHistoryDiv'>
        <Button
        variant={saveStatus === 'saved' ? 'success' : saveStatus === 'error' ? 'danger' : 'light'}
          type="button"
          id="saveCalcBtn"
          onClick={handleSave}
          disabled={saveStatus === 'saving' || saveStatus === 'saved'}
          // ARIA ATTRIBUTES:
          aria-label='Save Vat Calculation Button'
          aria-disabled={saveStatus === 'saving' || saveStatus === 'saved'}
        >
          {saveStatus === 'saving' ? 'Saving...'
            : saveStatus === 'saved' ? 'Saved to history'
            : saveStatus === 'error' ? 'Save failed - try again'
            : 'Save to history'}
        </Button>
        </div>
      ) : (
          <p className="vat-calculator__auth-hint">
            Log in to save this calculation to your history.
          </p>
      )}
</div>
    )}
  <div id='sarsWebLinkBlock'>
  <a id='webLink' target='_blank' rel='noopener noreferrer' href='https://www.sars.gov.za/types-of-tax/value-added-tax/'>https://www.sars.gov.za/types-of-tax/value-added-tax/</a>
</div>
   </div>

  )
}
