import React, { useEffect, useState } from "react";
import { Calculator, RotateCcw, TrendingUp, AlertCircle } from "lucide-react";
import "../css/componentCss/TaxCalculatorForm.css";
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Asterisk } from 'lucide-react';
// IMPORT UTILITY FUNCTIONS
import {
  BLANK_TAX_FORM,
  buildTaxPayload,
  formatCurrency,
  formatPercent,
  validateTaxForm
} from '../utils/calculationFunc';
// ---------------------------------------------------------------------------
// TaxCalculatorForm
// SARS income tax calculator. Posts to /api/tax/calculate and renders the
// result plus a bracket-by-bracket breakdown.
//
// Props:
//   taxYears - array of available tax years, e.g. ["2025-2026", "2024-2025"]
//     (fetch from GET /api/tax/config and pass in; defaults to a single entry)
//   onCalculate(payload) - async fn, returns the API result shape:
//     { grossTax, rebate, netTax, effectiveRate, marginalRate,
//       bracketBreakdown: [{ min, max, rate, amountInBracket, taxForBracket }] }
//   onSave(payload, result) - optional async fn, called when a logged-in
//     user clicks "Save to history"
//   isAuthenticated - boolean, controls whether "Save to history" is shown
// ---------------------------------------------------------------------------

export default function TaxCalculatorForm({
  taxYears = ["2025-2026"],
  onCalculate,
  onSave,
  isAuthenticated = false,
}) {
  const [form, setForm] = useState({
    ...BLANK_TAX_FORM,
    taxYear: taxYears[0] ?? "",
  });
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null); // null | "calculating" | "error"
  const [statusMessage, setStatusMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState(null); // null | "saving" | "saved" | "error"

  
  /* The tax year list is fetched from the API, so it can arrive after this
  form has mounted. If the selected year is not in the list that arrives (or
  nothing was selected yet), fall back to the newest year offered. */
  useEffect(() => {
    if (!taxYears.length) return;
    setForm((prev) =>
      taxYears.includes(prev.taxYear) ? prev : { ...prev, taxYear: taxYears[0] }
    );
  }, [taxYears]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setResult(null);
    setSaveStatus(null);
  };

  const resetForm = () => {
    setForm({ ...BLANK_TAX_FORM, taxYear: taxYears[0] ?? "" });
    setErrors({});
    setResult(null);
    setStatus(null);
    setSaveStatus(null);
  };

  /* Check the inputs and show any field errors. Returns true when the form is
  good to submit. */
  function validate() {
    const errs = validateTaxForm(form);
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

    if (!onCalculate) {
      setStatus("error");
      setStatusMessage("No calculation handler was provided to this form.");
      return;
    }

    const payload = buildTaxPayload(form);
    setStatus("calculating");
    setStatusMessage("");

    try {
      const data = await onCalculate(payload);
      setResult(data);
      setStatus(null);
    } catch (err) {
      setStatus("error");
      setStatusMessage(err?.message || "Could not calculate tax. Please try again.");
    }
  }

  async function handleSave() {
    if (!result || !onSave) return;
    setSaveStatus("saving");
    try {
      await onSave(buildTaxPayload(form), result);
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
    }
  }

  return (
    <div className="tax-calculator">
      

      {status === "error" && (
        <div className="alert alert--error">
          <AlertCircle size={16} className="alert__icon" />
          {statusMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} id="tax-calculator-form">
        <div id="tax-calculator-header">
                        <Stack gap={3} id="tax-calc-heading-stack">
                           <div className="p-2" id="formHeadingBlock">
        <h1 id="tax-formHeading">Income Tax Calculator</h1>
      </div>
      <div className="p-2">  <p className="form-text">
          Calculate your SARS income tax liability based on your income, age,
          and the selected tax year.
        </p></div>
    </Stack>
        </div>
      <div id="tax-calculator-input-div">
      {/* GROUP 1 */}
 <div id="tax-field-group1">
 <Stack gap={3} id="tax-calc-income-stack1">
      <div className="p-2" id="tax-calc-income-block1">
        <label id="incomestated-field-label" className="tax-field-label">Income Period:</label>
      <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
      </div>
      <div className="p-2" id="tax-calc-income-block2">
         <div className="button-div">
            {["annual", "monthly"].map((t) => (
              <Button
                key={t}
                id="incomeStated-Btn"
                type="button"
                variant="light"
                onClick={() => updateField("incomeType", t)}
                className={`toggle-button${
                  form.incomeType === t ? " toggle-button--active" : ""
                }`}
                aria-pressed={form.incomeType === t}
              >
                {t}
              </Button>
            ))}
          </div>
      </div>
      <div className="p-2"></div>
    </Stack>
        </div>
{/* GROUP 2 */}
        <div id="tax-field-group2">
          <Stack gap={3} id="tax-calc-stack1">
      <div className="p-2">
       {/* ANNUAL/MONTHLY INCOME */}
            <div className="input-div">
             <label className="tax-field-label">
              {form.incomeType === "monthly" ? "Monthly income (R)" : "Annual income (R)"}:
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder={form.incomeType === "monthly" ? "25000" : "300000"}
              className="input"
              value={form.income}
              required
              onChange={(e) => updateField("income", e.target.value)}
              // ARIA ATTRIBUTES:
              aria-required='true'
            />
            <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            {errors.income && <p className="field-error">{errors.income}</p>}
            </div>
      </div>
      <div className="p-2">
      {/* AGE */}
        <div className="input-div">
            <label className="tax-field-label" htmlFor="taxAgeInput">Age:</label>
            <input
              type="number"
              required
              min="16"
              max="120"
              step="1"
              placeholder="35"
              className="input"
              value={form.age}
              onChange={(e) => updateField("age", e.target.value)}
              id="taxAgeInput"
              aria-required='true'
            />
                        <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            {errors.age && <p className="field-error">{errors.age}</p>}
          </div>
      </div>
      <div className="p-2">
        {/* TAX YEAR */}
          <div className="input-div">
            <label className="tax-field-label">Tax year:</label>
            <select
            className="input"
              value={form.taxYear}
              onChange={(e) => updateField("taxYear", e.target.value)}
            >
              {taxYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
            {errors.taxYear && <p className="field-error">{errors.taxYear}</p>}
          </div>
      </div>
      <div className="p-2">
      {/* MEDICAL AID DEPENDENTS */}
<div className="input-div">
            <label className="field-label">Medical aid dependants:</label>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="0"
              className="input"
              value={form.dependants}
              onChange={(e) => updateField("dependants", e.target.value)}
            />
            {errors.dependants && <p className="field-error">{errors.dependants}</p>}
            {/* Recorded with the calculation, but no credit is applied yet -
            the tax year data holds no medical scheme fees credit figures. */}
          
          </div>
          </div>
          <div className="p-2">
              <p className="form-text">
              Saved with your calculation for reference. Medical scheme fees tax
              credits are not applied to the result.
            </p>
          </div>
          <div className="p-2" id='required-calculafInfo'>
              <p className='infoText' aria-live='polite' aria-hidden='true'>
                  <small><Asterisk color="#C22419" fontWeight={700} size={16} aria-hidden='true' focusable='false' /> Indicates required information</small>
              </p>
           
      </div>
    </Stack>
        </div>
      </div>
        <div className="form-actions">
         <Stack gap={2} className="col-md-5 mx-auto" id="calculatetaxBtn-stack">
          
           <Button
            type="submit"
            id="calculateTaxBtn"
            disabled={status === "calculating"}
            variant="light"
          >
            <Calculator size={16} />
            {status === "calculating" ? "Calculating..." : "Calculate"}
          </Button>
          <Button 
          variant="danger"
          type="button" onClick={resetForm} id="clearFormBtn">
            <RotateCcw size={16} /> Reset
          </Button>
    </Stack>
        </div>
      </form>
      {/* --- Results --- */}
      {result && (
        <div className="results">
          <div className="results__header">
            <TrendingUp size={18} className="results__icon" />
            <h2 className="results__title">Result</h2>
          </div>

          <div className="results-summary">
            <div className="results-card">
              <p className="results-card__label">Gross tax</p>
              <p className="results-card__value">{formatCurrency(result.grossTax)}</p>
            </div>
            <div className="results-card">
              <p className="results-card__label">Rebate applied</p>
              <p className="results-card__value">{formatCurrency(result.rebate)}</p>
            </div>
            <div className="results-card results-card--highlight">
              <p className="results-card__label">Net tax payable</p>
              <p className="results-card__value">{formatCurrency(result.netTax)}</p>
            </div>
          </div>

          <div className="results-summary results-summary--rates">
            <div className="rate-pill">
              <span className="rate-pill__label">Effective rate</span>
              <span className="rate-pill__value">{formatPercent(result.effectiveRate)}</span>
            </div>
            <div className="rate-pill">
              <span className="rate-pill__label">Marginal rate</span>
              <span className="rate-pill__value">{formatPercent(result.marginalRate)}</span>
            </div>
          </div>

          {result.bracketBreakdown?.length > 0 && (
            <div className="table-wrapper">
              <table className="breakdown-table">
                <thead>
                  <tr>
                    <th>Bracket (R)</th>
                    <th>Rate</th>
                    <th>Amount in bracket</th>
                    <th>Tax for bracket</th>
                  </tr>
                </thead>
                <tbody>
                  {result.bracketBreakdown.map((row, i) => (
                    <tr key={i}>
                      <td>
                        {formatCurrency(row.min)} – {row.max ? formatCurrency(row.max) : "+"}
                      </td>
                      <td>{formatPercent(row.rate * 100)}</td>
                      <td>{formatCurrency(row.amountInBracket)}</td>
                      <td className="breakdown-table__balance">
                        {formatCurrency(row.taxForBracket)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="disclaimer">
            This calculator is for estimation purposes only and does not
            constitute tax advice. Consult SARS or a registered tax
            practitioner for official calculations.
          </p>

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