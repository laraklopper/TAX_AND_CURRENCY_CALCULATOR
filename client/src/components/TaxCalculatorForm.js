import React, { useState } from "react";
import { Calculator, RotateCcw, TrendingUp, AlertCircle } from "lucide-react";
import "../css/componentCss/TaxCalculatorForm.css";
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
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

const blankForm = {
  incomeType: "annual", // "annual" | "monthly"
  income: "",
  age: "",
  taxYear: "",
  dependants: "0",
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function formatPercent(value) {
  return `${(value || 0).toFixed(2)}%`;
}

export default function TaxCalculatorForm({
  taxYears = ["2025-2026"],
  onCalculate,
  onSave,
  isAuthenticated = false,
}) {
  const [form, setForm] = useState({
    ...blankForm,
    taxYear: taxYears[0] ?? "",
  });
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
    setForm({ ...blankForm, taxYear: taxYears[0] ?? "" });
    setErrors({});
    setResult(null);
    setStatus(null);
    setSaveStatus(null);
  };

  function validate() {
    const errs = {};
    if (!form.income || Number(form.income) <= 0) {
      errs.income = "Enter an income amount greater than 0";
    }
    if (!form.age || Number(form.age) < 16 || Number(form.age) > 120) {
      errs.age = "Enter a valid age";
    }
    if (!form.taxYear) {
      errs.taxYear = "Select a tax year";
    }
    if (form.dependants === "" || Number(form.dependants) < 0) {
      errs.dependants = "Cannot be negative";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function buildPayload() {
    const annualIncome =
      form.incomeType === "monthly"
        ? Number(form.income) * 12
        : Number(form.income);

    return {
      annualIncome,
      age: Number(form.age),
      taxYear: form.taxYear,
      dependants: Number(form.dependants) || 0,
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

    if (!onCalculate) {
      setStatus("error");
      setStatusMessage("No calculation handler was provided to this form.");
      return;
    }

    const payload = buildPayload();
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
      await onSave(buildPayload(), result);
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
 <Stack gap={3}>
      <div className="p-2">
        <label className="field-label">Income is stated as</label>
      </div>
      <div className="p-2">
         <div className="button-div">
            {["annual", "monthly"].map((t) => (
              <Button
                key={t}
                id="incomeStated-Btn"
                type="button"
                onClick={() => updateField("incomeType", t)}
                className={`toggle-button${
                  form.incomeType === t ? " toggle-button--active" : ""
                }`}
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
       
            <div className="input-div">
             <label className="tax-field-label">
              {form.incomeType === "monthly" ? "Monthly income (R)" : "Annual income (R)"}
            </label>
<input
              type="number"
              min="0"
              step="0.01"
              placeholder={form.incomeType === "monthly" ? "25000" : "300000"}
            className="input"
              value={form.income}
              onChange={(e) => updateField("income", e.target.value)}
            />
            {errors.income && <p className="field-error">{errors.income}</p>}
            </div>
      </div>
      <div className="p-2">
        <div className="input-div">
            <label className="tax-field-label">Age</label>
            <input
              type="number"
              min="16"
              max="120"
              step="1"
              placeholder="35"
              className="input"
            //   className={fieldClass("age")}
              value={form.age}
              onChange={(e) => updateField("age", e.target.value)}
            />
            {errors.age && <p className="field-error">{errors.age}</p>}
          </div>
      </div>
      <div className="p-2">
        
          <div className="input-div">
            <label className="tax-field-label">Tax year</label>
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
            {errors.taxYear && <p className="field-error">{errors.taxYear}</p>}
          </div>
      </div>
      <div className="p-2">
<div className="input-div">
            <label className="field-label">Medical aid dependants</label>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="0"
              className="input"
            //   className={fieldClass("dependants")}
              value={form.dependants}
              onChange={(e) => updateField("dependants", e.target.value)}
            />
            {errors.dependants && <p className="field-error">{errors.dependants}</p>}
          </div>
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
            className="button button--primary"
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
              <button
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
              </button>
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