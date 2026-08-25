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
import { Plus, Trash2, Save, RotateCcw, CheckCircle2, AlertCircle, Asterisk } from "lucide-react";
// IMPORT UTILITY FUNCTIONS
import {
  buildTaxYearPayload,
  emptyBracket,
  toTaxYearFormShape,
  validateTaxYearForm
} from '../utils/calculationFunc';

// ---------------------------------------------------------------------------
/*TaxYearConfigForm function component: Admin form to add or update a SARS tax year configuration:
brackets, rebates, and thresholds — matching the TaxYearConfig schema.

FORM BREAKDOWN — the five groups rendered below, in order:
  GROUP 1 (Tax Year)    : which year this config is for — label, start/end date, active flag
  GROUP 2 (Brackets)    : the repeating sliding-scale rows (min, max, base amount, rate)
  GROUP 3 (Rebates)     : flat annual amounts subtracted from the tax owed, by age band
  GROUP 4 (Thresholds)  : income levels below which no tax is payable, by age band
  GROUP 5 (Actions)     : submit and reset buttons

DATA FLOW — one round trip through this component:
  1. initialData (or null) -> toTaxYearFormShape() -> `form` state, where EVERY value is
     a string, because that is what controlled <input> elements need.
  2. Typing calls one of the update* helpers, which replace `form` immutably.
  3. Submitting runs validateTaxYearForm() -> `errors`, which drives the red messages
     and the aria-invalid flags on each field.
  4. If clean, buildTaxYearPayload() converts the strings back to numbers/dates and the
     result is handed to the onSubmit prop — this component never talks to the API itself.*/
