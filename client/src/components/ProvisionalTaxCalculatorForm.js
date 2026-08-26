import React, { useEffect, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentCss/CalculatorForms.css'
import '../css/componentCss/CalculatorDisplay.css'
import '../css/componentCss/FormSetup.css'
import '../css/componentCss/TaxCalculatorForm.css'
/* The .results, .alert, .field-label, .field-error, .form-actions,
.table-wrapper, .breakdown-table, .save-row and .save-link rules are shared with
the interest and income tax calculators and live in InterestCalculator.css. Only
the provisional-tax-specific blocks are styled in CalculatorForms.css. */
import '../css/componentCss/InterestCalculator.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// IMPORT ICONS FROM LUCIDE REACT
import { Calculator, RotateCcw, TrendingUp, AlertCircle, CalendarClock, Asterisk } from 'lucide-react';
// IMPORT UTILITY FUNCTIONS
import {
  BLANK_PROV_TAX_FORM,
  PROVISIONAL_PERIODS,
  buildProvTaxPayload,
  formatCurrency,
  formatPercent,
  provisionalPeriodConfig,
  validateProvTaxForm
} from '../utils/calculationFunc';
import { toLongDate } from '../utils/formatCalculations';
// ---------------------------------------------------------------------------
// ProvisionalTaxCalculatorForm
// SARS provisional tax (IRP6) calculator. Posts to /provisional/calculate and
// renders the working the way an IRP6 is laid out: the tax on the estimate for
// the whole year, the portion this payment covers, and everything already
// withheld or paid coming off it.
//
// Provisional tax is worked out from the SAME brackets and rebates as income
// tax, so the tax years come from GET /tax/config and are passed in as
// `taxYears`, exactly as they are for TaxCalculatorForm.
//
// Props:
//   taxYears - array of available tax years, e.g. ["2025-2026", "2024-2025"]
//     (fetched from GET /tax/config and passed in; defaults to a single entry)
//   onCalculate(payload) - async fn, returns the API result shape:
//     { amountPayable, annualTaxLiability, taxForPeriod, totalCredits, overpaid,
//       dueDate, effectiveRate, marginalRate, warnings,
//       breakdown: [{ label, amount, type }] }
//   onSave(payload, result) - optional async fn, called when a logged-in user
//     clicks "Save to history"
//   isAuthenticated - boolean, controls whether "Save to history" is shown
// ---------------------------------------------------------------------------

export default function ProvisionalTaxCalculator({
  taxYears = ["2025-2026"],
  onCalculate,
  onSave,
  isAuthenticated = false,
}) {
  const [form, setForm] = useState({
    ...BLANK_PROV_TAX_FORM,
    taxYear: taxYears[0] ?? "",
  });
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null); // null | "calculating" | "error"
  const [statusMessage, setStatusMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState(null); // null | "saving" | "saved" | "error"

  // Which of the three payments is being worked out, and how it is described
  const period = provisionalPeriodConfig(form.period);

  /* The tax year list is fetched from the API, so it can arrive after this form
  has mounted. If the selected year is not in the list that arrives (or nothing
  was selected yet), fall back to the newest year offered. */
  useEffect(() => {
    if (!taxYears.length) return;
    setForm((prev) =>
      taxYears.includes(prev.taxYear) ? prev : { ...prev, taxYear: taxYears[0] }
    );
  }, [taxYears]);

  /* Any edit clears the result and the save status, so the figures on screen
  always belong to the inputs above them. */
  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setResult(null);
    setSaveStatus(null);
  };

  const resetForm = () => {
    setForm({ ...BLANK_PROV_TAX_FORM, taxYear: taxYears[0] ?? "" });
    setErrors({});
    setResult(null);
    setStatus(null);
    setSaveStatus(null);
  };

  /* Check the inputs and show any field errors. Returns true when the form is
  good to submit. */
  function validate() {
    const errs = validateProvTaxForm(form);
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

    const payload = buildProvTaxPayload(form);
    setStatus("calculating");
    setStatusMessage("");

    try {
      const data = await onCalculate(payload);
      setResult(data);
      setStatus(null);
    } catch (err) {
      setStatus("error");
      setStatusMessage(err?.message || "Could not calculate provisional tax. Please try again.");
    }
  }

  /* Bootstrap variant for the save button, so its colour reports the outcome of
  the save rather than staying neutral once the button is disabled. */
  const saveButtonVariant =
    saveStatus === "saved" ? "success" : saveStatus === "error" ? "danger" : "light";

  async function handleSave() {
    if (!result || !onSave) return;
    setSaveStatus("saving");
    try {
      await onSave(buildProvTaxPayload(form), result);
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
    }
  }

  return (
    <div className="tax-calculator" id="prov-tax-calculator">
      {status === "error" && (
        <div className="alert alert--error" role="alert">
          <AlertCircle size={16} className="alert__icon" />
          {statusMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} id="prov-tax-calculator-form" aria-labelledby="prov-tax-formHeading">
        <div id="prov-tax-calculator-header">
          <Stack gap={3} id="prov-tax-heading-stack">
            <div className="p-2" id="prov-tax-formHeadingBlock">
              <h1 id="prov-tax-formHeading">Provisional Tax Calculator</h1>
            </div>
            <div className="p-2">
              <p className="form-text">
                Work out what is payable on an IRP6 from your estimated taxable
                income for the whole year of assessment. Provisional tax is not a
                separate tax: it is the same SARS income tax, paid in advance.
              </p>
            </div>
          </Stack>
        </div>

        <div id="prov-tax-input-div">
          {/* GROUP 1: WHICH PAYMENT */}
          <div id="prov-tax-field-group1">
            <Stack gap={3} id="prov-tax-period-stack">
              <div className="p-2" id="prov-tax-period-block1">
                <label id="prov-tax-period-label" className="tax-field-label">Which payment:</label>
                <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
              </div>
              <div className="p-2" id="prov-tax-period-block2">
                <div className="button-div">
                  {PROVISIONAL_PERIODS.map((p) => (
                    <Button
                      key={p.value}
                      type="button"
                      variant="light"
                      onClick={() => updateField("period", p.value)}
                      /* Styled by class rather than by id: there are three of
                      these buttons, and an id can only belong to one element */
                      className={`prov-tax-period-btn toggle-button${
                        form.period === p.value ? " toggle-button--active" : ""
                      }`}
                      aria-pressed={form.period === p.value}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
                {errors.period && <p className="field-error">{errors.period}</p>}
              </div>
              {/* What the selected payment covers and when it falls due */}
              <div className="p-2" id="prov-tax-period-block3">
                <p className="form-text" aria-live="polite">
                  <strong>{period.heading}:</strong> {period.portionLabel}. {period.dueLabel}.
                </p>
              </div>
            </Stack>
          </div>

          {/* GROUP 2: THE ESTIMATE */}
          <div id="prov-tax-field-group2">
            <Stack gap={3} id="prov-tax-estimate-stack">
              <div className="p-2">
                {/* ESTIMATED TAXABLE INCOME FOR THE FULL YEAR */}
                <div className="input-div">
                  <label className="tax-field-label" htmlFor="provEstimatedIncome">
                    Estimated taxable income for the year (R):
                  </label>
                  <input
                    id="provEstimatedIncome"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="480000"
                    className="input"
                    value={form.estimatedIncome}
                    required
                    onChange={(e) => updateField("estimatedIncome", e.target.value)}
                    // ARIA ATTRIBUTES:
                    aria-required='true'
                  />
                  <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                  {errors.estimatedIncome && <p className="field-error">{errors.estimatedIncome}</p>}
                </div>
              </div>
              <div className="p-2">
                {/* The whole year, not the six months the first payment covers */}
                <p className="form-text">
                  Always the estimate for the FULL year of assessment. The
                  brackets are annual and progressive, so the portion for this
                  payment is taken off the tax, not off the income.
                </p>
              </div>
              <div className="p-2">
                {/* AGE */}
                <div className="input-div">
                  <label className="tax-field-label" htmlFor="provTaxAgeInput">Age:</label>
                  <input
                    id="provTaxAgeInput"
                    type="number"
                    required
                    min="16"
                    max="120"
                    step="1"
                    placeholder="35"
                    className="input"
                    value={form.age}
                    onChange={(e) => updateField("age", e.target.value)}
                    aria-required='true'
                  />
                  <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                  {errors.age && <p className="field-error">{errors.age}</p>}
                </div>
              </div>
              <div className="p-2">
                {/* TAX YEAR */}
                <div className="input-div">
                  <label className="tax-field-label" htmlFor="provTaxYear">Tax year:</label>
                  <select
                    id="provTaxYear"
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
            </Stack>
          </div>

          {/* GROUP 3: WHAT COMES OFF THE PAYMENT */}
          <div id="prov-tax-field-group3">
            <Stack gap={3} id="prov-tax-credits-stack">
              <div className="p-2" id="prov-tax-credits-heading">
                <label className="tax-field-label" id="prov-tax-credits-label">
                  Already withheld or paid:
                </label>
              </div>
              <div className="p-2">
                {/* EMPLOYEES' TAX (PAYE) */}
                <div className="input-div">
                  <label className="field-label" htmlFor="provEmployeesTax">
                    Employees’ tax (PAYE) for this period (R):
                  </label>
                  <input
                    id="provEmployeesTax"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    className="input"
                    value={form.employeesTax}
                    onChange={(e) => updateField("employeesTax", e.target.value)}
                  />
                  {errors.employeesTax && <p className="field-error">{errors.employeesTax}</p>}
                </div>
              </div>
              <div className="p-2">
                {/* FOREIGN TAX CREDITS */}
                <div className="input-div">
                  <label className="field-label" htmlFor="provForeignTaxCredits">
                    Foreign tax credits (R):
                  </label>
                  <input
                    id="provForeignTaxCredits"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    className="input"
                    value={form.foreignTaxCredits}
                    onChange={(e) => updateField("foreignTaxCredits", e.target.value)}
                  />
                  {errors.foreignTaxCredits && <p className="field-error">{errors.foreignTaxCredits}</p>}
                </div>
              </div>
              <div className="p-2">
                {/* MEDICAL SCHEME FEES TAX CREDITS */}
                <div className="input-div">
                  <label className="field-label" htmlFor="provMedicalCredits">
                    Medical scheme fees tax credits (R):
                  </label>
                  <input
                    id="provMedicalCredits"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    className="input"
                    value={form.medicalCredits}
                    onChange={(e) => updateField("medicalCredits", e.target.value)}
                  />
                  {errors.medicalCredits && <p className="field-error">{errors.medicalCredits}</p>}
                </div>
              </div>
              <div className="p-2">
                {/* The credit is an input, not something the calculator knows */}
                <p className="form-text">
                  Enter the credits for the full year as published by SARS
                  (a monthly amount per member and per dependant). They are
                  deducted as entered, then the portion for this payment is
                  applied.
                </p>
              </div>
              {/* PROVISIONAL TAX ALREADY PAID - only where there can be any */}
              {period.acceptsPriorPayments && (
                <div className="p-2">
                  <div className="input-div">
                    <label className="field-label" htmlFor="provPriorPayments">
                      Provisional tax already paid for this year (R):
                    </label>
                    <input
                      id="provPriorPayments"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0"
                      className="input"
                      value={form.priorPayments}
                      onChange={(e) => updateField("priorPayments", e.target.value)}
                    />
                    {errors.priorPayments && <p className="field-error">{errors.priorPayments}</p>}
                  </div>
                </div>
              )}
              {/* BASIC AMOUNT - only the estimated periods are judged against it */}
              {form.period !== 'third' && (
                <div className="p-2">
                  <div className="input-div">
                    <label className="field-label" htmlFor="provBasicAmount">
                      Basic amount (last assessed taxable income) (R):
                    </label>
                    <input
                      id="provBasicAmount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Optional"
                      className="input"
                      value={form.basicAmount}
                      onChange={(e) => updateField("basicAmount", e.target.value)}
                    />
                    {errors.basicAmount && <p className="field-error">{errors.basicAmount}</p>}
                  </div>
                </div>
              )}
              {form.period !== 'third' && (
                <div className="p-2">
                  <p className="form-text">
                    Optional. Supply it and the estimate is checked against it,
                    because an estimate below the basic amount may be increased
                    by SARS.
                  </p>
                </div>
              )}
              <div className="p-2" id='prov-tax-required-info'>
                <p className='infoText' aria-live='polite' aria-hidden='true'>
                  <small><Asterisk color="#C22419" fontWeight={700} size={16} aria-hidden='true' focusable='false' /> Indicates required information</small>
                </p>
              </div>
            </Stack>
          </div>
        </div>

        <div className="form-actions">
          <Stack gap={2} className="col-md-5 mx-auto" id="prov-tax-btn-stack">
            <Button
              type="submit"
              id="calculateProvTaxBtn"
              disabled={status === "calculating"}
              variant="light"
            >
              <Calculator size={16} />
              {status === "calculating" ? "Calculating..." : "Calculate"}
            </Button>
            <Button
              variant="danger"
              type="button"
              onClick={resetForm}
              id="clearProvTaxFormBtn"
            >
              <RotateCcw size={16} /> Reset
            </Button>
          </Stack>
        </div>
      </form>

      {/* --- Results --- */}
      {result && (
        <div className="results" id="prov-tax-results">
          <div className="results__header">
            <TrendingUp size={18} className="results__icon" />
            <h2 className="results__title">{result.periodLabel || period.heading}</h2>
          </div>

          {/* The date the IRP6 falls due, or nothing where the tax year has no
          dates. The API sends a plain YYYY-MM-DD, which parses as UTC midnight;
          the time is pinned on so it is read as LOCAL midnight instead and the
          date on screen cannot slip a day behind the one that was worked out. */}
          {result.dueDate && (
            <p className="prov-tax-due-date">
              <CalendarClock size={16} aria-hidden='true' focusable='false' />
              {' '}Due by {toLongDate(`${result.dueDate}T00:00:00`)}
            </p>
          )}

          <div className="results-summary">
            <div className="results-card">
              <p className="results-card__label">Tax liability for the year</p>
              <p className="results-card__value">{formatCurrency(result.annualTaxLiability)}</p>
            </div>
            <div className="results-card">
              <p className="results-card__label">Tax for this period</p>
              <p className="results-card__value">{formatCurrency(result.taxForPeriod)}</p>
            </div>
            <div className="results-card">
              <p className="results-card__label">Already withheld or paid</p>
              <p className="results-card__value">{formatCurrency(result.totalCredits)}</p>
            </div>
            <div className="results-card results-card--highlight">
              <p className="results-card__label">Amount payable</p>
              <p className="results-card__value">{formatCurrency(result.amountPayable)}</p>
            </div>
          </div>

          {/* An IRP6 cannot ask for a negative payment, so a surplus is
          reported here rather than disappearing into the floored total. */}
          {result.overpaid > 0 && (
            <p className="prov-tax-overpaid" role="status">
              Nothing is payable on this IRP6: what has already been withheld or
              paid exceeds the tax for this period by{' '}
              {formatCurrency(result.overpaid)}.
            </p>
          )}

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

          {/* The working, laid out the way an IRP6 is */}
          {result.breakdown?.length > 0 && (
            <div className="table-wrapper">
              <table className="breakdown-table" id="prov-tax-breakdown-table">
                <thead>
                  <tr>
                    <th>Working</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {result.breakdown.map((row, i) => (
                    <tr key={i} className={row.type === 'total' ? 'prov-tax-total-row' : undefined}>
                      <td>{row.label}</td>
                      <td className="breakdown-table__balance">
                        {/* A deduction is written as a negative, so the column
                        reads as the sum it is rather than as a list of figures */}
                        {row.type === 'deduct' ? '−' : ''}{formatCurrency(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* What the figures cannot show: what happens if the estimate was too
          low, or the payment is made late. */}
          {result.warnings?.length > 0 && (
            <ul className="prov-tax-warnings">
              {result.warnings.map((warning, i) => (
                <li key={i} className="prov-tax-warning">
                  <AlertCircle size={14} aria-hidden='true' focusable='false' /> {warning}
                </li>
              ))}
            </ul>
          )}

          <p className="disclaimer">
            This calculator is for estimation purposes only and does not
            constitute tax advice. Consult SARS or a registered tax practitioner
            before submitting an IRP6.
          </p>

          {isAuthenticated && onSave && (
            <div className="save-row">
              <Button
                type="button"
                /* Turns green once the calculation is safely in the user's
                history, red when the save was rejected. */
                variant={saveButtonVariant}
                id="saveProvTaxCalculationBtn"
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
  )
}
