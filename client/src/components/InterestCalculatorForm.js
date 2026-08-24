import React, { useState } from 'react'
import '../css/componentCss/FormSetup.css'
import '../css/componentCss/InterestCalculator.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Calculator, RotateCcw, TrendingUp, AlertCircle } from "lucide-react";
import { Asterisk } from 'lucide-react';
// IMPORT UTILITY FUNCTIONS
import {
  BLANK_INTEREST_FORM,
  buildInterestPayload,
  calculateInterestLocally,
  COMPOUND_FREQUENCIES,
  formatCurrency,
  PERIOD_UNITS,
  periodConfig,
  validateInterestForm
} from '../utils/calculationFunc';


// ---------------------------------------------------------------------------
// InterestCalculatorForm
// Simple & compound interest calculator, with optional recurring monthly
// contributions. Posts to /api/interest/calculate and renders the result
// plus a period-by-period breakdown table.
//
// The TIME PERIOD toggle lets the user work in either ANNUAL periods (time
// entered in years, one breakdown row per year) or MONTHLY periods (time
// entered in months, one breakdown row per month). The interest rate is
// always entered as an annual nominal rate so both options can be compared
// against the same quoted rate.
//
// Props:
//   onCalculate(payload) - async fn, returns the API result shape:
//     { totalInterest, totalContributions, finalAmount, periodUnit,
//       periodLabel, breakdown: [{ period, contributions, interest, balance }] }
//   onSave(payload, result) - optional async fn, called when a logged-in
//     user clicks "Save to history"
//   isAuthenticated - boolean, controls whether "Save to history" is shown
// ---------------------------------------------------------------------------

