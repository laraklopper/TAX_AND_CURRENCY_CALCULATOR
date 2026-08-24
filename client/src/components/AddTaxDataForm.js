import React, { useState } from "react";
import '../css/componentCss/TaxForm.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import { Plus, Trash2, Save, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";
// IMPORT UTILITY FUNCTIONS
import {
  buildTaxYearPayload,
  emptyBracket,
  toTaxYearFormShape,
  validateTaxYearForm
} from '../utils/calculationFunc';

// ---------------------------------------------------------------------------
// TaxYearConfigForm
// Admin form to add or update a SARS tax year configuration:
// brackets, rebates, and thresholds — matching the TaxYearConfig schema.
//
// Props:
//   initialData   - existing TaxYearConfig object to edit (omit to "add" new)
//   onSubmit(data)- async fn called with the assembled payload on save
// ---------------------------------------------------------------------------

export default function TaxYearConfigForm({ initialData = null, onSubmit }) {
  const isEditMode = Boolean(initialData);
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

  
  const fieldCls = (key) =>
    `tax-field ${errors[key] ? "tax-field-error" : "tax-field-ok"}`;
  // const label = "block text-xs font-medium text-gray-600 mb-1";
  const errText = "mt-1 text-xs text-red-600";

  return (
    <div id="tax-form-block">
      <div id="formHeadingBlock">
        <h3 id="formHeading">
          {isEditMode ? "Update Tax Year Configuration" : "Add Tax Year Configuration"}
        </h3>
      </div>
      {status === "success" && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-800">
          <CheckCircle2 size={16} className="shrink-0" />
          {statusMessage}
        </div>
      )}
      {status === "error" && (
        <div className="mb-4 flex items-center gap-2 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
          <AlertCircle size={16} className="shrink-0" />
          {statusMessage}
        </div>
      )}
      {/* =======FORM============== */}
      <form onSubmit={handleSubmit}  id="add-tax-data-form">
      <div id="tax-form-details-input">
        {/* --- GROUP 1: TAX YEAR IDENTITY ------------------------------------- */}
      <div id="taxform-group1" aria-labelledby="taxYearHead">
        <h5 className="formSectionHead" id="taxYearHead">Tax Year</h5>
        {/* STACK 1 */}
      <Stack  gap={3} id="tax-year-stack">
      <div className="p-2" id="tax-year-block1">
          <label className="tax-form-label">Tax year label</label>
              <input
                type="text"
                placeholder="2025-2026"
                className="tax-field"
                value={form.taxYear}
                disabled={isEditMode}
                onChange={(e) => updateField("taxYear", e.target.value)}
                // ARIA ATTRIBUTES: 
                aria-disabled={isEditMode}
              />
              {errors.taxYear && <p className={errText}>{errors.taxYear}</p>}
      </div>
      <div className="p-2" id="tax-year-block2">
            <label className='tax-form-label'>Start date:</label>
              <input
                type="date"
                // className={fieldCls("startDate")}
                className="tax-field"
                value={form.startDate}
                onChange={(e) => updateField("startDate", e.target.value)}
              />
              {errors.startDate && <p className={errText}>{errors.startDate}</p>}
      </div>
      <div className="p-2" id="tax-year-block3">
           <label 
              className="tax-form-label"
              >End date</label>
              <input
                type="date"
                className="tax-field"
                // name=""
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
              />
              {errors.endDate && <p className={errText}>{errors.endDate}</p>}
      </div>
       <div className="p-2" id="tax-year-block4">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={form.isActive}
              onChange={(e) => updateField("isActive", e.target.checked)}
            />
             <label className="tax-checkbox-label"> Set as the active tax year (used by default in calculations)
          </label>
           </div>
    </Stack>
      </div>
        {/* ---   GROUP 2: BRACKETS ------------------------------------------------ */}
      <div id="taxform-group2">
      {/* INCOME TAX BRACKETS HEADING STACK */}
    <Stack direction="horizontal" gap={3} id="income-tax-head-stack">
      <div className="p-2"><h5 className="formSectionHead">Income Tax Brackets</h5></div>
      <div className="p-2 ms-auto"></div>
      <div className="p-2">
        <Button
              type="button"
              onClick={addBracket}
              variant="light"
              id="addIncomeTaxBracket"
              // ARIA ATTRIBUTES:
              aria-label="addBracket"
        >
<Plus size={16} fontWeight={700} aria-hidden='true' focusable='false'/> Add bracket
        </Button>
      </div>
    </Stack>
          {errors.brackets && <p className={errText}>{errors.brackets}</p>}
          <div id="bracket-data">
            <ListGroup variant="flush" id="brackets">
              <ListGroup.Item id="bracketListItem1">Min (R)</ListGroup.Item>
              <ListGroup.Item id="bracketListItem2">Max (R) — blank = no ceiling</ListGroup.Item>
              <ListGroup.Item id="bracketListItem3">Base amount (R)</ListGroup.Item>
              <ListGroup.Item id="bracketListItem4">Rate (%)</ListGroup.Item>
            </ListGroup>
            {form.brackets.map((b, i) => (
              <div
                key={i}
                id="form-bracket-layout"
              >
              <div id="bracket-input">
              <Stack gap={3} id="bracket-input-stack">
      <div className="p-2">
          <input
                    type="number"
                    placeholder="Min"
                    className="tax-field"
                    value={b.min}
                    onChange={(e) => updateBracket(i, "min", e.target.value)}
                  />
                  {errors[`bracket-${i}-min`] && (
                    <p className={errText}>{errors[`bracket-${i}-min`]}</p>
                  )}
      </div>
      <div className="p-2">
         <input
                    type="number"
                    placeholder="No ceiling"
                    className="tax-field"
                    value={b.max}
                    onChange={(e) => updateBracket(i, "max", e.target.value)}
                  />
                  {errors[`bracket-${i}-max`] && (
                    <p className={errText}>{errors[`bracket-${i}-max`]}</p>
                  )}
      </div>
      <div className="p-2">
         <input
                    type="number"
                    placeholder="Base amount"
                    className="tax-field"
                    value={b.baseAmount}
                    onChange={(e) => updateBracket(i, "baseAmount", e.target.value)}
                  />
                  {errors[`bracket-${i}-baseAmount`] && (
                    <p className={errText}>{errors[`bracket-${i}-baseAmount`]}</p>
                  )}
      </div>
      <div className="p-2">
        <input
                    type="number"
                    step="0.01"
                    placeholder="Rate %"
                    className="tax-field"
                    value={b.rate}
                    onChange={(e) => updateBracket(i, "rate", e.target.value)}
                  />
                  {errors[`bracket-${i}-rate`] && (
                    <p className={errText}>{errors[`bracket-${i}-rate`]}</p>
                  )}
      </div>
    </Stack>
               
               
              </div> 
              <div id="delete-bracket-div">
                <Button
                  variant="danger"
                  type="button"
                  onClick={() => removeBracket(i)}
                  disabled={form.brackets.length === 1}
                  title="Remove bracket"
                  size="sm"
                  id="removeBracketBtn"
                >
                  <Trash2 size={16} fontWeight={700} color="#000"/>
                </Button>
                </div>
              </div>
            ))}
          </div>
      </div>
        {/* --- Rebates ------------------------------------------------- */}
        <div id="taxform-group3" aria-labelledby="annualRebates">
          <h5 className="formSectionHead" id="annualRebates">Rebates (annual, R)</h5>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              ["primary", "Primary (all taxpayers)"],
              ["secondary", "Secondary (age 65+)"],
              ["tertiary", "Tertiary (age 75+)"],
            ].map(([key, text]) => (
              <div key={key}>
                <label className="tax-form-label">{text}</label>
                <input
                  type="number"
                  className={fieldCls(`rebate-${key}`)}
                  value={form.rebates[key]}
                  onChange={(e) => updateNested("rebates", key, e.target.value)}
                />
                {errors[`rebate-${key}`] && (
                  <p className={errText}>{errors[`rebate-${key}`]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
        {/* --- GROUP 4:Thresholds ------------------------------------------------- */}
        <div id="taxform-group4">
          <h5 className="formSectionHead">Tax Thresholds (R)</h5>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              ["under65", "Under 65"],
              ["age65to74", "65 to below 75"],
              ["age75plus", "75 and older"],
            ].map(([key, text]) => (
              <div key={key}>
                <label 
                className="tax-form-label"
                >{text}</label>
                <input
                  type="number"
                  className="tax-field"
                  // className={fieldCls(`threshold-${key}`)}
                  value={form.thresholds[key]}
                  onChange={(e) => updateNested("thresholds", key, e.target.value)}
                />
                {errors[`threshold-${key}`] && (
                  <p className={errText}>{errors[`threshold-${key}`]}</p>
                )}
              </div>
            ))}
          </div>
        </div>
</div>
        {/* --- Actions ------------------------------------------------- */}
        <div id="taxform-group5">
        <Stack direction="horizontal" gap={3} id="tax-actions-stack">
      <div className="p-2"></div>
      <div className="p-2 ms-auto">
           <Button
            variant="light"
            type="submit"
            disabled={status === "saving"}
           id="submitTaxDataBtn"
           role="button"
          >
            <Save size={16} fontWeight={700} aria-hidden='true' focusable='false'/>
            {status === "saving"
              ? "Saving..."
              : isEditMode
              ? "Update tax year"
              : "Create tax year"}
          </Button>
      </div>
      <div className="p-2"><Button
          variant="danger"
          type="button"
            onClick={resetForm}
            id="clearFormBtn"
          >
            <RotateCcw size={16} /> Reset
          </Button></div>
    </Stack>
       
       
          
        </div>
      </form>
    </div>
  );
}