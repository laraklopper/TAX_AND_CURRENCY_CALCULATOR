import React, { useState } from 'react'
import '../css/componentCss/FormSetup.css'
import '../css/componentCss/InterestCalculator.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Calculator, RotateCcw, TrendingUp, AlertCircle } from "lucide-react";

 
// ---------------------------------------------------------------------------
// InterestCalculatorForm
// Simple & compound interest calculator, with optional recurring monthly
// contributions. Posts to /api/interest/calculate and renders the result
// plus a year-by-year breakdown table.
//
// Props:
//   onCalculate(payload) - async fn, returns the API result shape:
//     { totalInterest, finalAmount, breakdown: [{ year, contributions, interest, balance }] }
//   onSave(payload, result) - optional async fn, called when a logged-in
//     user clicks "Save to history"
//   isAuthenticated - boolean, controls whether "Save to history" is shown
// ---------------------------------------------------------------------------
 
const COMPOUND_FREQUENCIES = [
  { value: "annually", label: "Annually", timesPerYear: 1 },
  { value: "semiannually", label: "Semi-annually", timesPerYear: 2 },
  { value: "quarterly", label: "Quarterly", timesPerYear: 4 },
  { value: "monthly", label: "Monthly", timesPerYear: 12 },
  { value: "daily", label: "Daily", timesPerYear: 365 },
];
 
const blankForm = {
  type: "compound", // "simple" | "compound"
  principal: "",
  rate: "",
  time: "",
  compoundingFrequency: "annually",
  monthlyContribution: "",
};
 
// Local fallback calculation, used if no onCalculate prop is supplied
// (e.g. for preview/demo). The backend should always recompute and be
// the source of truth for anything saved.
function calculateLocally(form) {
  const P = Number(form.principal);
  const rDecimal = Number(form.rate) / 100;
  const years = Number(form.time);
  const contribution = Number(form.monthlyContribution) || 0;
  const breakdown = [];
 
  if (form.type === "simple") {
    let balance = P;
    for (let y = 1; y <= years; y++) {
      const yearlyInterest = P * rDecimal;
      balance += yearlyInterest;
      breakdown.push({
        year: y,
        contributions: 0,
        interest: yearlyInterest,
        balance,
      });
    }
    return {
      totalInterest: balance - P,
      finalAmount: balance,
      breakdown,
    };
  }
 
  // compound
  const freq =
    COMPOUND_FREQUENCIES.find((f) => f.value === form.compoundingFrequency)
      ?.timesPerYear ?? 1;
  let balance = P;
  let totalContributed = 0;
 
  for (let y = 1; y <= years; y++) {
    const startBalance = balance;
    for (let period = 0; period < freq; period++) {
      balance += (balance * rDecimal) / freq;
    }
    // Add monthly contributions for the year (added after growth, simplified model)
    const yearlyContribution = contribution * 12;
    balance += yearlyContribution;
    totalContributed += yearlyContribution;
 
    breakdown.push({
      year: y,
      contributions: yearlyContribution,
      interest: balance - startBalance - yearlyContribution,
      balance,
    });
  }
 
  return {
    totalInterest: balance - P - totalContributed,
    finalAmount: balance,
    breakdown,
  };
}
 
function formatCurrency(value) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(value || 0);
}
 