export default function TaxYearConfigForm(//Export default TaxYearConfigForm component
  {//PROPS PASSED FROM PARENT COMPONENT(TaxData.js)
    initialData = null,//existing TaxYearConfig object to edit (omit to "add" new)
    onSubmit//async fn called with the assembled payload on save
  }) {
  /* One flag decides all the add-vs-update differences: the heading text, whether the
  tax year label is locked, and the wording of the success message. */
  const isEditMode = Boolean(initialData);
  // ==========STATE VARIABLES======================
  /* form: every field the admin can type into, held as strings and seeded from
  initialData (or blank defaults when adding). Passed to useState as a function so the
  shape is only built on the first render, not on every re-render. */
  const [form, setForm] = useState(() => toTaxYearFormShape(initialData));
  /* errors: field-name -> message map produced by validateTaxYearForm. Empty = valid.
  Keys match the field names ("taxYear", "bracket-0-min", "rebate-primary", ...) so each
  input can look up its own message. */
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // null | "saving" | "success" | "error"
  const [statusMessage, setStatusMessage] = useState("");// text shown in the status banner

  // --- field helpers ---------------------------------------------------
  /* All four helpers below rebuild `form` instead of mutating it — React only re-renders
  when it sees a new object reference, so spreading (...) is what makes the typing show up. */

  /* updateField: sets one top-level field (taxYear, startDate, endDate, isActive). */
  const updateField = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /* updateNested: sets one field inside a nested object — used for the rebates and
  thresholds groups, e.g. updateNested("rebates", "primary", "17235"). */
  const updateNested = (group, field, value) =>
    setForm((prev) => ({
      ...prev,
      [group]: { ...prev[group], [field]: value },
    }));

  /* updateBracket: sets one field on one bracket row. Maps over the array and only
  replaces the row at `index`, leaving the other rows as the same objects. */
  const updateBracket = (index, field, value) =>
    setForm((prev) => ({
      ...prev,
      brackets: prev.brackets.map((b, i) =>
        i === index ? { ...b, [field]: value } : b
      ),
    }));

  /* addBracket: appends a blank row so the admin can enter another bracket. */
  const addBracket = () =>
    setForm((prev) => ({ ...prev, brackets: [...prev.brackets, emptyBracket()] }));

  /* removeBracket: drops the row at `index`. The delete button is disabled at one row,
  so the form can never end up with an empty bracket list. */
  const removeBracket = (index) =>
    setForm((prev) => ({
      ...prev,
      brackets: prev.brackets.filter((_, i) => i !== index),
    }));

  /* resetForm: discards edits and goes back to the starting values — the saved record
  when editing, or blank fields when adding. Also clears errors and the status banner. */
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

  /* handleSubmit: runs on form submit — validate, build the payload, hand it to the
  parent, then report the outcome through the status banner. */
  async function handleSubmit(e) {
    e.preventDefault();// stop the browser doing a full page reload
    setStatus(null);// clear any banner left over from the previous attempt

    // BLOCK 1: refuse to submit while any field is invalid
    if (!validate()) {
      setStatus("error");
      setStatusMessage("Please fix the highlighted fields.");
      return;
    }

    // BLOCK 2: convert the string form values into the schema's numbers and dates
    const payload = buildTaxYearPayload(form);
    setStatus("saving");// disables the submit button while the request is in flight
    try {
      // BLOCK 3: the parent owns the actual create/update request
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
      // BLOCK 4: surface the server's message, or a generic one if it sent none
      setStatus("error");
      setStatusMessage(err?.message || "Something went wrong while saving.");
    }
  }

  const errText = "tax-field-error-text";// shared class for every field error message (TaxForm.css)

  // --- accessibility helpers ---------------------------------------------

  /* describedBy: only point aria-describedby at the error paragraph when that
  error actually exists, otherwise the attribute would reference a missing id. */
  const describedBy = (key) => (errors[key] ? `${key}-error` : undefined);

  //=====================JSX RENDERING================================
  /* MARKUP BREAKDOWN — the nesting the styles depend on:
    #tax-form-block                     outer wrapper for the whole panel
      #formHeadingBlock                 heading, switches wording on isEditMode
      status banner                     rendered only when status is success/error
      #add-tax-data-form                the <form>; onSubmit -> handleSubmit
        #tax-form-details-input         holds the four input groups
          #taxform-group1  + Stack 1    tax year identity
          #taxform-group2  + Stack 3    brackets: heading row, legend, repeating rows
          #taxform-group3               rebates, built from a [key, label] array
          #taxform-group4               thresholds, built from a [key, label] array
        #taxform-group5    + Stack 4    action buttons, outside the details wrapper
  Bootstrap <Stack> only handles spacing/direction here — the ids carry the CSS. */
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
          className="tax-form-status tax-form-status-success"
          // ARIA ATTRIBUTES:
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 size={16} className="tax-status-icon" aria-hidden='true' focusable='false' />
          {statusMessage}
        </div>
      )}
      {/* Error: role="alert" interrupts the screen reader so the failure is not missed */}
      {status === "error" && (
        <div
          className="tax-form-status tax-form-status-error"
          // ARIA ATTRIBUTES:
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle size={16} className="tax-status-icon" aria-hidden='true' focusable='false' />
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
        {/* Wrapper for groups 1-4 (the data entry). The action buttons sit outside it so
        they can be laid out separately from the fields. */}
        <div id="tax-form-details-input">
          {/* --- GROUP 1: TAX YEAR IDENTITY -------------------------------------
          Identifies WHICH tax year this configuration belongs to: its label, the
          period it covers, and whether calculations should default to it. */}
          <div id="taxform-group1" role="group" aria-labelledby="taxYearHead">
            <h5 className="formSectionHead" id="taxYearHead">Tax Year</h5>
            {/* STACK 1: TAX YEAR — vertical stack, one .p-2 block per field */}
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
                <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
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
                <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
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
                <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                {errors.endDate && (
                  <p className={errText} id="endDate-error">{errors.endDate}</p>
                )}
              </div>
              <div className="p-2" id="tax-year-block4">
                {/* INPUT: Active flag — marks this year as the one the calculator uses
                when the user does not pick a year explicitly. */}
                <input
                  type="checkbox"
                  className="tax-checkbox"
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
            {/* STACK2: INCOME TAX BRACKETS HEADING STACK — horizontal row holding the
            section title on the left and the "Add bracket" button on the right */}
            <Stack direction="horizontal" gap={3} id="income-tax-head-stack">
              <div className="p-2"><h5 className="formSectionHead" id="taxBracketsInput">Income Tax Brackets</h5></div>
              {/* ms-auto: empty spacer that eats the free space and pushes the button right */}
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
            {/* ---------ERROR MESSAGE----------
            Group-level error (e.g. brackets that overlap or are out of order), as opposed
            to the per-field errors rendered next to each input below. */}
            {errors.brackets && (
              <p className={errText} id="brackets-error" role="alert">{errors.brackets}</p>
            )}
            {/* ===========BRACKET DATA=====================
            The ListGroup below is the column-header legend for every bracket row; the
            inputs themselves carry aria-labels because they have no visible <label>. */}
            <div id="bracket-data">
              <ListGroup variant="flush" id="brackets" aria-hidden='true'>
                <ListGroup.Item id="bracketListItem1">
                <strong><p className="bracketDataPara"> Min (R): </p></strong>
                <p className="bracketDataPara">lowest taxable income this bracket applies to (in Rand) </p>
               </ListGroup.Item>
                <ListGroup.Item id="bracketListItem2">
                <strong><p className="bracketDataPara">Max (R) — blank(no ceiling):</p></strong>
                <p className="bracketDataPara">highest income in this bracket; left blank on thetop bracket </p>
                 </ListGroup.Item>
                <ListGroup.Item id="bracketListItem3">
                <strong><p className="bracketDataPara">Base amount (R): </p></strong>
                <p className="bracketDataPara">fixed tax already owed on all income below
                        this bracket's min, before the rate is applied </p></ListGroup.Item>
                <ListGroup.Item id="bracketListItem4">
                <strong><p className="bracketDataPara">Rate (%):</p></strong>
                <p className="bracketDataPara">percentage charged on income above the bracket  min
                       

                </p> </ListGroup.Item>
              </ListGroup>
              {/* BRACKET INPUT
              One row per bracket in state. `b` is the bracket being rendered and `i` is
              its position, which is used to build the aria-labels, error keys and the
              update/remove callbacks so each row only touches its own data. */}
              {form.brackets.map((b, i) => (
                <div
                  key={i}
                  id="form-bracket-layout"
                  // ARIA ATTRIBUTES:
                  role="group"
                  aria-label={`Tax bracket ${i + 1}`}
                >
                  {/* Left side: the four values that make up one bracket */}
                  <div id="bracket-input">
                    {/* STACK 3: BRACKET INPUT — the four fields, in the same order as the
                    legend above (Min, Max, Base amount, Rate) */}
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
                        <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
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
                        {/* <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small> */}
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
                        <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
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
                        <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                        {errors[`bracket-${i}-rate`] && (
                          <p className={errText} id={`bracket-${i}-rate-error`}>{errors[`bracket-${i}-rate`]}</p>
                        )}
                      </div>
                    </Stack>
                  </div>
                  {/* Right side: the row's delete control */}
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
                      <Trash2 size={16} fontWeight={700} aria-hidden='true' focusable='false'/>
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
            {/* TAX REBATES value={form.rebates[key]}
            The three rows are generated from a [stateKey, visibleLabel] array rather than
            written out by hand, so the markup stays identical across all three. */}
            <div id="rebates-input-block">
              {[
                ["primary", "Primary (all taxpayers)"],
                ["secondary", "Secondary (age 65+)"],
                ["tertiary", "Tertiary (age 75+)"],
              ].map(([key, text]) => (
                <div key={key} className="rebates-input-div">
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
                  <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
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
            {/* TAX THRESHOLDS: value={form.thresholds[key]}
            Same [stateKey, visibleLabel] pattern as the rebates group above. */}
            <div id="tax-threshold-input">
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
                  <small><Asterisk color="#C22419" fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                  {errors[`threshold-${key}`] && (
                    <p className={errText} id={`threshold-${key}-error`}>{errors[`threshold-${key}`]}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* ---  GROUP 5: Actions -------------------------------------------------
        Sits outside #tax-form-details-input so the buttons run along the bottom of the
        whole form rather than inside the field layout. */}
        <div id="taxform-group5">
          {/* STACK 4: FORM ACTIONS (BUTTONS) — horizontal row, buttons pushed right */}
          <Stack direction="horizontal" gap={3} id="tax-actions-stack">
            <div className="p-2"></div>
            {/* ms-auto on this block pushes it and everything after it to the right */}
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