export default function InterestCalculatorForm({
  onCalculate,
  onSave,
  isAuthenticated = false,
}) {
  const [form, setForm] = useState(BLANK_INTEREST_FORM);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null); // null | "calculating" | "error"
  const [statusMessage, setStatusMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState(null); // null | "saving" | "saved" | "error"
  // Config (label, noun, max) for the time period unit the user selected
  const period = periodConfig(form.periodUnit);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setResult(null);
    setSaveStatus(null);
  };

  /* Switching between annual and monthly changes what the time period means,
  so the entered value is cleared rather than reinterpreted - 10 years is not
  the same investment as 10 months. */
  const updatePeriodUnit = (unit) => {
    if (unit === form.periodUnit) return;
    setForm((prev) => ({ ...prev, periodUnit: unit, time: "" }));
    setErrors((prev) => ({ ...prev, time: undefined }));
    setResult(null);
    setSaveStatus(null);
  };

  const resetForm = () => {
    setForm(BLANK_INTEREST_FORM);
    setErrors({});
    setResult(null);
    setStatus(null);
    setSaveStatus(null);
  };

  /* Check the inputs and show any field errors. Returns true when the form is
  good to submit. */
  function validate() {
    const errs = validateInterestForm(form);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaveStatus(null);

    if (!validate()) {
      setStatus("error");
      setStatusMessage("Please fix the highlighted fields.");
      return;
    }

    const payload = buildInterestPayload(form);
    setStatus("calculating");
    setStatusMessage("");

    try {
      const data = onCalculate
        ? await onCalculate(payload)
        : calculateInterestLocally(payload);
      setResult(data);
      setStatus(null);
    } catch (err) {
      setStatus("error");
      setStatusMessage(err?.message || "Could not calculate interest. Please try again.");
    }
  }

  /* Bootstrap variant for the save button, so its colour reports the outcome
  of the save rather than staying neutral once the button is disabled. */
  const saveButtonVariant =
    saveStatus === "saved" ? "success" : saveStatus === "error" ? "danger" : "light";

  async function handleSave() {
    if (!result || !onSave) return;
    setSaveStatus("saving");
    try {
      await onSave(buildInterestPayload(form), result);
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
    }
  }

  /* Heading for the breakdown table's first column. Driven by the result, not
  the form, so the table always describes the figures currently on screen. */
  const breakdownHeading = result?.periodUnit === "months" ? "Month" : "Year";

  return (
    <div className="interest-calculator">

      <form id='interest-calculator-form' onSubmit={handleSubmit} noValidate>
         <div id="interest-formHeadingBlock">
        <h1 id="formHeading">Interest Calculator</h1>
        <span className='form-text-span'>
          <p className="form-text">
            Calculate how much interest you'll earn or owe over time, using
            simple or compound interest.
        </p>
        </span>
      </div>
      {status === "error" && (
        <div className="alert alert--error">
          <AlertCircle size={16} color='#C22419' className="alert__icon" />
          {statusMessage}
        </div>
      )}
        <div id='interest-calculator-details-input'>
        {/* --- GROUP 1 Interest type toggle --- */}
        <div id="field-group1">
        {/* STACK 1 */}
          <Stack gap={3} id='interestForm-Stack1'>
          <div className="p-2" id='toggle-group-block1'>
            <label className="field-label">Interest type:</label><small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            {/* Interest Type Buttons */}
            <div className='button-div'>
                  {["simple", "compound"].map((t) => (
                    <Button
                    variant="light"
                      key={t}
                      type="button"
                      onClick={() => updateField("type", t)}
                      id='interest-type-selectbtn'
                      className={`toggle-button${
                        form.type === t ? " toggle-button--active" : ""
                      }`}
                      // ARIA ATTRIBUTES:
                      aria-pressed={form.type === t}
                    >
                      {t}
                    </Button>
                  ))}
            </div>
            <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
          </div>
          <div className="p-2" id='form-text-div'>
            <p className='form-text'>Simple interest is worked out on the principal, or original, amount of a loan.</p>
            <p className='form-text'>Compound interest is calculated on the principal (original) amount and also on the added interest of previous periods.</p>
          </div>
        </Stack>
        </div>
        {/* GROUP 2 */}
        <div id="field-group2">
        {/* STACK 2 */}
        <Stack gap={3} id='interestForm-Stack2'>
       <div className="p-2" id='principal-amount-block'>
       {/* PRINCIPAL TAX AMOUNT */}
          <div className="input-div">
            <label className="field-label" htmlFor='principal-tax-amount'>Principal amount: (R)</label>
            <input
              type="number"
              id='principal-tax-amount'
              min="0"
              step="0.01"
              placeholder="10000"
              className='input'
              value={form.principal}
              onChange={(e) => updateField("principal", e.target.value)}
            />
            <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            {errors.principal && <p className="field-error">{errors.principal}</p>}
          </div>
      </div>
      {/* TIME PERIOD TOGGLE: calculate over annual or monthly periods */}
      <div className="p-2" id='interest-time-block'>
        
        <div id='buttons-div' role='group' aria-label='Time period'>
        <label className='field-label' id='time-period-label'>TIME PERIOD:</label>
          {PERIOD_UNITS.map((p) => (
            <Button
              variant='light'
              key={p.value}
              type='button'
              onClick={() => updatePeriodUnit(p.value)}
              id='interest-period-select-btn'
              className={`toggle-button${
                form.periodUnit === p.value ? " toggle-button--active" : ""
              }`}
              // ARIA ATTRIBUTES:
              aria-pressed={form.periodUnit === p.value}>
                {p.label}
              </Button>
          ))}
          <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
        <p className='form-text'>
          {form.periodUnit === "months"
            ? "Monthly: enter the time period in months and get a month-by-month breakdown."
            : "Annual: enter the time period in years and get a year-by-year breakdown."}
        </p>
      </div>
      {/* ANNUAL INTEREST RATE */}
      <div className="p-2" id='annual-interest-block'>
        <div className="input-div">
            <label className="field-label">Annual interest rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="7.5"
              className='input'
              value={form.rate}
              onChange={(e) => updateField("rate", e.target.value)}
            />
            <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            {errors.rate && <p className="field-error">{errors.rate}</p>}
          </div>
          <p className='form-text'>
            Always enter the yearly quoted rate - it is converted to the period
            you selected above.
          </p>
      </div>
      {/* TIME PERIOD (YEARS OR MONTHS, PER THE TOGGLE ABOVE) */}
      <div className="p-2" id='time-period-block'>
<div className='input-div'>
<label className="field-label">Time period ({period.noun})</label>
     <input
              type="number"
              min="1"
              max={period.max}
              step="1"
              placeholder={period.placeholder}
              className='input'
              value={form.time}
              onChange={(e) => updateField("time", e.target.value)}
              // ARIA ATTRIBUTES:
              aria-label={`Time period in ${period.noun}`}
            />
            <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            {errors.time && <p className="field-error">{errors.time}</p>}
</div>
      </div>
    </Stack>
     </div>
     {/* GROUP 3: Compounding Frequency + Optional recurring monthly contribution */}
    <div id='field-group3'>
         <Stack gap={3} id='interestForm-Stack3'>
      <div className="p-2" id='compounding-freq-block'>
      {/* COMPOUNDING FREQUENCY */}
        <div className='input-div'>
 {form.type === "compound" && (
            <div className="input-div">
              <label className="field-label">Compounding frequency</label>
              <select
              className='input'
                value={form.compoundingFrequency}
                onChange={(e) => updateField("compoundingFrequency", e.target.value)}
              >
                {COMPOUND_FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
      <div className="p-2" id='opt-controbution-block'>
        <div className="input-div">
        <label className="field-label">Optional recurring monthly contribution (R)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              className='input'
              value={form.monthlyContribution}
              onChange={(e) => updateField("monthlyContribution", e.target.value)}
            />
            {errors.monthlyContribution && (
              <p className="field-error">{errors.monthlyContribution}</p>
            )}
          </div>
      </div>
      {/* INPUT REQUIRED TO SAVE CALCULATION */}
      <div className='p-2' id='user-fullname-input' hidden>
        <div className='input-div'>
          <label className='field-label'>FIRST NAME</label>
          <input
            className='input'
            readOnly
              // placeholder={currentUser.fullName.firstName} //
            />
            <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
        <div className='input-div'>
          <label className='field-label'>LAST NAME:</label>
          <input
            className='input'
              readOnly
              // placeholder={currentUser.fullName.lastName} //
            />
            <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
       </Stack>
    </div>
        </div>
        <div className="form-actions">
        <Stack gap={2} className="col-md-5 mx-auto" id='interestform-btn-stack'>
        <div className="p-2" id='requiredInfo'>
              <p className='infoText' aria-live='polite' aria-hidden='true'>
                  <small><Asterisk color="#C22419" fontWeight={700} size={16} aria-hidden='true' focusable='false' /> Indicates required information</small>
              </p>
        </div>
       <Button
          variant='light'
            type="submit"
            disabled={status === "calculating"}
            id='calculate-interest-btn'
            // ARIA ATTRIBUTES
            role='button'
            aria-label={status === "calculating" ? "Calculating..." : "Calculate"}
            aria-disabled={status === "calculating"}
          >
            <Calculator fontWeight={700} size={16} aria-hidden='true' focusable='false' />
            {status === "calculating" ? "Calculating..." : "Calculate"}
          </Button>
          <Button variant='danger' type="button" onClick={resetForm} id='clearFormBtn'>
            <RotateCcw size={16} /> Reset
          </Button>
    </Stack>

        </div>
      </form>

      {/* --- Results --- */}
      {result && (
        <div className="results">
          <div className="result-header">
            <TrendingUp size={32} className="results__icon" />
            <h4 className="results__title">Result</h4>
          </div>
          <div className="results-summary">
            <Stack gap={1} id='result-summary-stack'>
      <div className="p-2" id='results-block1'>
              <p className="results-label">Total interest earned:</p>
              <p className="results-value">{formatCurrency(result.totalInterest)}</p>
      </div>
      {/* Only worth showing when the user actually added contributions */}
      {result.totalContributions > 0 && (
      <div className="p-2" id='results-block3'>
              <p className="results-label">Total contributions:</p>
              <p className="results-value">
                {formatCurrency(result.totalContributions)}
              </p>
      </div>
      )}
      <div className="p-2" id='results-block2'>
              <p className="results-label">Final amount:</p>
              <p className="results-value">
                {formatCurrency(result.finalAmount)}
              </p>
      </div>
    </Stack>
          </div>
          {result.breakdown?.length > 0 && (
            <div className="table-wrapper">
              <table className="breakdown-table">
                <thead>
                  <tr>
                    <th>{breakdownHeading}</th>
                    <th>Contributions</th>
                    <th>Interest earned</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.breakdown.map((row) => (
                    <tr key={row.period}>
                      <td>{row.period}</td>
                      <td>{formatCurrency(row.contributions)}</td>
                      <td>{formatCurrency(row.interest)}</td>
                      <td className="breakdown-table__balance">
                        {formatCurrency(row.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {isAuthenticated && onSave && (
            <div className="save-row">
              <Button
                type="button"
                /* Turns green once the calculation is safely in the user's
                history, red when the save was rejected. */
                variant={saveButtonVariant}
                onClick={handleSave}
                disabled={saveStatus === "saving" || saveStatus === "saved"}
                className="save-link"
                id='save-int-calcBtn'
              >
                {saveStatus === "saving"
                  ? "Saving..."
                  : saveStatus === "saved"
                  ? "Saved to history"
                  : "Save to history"}
              </Button>
              {saveStatus === "error" && (
                <span className="save-error">Could not save. Try again.</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