export default function InterestCalculatorForm({
  onCalculate,
  onSave,
  isAuthenticated = false,
}) {
  const [form, setForm] = useState(blankForm);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null); // null | "calculating" | "error"
  const [statusMessage, setStatusMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState(null); // null | "saving" | "saved" | "error"
  
  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setResult(null);
    setSaveStatus(null);
  };
 
  const resetForm = () => {
    setForm(blankForm);
    setErrors({});
    setResult(null);
    setStatus(null);
    setSaveStatus(null);
  };
 
  function validate() {
    const errs = {};
    if (!form.principal || Number(form.principal) <= 0) {
      errs.principal = "Enter an amount greater than 0";
    }
    if (!form.rate || Number(form.rate) <= 0 || Number(form.rate) > 100) {
      errs.rate = "Enter a rate between 0 and 100";
    }
    if (!form.time || Number(form.time) <= 0 || !Number.isInteger(Number(form.time))) {
      errs.time = "Enter a whole number of years";
    }
    if (form.monthlyContribution && Number(form.monthlyContribution) < 0) {
      errs.monthlyContribution = "Cannot be negative";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }
 
  function buildPayload() {
    return {
      type: form.type,
      principal: Number(form.principal),
      rate: Number(form.rate),
      time: Number(form.time),
      compoundingFrequency:
        form.type === "compound" ? form.compoundingFrequency : null,
      monthlyContribution: Number(form.monthlyContribution) || 0,
    };
  }
 
  async function handleSubmit(e) {
    e.preventDefault();
    setSaveStatus(null);
 
    if (!validate()) {
      setStatus("error");
      setStatusMessage("Please fix the highlighted fields.");
      return;
    }
 
    const payload = buildPayload();
    setStatus("calculating");
    setStatusMessage("");
 
    try {
      const data = onCalculate
        ? await onCalculate(payload)
        : calculateLocally(payload);
      setResult(data);
      setStatus(null);
    } catch (err) {
      setStatus("error");
      setStatusMessage(err?.message || "Could not calculate interest. Please try again.");
    }
  }
 
  async function handleSave() {
    if (!result || !onSave) return;
    setSaveStatus("saving");
    try {
      await onSave(buildPayload(), result);
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
    }
  }
 
  return (
    <div className="interest-calculator">
      <div id="interest-formHeadingBlock">
        <h1 id="formHeading">Interest Calculator</h1>
        <span className='form-text-span'>
<p className="form-text">
          Estimate how much interest you'll earn or owe over time, using
          simple or compound interest.
        </p>
        </span>
        
      </div>
 
      {status === "error" && (
        <div className="alert alert--error">
          <AlertCircle size={16} className="alert__icon" />
          {statusMessage}
        </div>
      )}
 
      <form id='interest-calculator-form' onSubmit={handleSubmit} noValidate>
        {/* --- Interest type toggle --- */}
        <div className="field-group1">
          
          <Stack gap={3} id='interestForm-Stack1'>
      <div className="p-2" id='toggle-group-block'>
       <label className="field-label">Interest type</label>
            {["simple", "compound"].map((t) => (
              <Button
              variant="outline-dark"
                key={t}
                type="button"
                onClick={() => updateField("type", t)}
                id='interest-type-selectbtn'
                className={`toggle-button${
                  form.type === t ? " toggle-button--active" : ""
                }`}
              >
                {t}
              </Button>
            ))}
        
      </div>
      <div className="p-2" id=''>
          <div className="input-div">
            <label className="field-label">Principal amount (R)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="10000"
              className='input'
            //   className={fieldClass("principal")}
              value={form.principal}
              onChange={(e) => updateField("principal", e.target.value)}
            />
            {errors.principal && <p className="field-error">{errors.principal}</p>}
          </div>
 
          
      </div>
      <div className="p-2">
        <div className="input-div">
            <label className="field-label">Annual interest rate (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="7.5"
              className='input'
            //   className={fieldClass("rate")}
              value={form.rate}
              onChange={(e) => updateField("rate", e.target.value)}
            />
            {errors.rate && <p className="field-error">{errors.rate}</p>}
          </div>
      </div>
    </Stack>

        
        </div>

 
        <div className="field-group2">
         <Stack gap={3}>
      <div className="p-2" id='time-period-block'>

<div className='input-div'>
<label className="field-label">Time period (years)</label>
     <input
              type="number"
              min="1"
              step="1"
              placeholder="10"
              className='input'
            //   className={fieldClass("time")}
              value={form.time}
              onChange={(e) => updateField("time", e.target.value)}
            />
            {errors.time && <p className="field-error">{errors.time}</p>}
</div>
      </div>
      <div className="p-2">
        <div className='input-div'>
 {form.type === "compound" && (
            <div className="input-div">
              <label className="field-label">Compounding frequency</label>
              <select
              className='input'
                // className={fieldClass("compoundingFrequency")}
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
      <div className="p-2">
        <div className="input-div">
            <label className="field-label">
              Optional recurring monthly contribution (R)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="0"
              className='input'
            //   className={fieldClass("monthlyContribution")}
              value={form.monthlyContribution}
              onChange={(e) => updateField("monthlyContribution", e.target.value)}
            />
            {errors.monthlyContribution && (
              <p className="field-error">{errors.monthlyContribution}</p>
            )}
          </div>
      </div>
    </Stack>
         
 
          
        </div>
 
        <div className="form-actions">
          <Button
          variant='light'
            type="submit"
            disabled={status === "calculating"}
            id='calculate-interest-btn'
          >
            <Calculator size={16} />
            {status === "calculating" ? "Calculating..." : "Calculate"}
          </Button>
          <Button variant='danger' type="button" onClick={resetForm} id='clearFormBtn'>
            <RotateCcw size={16} /> Reset
          </Button>
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
                    <th>Year</th>
                    <th>Contributions</th>
                    <th>Interest earned</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {result.breakdown.map((row) => (
                    <tr key={row.year}>
                      <td>{row.year}</td>
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
                onClick={handleSave}
                disabled={saveStatus === "saving" || saveStatus === "saved"}
                className="save-link"
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
 