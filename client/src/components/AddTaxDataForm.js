// AddTaxDataForm.js
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useState } from "react";
// IMPORT CSS STYLESHEETS
import '../css/componentCss/TaxForm.css'
import '../css/componentCss/FormSetup.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
// IMPORT ICONS FROM LUCIDE-REACT
import { Plus, Trash2, Save, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
// IMPORT UTILITY FUNCTIONS
import {
  buildTaxYearPayload,
  emptyBracket,
  toTaxYearFormShape,
  validateTaxYearForm
} from '../utils/calculationFunc';

// ---------------------------------------------------------------------------
/*TaxYearConfigForm function component: Admin form to add or update a SARS tax year configuration:
brackets, rebates, and thresholds — matching the TaxYearConfig schema.*/
export default function TaxYearConfigForm(//Export default TaxYearConfigForm component
  {//PROPS PASSED FROM PARENT COMPONENT(TaxData.js)
    initialData = null,//existing TaxYearConfig object to edit (omit to "add" new)
    onSubmit//async fn called with the assembled payload on save
  }) {
  const isEditMode = Boolean(initialData);
  // ==========STATE VARIABLES======================
  const [form, setForm] = useState(() => toTaxYearFormShape(initialData));
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // null | "saving" | "success" | "error"
  const [statusMessage, setStatusMessage] = useState("");

  // --- field helpers ---------------------------------------------------

  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const updateNested = (group, field, value) =>
    setForm((prev) => ({
      ...prev,
      [group]: { ...prev[group], [field]: value },
    }));

  const updateBracket = (index, field, value) =>
    setForm((prev) => ({
      ...prev,
      brackets: prev.brackets.map((b, i) =>
        i === index ? { ...b, [field]: value } : b
      ),
    }));

  const addBracket = () =>
    setForm((prev) => ({ ...prev, brackets: [...prev.brackets, emptyBracket()] }));

  const removeBracket = (index) =>
    setForm((prev) => ({
      ...prev,
      brackets: prev.brackets.filter((_, i) => i !== index),
    }));

  const resetForm = () => {
    setForm(toTaxYearFormShape(initialData));
    setErrors({});
    setStatus(null);
  };

  // --- validation --------------------------------------------------------

  /* Check the inputs and show any field errors. Returns true when the form is
  good to submit. */
  function validate() {
    const errs = validateTaxYearForm(form);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // --- submit --------------------------------------------------------

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);

    if (!validate()) {
      setStatus("error");
      setStatusMessage("Please fix the highlighted fields.");
      return;
    }

    const payload = buildTaxYearPayload(form);
    setStatus("saving");
    try {
      if (onSubmit) {
        await onSubmit(payload);
      }
      setStatus("success");
      setStatusMessage(
        isEditMode
          ? `Tax year ${payload.taxYear} updated.`
          : `Tax year ${payload.taxYear} created.`
      );
    } catch (err) {
      setStatus("error");
      setStatusMessage(err?.message || "Something went wrong while saving.");
    }
  }

  const errText = "mt-1 text-xs text-red-600";

  // --- accessibility helpers ---------------------------------------------

  /* describedBy: only point aria-describedby at the error paragraph when that
  error actually exists, otherwise the attribute would reference a missing id. */
  const describedBy = (key) => (errors[key] ? `${key}-error` : undefined);

  //=====================JSX RENDERING================================
  return (
    <div id="tax-form-block">
      {/* FORM HEADING */}
      <div id="formHeadingBlock">
        <h3 id="formHeading">
          {isEditMode ? "Update Tax Year Configuration" : "Add Tax Year Configuration"}
        </h3>
      </div>
      {/* ======FORM STATUS============== */}
      {/* Success: role="status" + aria-live announces the save result to screen readers */}
      {status === "success" && (
        <div
          className="mb-4 flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800"
          // ARIA ATTRIBUTES:
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 size={16} className="shrink-0" aria-hidden='true' focusable='false' />
          {statusMessage}
        </div>
      )}
      {/* Error: role="alert" interrupts the screen reader so the failure is not missed */}
      {status === "error" && (
        <div
          className="mb-4 flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800"
          // ARIA ATTRIBUTES:
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle size={16} className="shrink-0" aria-hidden='true' focusable='false' />
          {statusMessage}
        </div>
      )}
      {/* =======FORM============== */}
      <form
        onSubmit={handleSubmit}
        id="add-tax-data-form"
        // ARIA ATTRIBUTES:
        aria-labelledby="formHeading"
        aria-busy={status === "saving"}
      >
        <div id="tax-form-details-input">
          {/* --- GROUP 1: TAX YEAR IDENTITY -------------------------------------
          Identifies WHICH tax year this configuration belongs to: its label, the
          period it covers, and whether calculations should default to it. */}
          <div id="taxform-group1" role="group" aria-labelledby="taxYearHead">
            <h5 className="formSectionHead" id="taxYearHead">Tax Year</h5>
            {/* STACK 1: TAX YEAR*/}
            <Stack gap={3} id="tax-year-stack">
              <div className="p-2" id="tax-year-block1">
                {/* INPUT: Tax year label — the "2025-2026" style key used to look this
                config up. Disabled while editing because it is the record identifier. */}
                <label className="tax-form-label" htmlFor="taxYearInput">Tax year label</label>
                <input
                  type="text"
                  placeholder="2025-2026"
                  className="tax-field"
                  id="taxYearInput"
                  name="taxYear"
                  value={form.taxYear}
                  disabled={isEditMode}
                  onChange={(e) => updateField("taxYear", e.target.value)}
                  // ARIA ATTRIBUTES:
                  aria-disabled={isEditMode}
                  aria-required="true"
                  aria-invalid={Boolean(errors.taxYear)}
                  aria-describedby={describedBy("taxYear")}
                />
                {errors.taxYear && (
                  <p className={errText} id="taxYear-error">{errors.taxYear}</p>
                )}
              </div>
              <div className="p-2" id="tax-year-block2">
                {/* INPUT: Start date — first day of the tax year (SARS years start 1 March). */}
                <label className='tax-form-label' htmlFor="startDateInput">Start date:</label>
                <input
                  type="date"
                  className="tax-field"
                  id="startDateInput"
                  name="startDate"
                  value={form.startDate}
                  onChange={(e) => updateField("startDate", e.target.value)}
                  // ARIA ATTRIBUTES:
                  aria-required="true"
                  aria-invalid={Boolean(errors.startDate)}
                  aria-describedby={describedBy("startDate")}
                />
                {errors.startDate && (
                  <p className={errText} id="startDate-error">{errors.startDate}</p>
                )}
              </div>
              <div className="p-2" id="tax-year-block3">
                {/* INPUT: End date — last day of the tax year; must fall after the start date. */}
                <label
                  className="tax-form-label" htmlFor="endDateInput"
                >End date</label>
                <input
                  type="date"
                  className="tax-field"
                  id="endDateInput"
                  name="endDate"
                  value={form.endDate}
                  onChange={(e) => updateField("endDate", e.target.value)}
                  // ARIA ATTRIBUTES:
                  aria-required="true"
                  aria-invalid={Boolean(errors.endDate)}
                  aria-describedby={describedBy("endDate")}
                />
                {errors.endDate && (
                  <p className={errText} id="endDate-error">{errors.endDate}</p>
                )}
              </div>
              <div className="p-2" id="tax-year-block4">
                {/* INPUT: Active flag — marks this year as the one the calculator uses
                when the user does not pick a year explicitly. */}
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  id="isActiveCheckbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={(e) => updateField("isActive", e.target.checked)}
                  // ARIA ATTRIBUTES:
                  aria-checked={form.isActive}
                />
                <label className="tax-checkbox-label" htmlFor="isActiveCheckbox"> Set as the active tax year (used by default in calculations)
                </label>
              </div>
            </Stack>
          </div>
          {/* ---   GROUP 2: BRACKETS ------------------------------------------------
          The sliding-scale rows SARS publishes for the year. Each row says: for income
          between min and max, charge baseAmount plus rate% of the amount above min. */}
          <div id="taxform-group2" role="group" aria-labelledby="taxBracketsInput">
            {/* STACK2: INCOME TAX BRACKETS HEADING STACK */}
            <Stack direction="horizontal" gap={3} id="income-tax-head-stack">
              <div className="p-2"><h5 className="formSectionHead" id="taxBracketsInput">Income Tax Brackets</h5></div>
              <div className="p-2 ms-auto"></div>
              <div className="p-2">
                {/* BUTTON: appends one more empty bracket row to the list */}
                <Button
                  type="button"
                  onClick={addBracket}
                  variant="light"
                  id="addIncomeTaxBracket"
                  // ARIA ATTRIBUTES:
                  aria-label="Add tax bracket"
                  aria-controls="bracket-data"
                >
                  <Plus size={16} fontWeight={700} aria-hidden='true' focusable='false'/> Add bracket
                </Button>
              </div>
            </Stack>
            {/* ---------ERROR MESSAGE---------- */}
            {errors.brackets && (
              <p className={errText} id="brackets-error" role="alert">{errors.brackets}</p>
            )}
            {/* ===========BRACKET DATA=====================
            The ListGroup below is the column-header legend for every bracket row; the
            inputs themselves carry aria-labels because they have no visible <label>. */}
            <div id="bracket-data">
              <ListGroup variant="flush" id="brackets" aria-hidden='true'>
                <ListGroup.Item id="bracketListItem1">Min (R)</ListGroup.Item>
                <ListGroup.Item id="bracketListItem2">Max (R) — blank = no ceiling</ListGroup.Item>
                <ListGroup.Item id="bracketListItem3">Base amount (R)</ListGroup.Item>
                <ListGroup.Item id="bracketListItem4">Rate (%)</ListGroup.Item>
              </ListGroup>
              {/* BRACKET INPUT */}
              {form.brackets.map((b, i) => (
                <div
                  key={i}
                  id="form-bracket-layout"
                  // ARIA ATTRIBUTES:
                  role="group"
                  aria-label={`Tax bracket ${i + 1}`}
                >
                  <div id="bracket-input">
                    {/* STACK 3: BRACKET INPUT */}
                    <Stack gap={3} id="bracket-input-stack">
                      {/* INPUT: Min — lowest taxable income this bracket applies to (in Rand) */}
                      <div className="p-2" id="bracket-item1-block">
                        <input
                          type="number"
                          placeholder="Min"
                          className="tax-field"
                          name={`bracket-${i}-min`}
                          value={b.min}
                          onChange={(e) => updateBracket(i, "min", e.target.value)}
                          // ARIA ATTRIBUTES:
                          aria-label={`Bracket ${i + 1} minimum income in Rand`}
                          aria-required="true"
                          aria-invalid={Boolean(errors[`bracket-${i}-min`])}
                          aria-describedby={describedBy(`bracket-${i}-min`)}
                        />
                        {errors[`bracket-${i}-min`] && (
                          <p className={errText} id={`bracket-${i}-min-error`}>{errors[`bracket-${i}-min`]}</p>
                        )}
                      </div>
                      <div className="p-2" id="bracket-item2-block">
                        {/* INPUT: Max — highest income in this bracket; left blank on the
                        top bracket, which has no ceiling */}
                        <input
                          type="number"
                          placeholder="No ceiling"
                          className="tax-field"
                          name={`bracket-${i}-max`}
                          value={b.max}
                          onChange={(e) => updateBracket(i, "max", e.target.value)}
                          // ARIA ATTRIBUTES:
                          aria-label={`Bracket ${i + 1} maximum income in Rand, leave blank for no ceiling`}
                          aria-invalid={Boolean(errors[`bracket-${i}-max`])}
                          aria-describedby={describedBy(`bracket-${i}-max`)}
                        />
                        {errors[`bracket-${i}-max`] && (
                          <p className={errText} id={`bracket-${i}-max-error`}>{errors[`bracket-${i}-max`]}</p>
                        )}
                      </div>
                      <div className="p-2" id="bracket-item3-block">
                        {/* INPUT: Base amount — fixed tax already owed on all income below
                        this bracket's min, before the rate is applied */}
                        <input
                          type="number"
                          placeholder="Base amount"
                          className="tax-field"
                          name={`bracket-${i}-baseAmount`}
                          value={b.baseAmount}
                          onChange={(e) => updateBracket(i, "baseAmount", e.target.value)}
                          // ARIA ATTRIBUTES:
                          aria-label={`Bracket ${i + 1} base amount in Rand`}
                          aria-required="true"
                          aria-invalid={Boolean(errors[`bracket-${i}-baseAmount`])}
                          aria-describedby={describedBy(`bracket-${i}-baseAmount`)}
                        />
                        {errors[`bracket-${i}-baseAmount`] && (
                          <p className={errText} id={`bracket-${i}-baseAmount-error`}>{errors[`bracket-${i}-baseAmount`]}</p>
                        )}
                      </div>
                      <div className="p-2" id="bracket-item4-block">
                        {/* INPUT: Rate — percentage charged on income above this bracket's
                        min; step 0.01 allows fractional percentages */}
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Rate %"
                          className="tax-field"
                          name={`bracket-${i}-rate`}
                          value={b.rate}
                          onChange={(e) => updateBracket(i, "rate", e.target.value)}
                          // ARIA ATTRIBUTES:
                          aria-label={`Bracket ${i + 1} rate percentage`}
                          aria-required="true"
                          aria-invalid={Boolean(errors[`bracket-${i}-rate`])}
                          aria-describedby={describedBy(`bracket-${i}-rate`)}
                        />
                        {errors[`bracket-${i}-rate`] && (
                          <p className={errText} id={`bracket-${i}-rate-error`}>{errors[`bracket-${i}-rate`]}</p>
                        )}
                      </div>
                    </Stack>
                  </div>
                  <div id="delete-bracket-div">
                    {/* BUTTON: removes this bracket row; disabled when only one row is left */}
                    <Button
                      variant="danger"
                      type="button"
                      onClick={() => removeBracket(i)}
                      disabled={form.brackets.length === 1}
                      title="Remove bracket"
                      size="sm"
                      id="removeBracketBtn"
                      // ARIA ATTRIBUTES:
                      aria-label={`Delete tax bracket ${i + 1}`}
                      aria-disabled={form.brackets.length === 1}
                    >
                      <Trash2 size={16} fontWeight={700} color="#000" aria-hidden='true' focusable='false'/>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* ---   GROUP 3:Rebates ----------------------
          Rebates are flat annual amounts subtracted from the calculated tax. They stack
          by age: 65+ gets primary + secondary, 75+ gets primary + secondary + tertiary. */}
          <div id="taxform-group3" role="group" aria-labelledby="annualRebates">
            <h5 className="formSectionHead" id="annualRebates">Rebates (annual, R)</h5>
            {/* TAX REBATES value={form.rebates[key]}*/}
            <div id="rebates-input-block">
              {[
                ["primary", "Primary (all taxpayers)"],
                ["secondary", "Secondary (age 65+)"],
                ["tertiary", "Tertiary (age 75+)"],
              ].map(([key, text]) => (
                <div key={key}>
                  {/* INPUT: rebate amount in Rand for this age band. The id is built from
                  the key so each row gets a unique, label-linkable id. */}
                  <label className="tax-form-label" htmlFor={`rebate-${key}-input`}>{text}:</label>
                  <input
                    type="number"
                    id={`rebate-${key}-input`}
                    name={`rebate-${key}`}
                    className="tax-field"
                    value={form.rebates[key]}
                    onChange={(e) => updateNested("rebates", key, e.target.value)}
                    // ARIA ATTRIBUTES:
                    aria-required="true"
                    aria-invalid={Boolean(errors[`rebate-${key}`])}
                    aria-describedby={describedBy(`rebate-${key}`)}
                  />
                  {errors[`rebate-${key}`] && (
                    <p className={errText} id={`rebate-${key}-error`}>{errors[`rebate-${key}`]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          {/* --- GROUP 4:Thresholds -------------------------------------------------
          Thresholds are the income levels below which no tax is payable, per age band.
          They follow from the rebates but are stored explicitly for display. */}
          <div id="taxform-group4" role="group" aria-labelledby="taxThresholdsInput">
            <h5 className="formSectionHead" id="taxThresholdsInput">Tax Thresholds (R)</h5>
            {/* TAX THRESHOLDS: value={form.thresholds[key]} */}
            <div id="tax-threshold-div">
              {[
                ["under65", "Under 65"],
                ["age65to74", "65 to below 75"],
                ["age75plus", "75 and older"],
              ].map(([key, text]) => (
                <div key={key} className="tax-threshold-div">
                  {/* INPUT: tax-free income ceiling in Rand for this age band. The id is
                  built from the key so each row gets a unique, label-linkable id. */}
                  <label
                    className="tax-form-label"
                    htmlFor={`threshold-${key}-input`}
                  >
                    {text}:
                  </label>
                  <input
                    type="number"
                    className="tax-field"
                    id={`threshold-${key}-input`}
                    name={`threshold-${key}`}
                    value={form.thresholds[key]}
                    onChange={(e) => updateNested("thresholds", key, e.target.value)}
                    // ARIA ATTRIBUTES:
                    aria-required="true"
                    aria-invalid={Boolean(errors[`threshold-${key}`])}
                    aria-describedby={describedBy(`threshold-${key}`)}
                  />
                  {errors[`threshold-${key}`] && (
                    <p className={errText} id={`threshold-${key}-error`}>{errors[`threshold-${key}`]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* ---  GROUP 5: Actions ------------------------------------------------- */}
        <div id="taxform-group5">
          {/* STACK 4: FORM ACTIONS (BUTTONS) */}
          <Stack direction="horizontal" gap={3} id="tax-actions-stack">
            <div className="p-2"></div>
            <div className="p-2 ms-auto">
              {/* SUBMIT TAXCONFIG FORM BUTTON: validates, then hands the payload to onSubmit */}
              <Button
                variant="light"
                type="submit"
                disabled={status === "saving"}
                id="submitTaxDataBtn"
                //  ARIA ATTRIBUTES
                aria-label={isEditMode ? "Update tax year configuration" : "Create tax year configuration"}
                aria-disabled={status === "saving"}
                aria-busy={status === "saving"}
              >
                <Save size={16} fontWeight={700} aria-hidden='true' focusable='false'/>
                {status === "saving"
                  ? "Saving..."
                  : isEditMode
                  ? "Update tax year"
                  : "Create tax year"}
              </Button>
            </div>
            <div className="p-2">
              {/* RESET/CLEAR FORM BUTTON: restores the fields to initialData (or empty) */}
              <Button
                variant="danger"
                type="button"
                onClick={resetForm}
                id="clearFormBtn"
                // ARIA ATTRIBUTES
                aria-label="Reset tax config form"
                aria-controls="add-tax-data-form"
              >
                <RotateCcw size={16} aria-hidden='true' focusable='false' /> Reset
              </Button>
            </div>
          </Stack>
        </div>
      </form>
    </div>
  );
}
