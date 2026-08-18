import React, { useState } from "react";
import '../css/componentCss/TaxForm.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Plus, Trash2, Save, RotateCcw, CheckCircle2, AlertCircle } from "lucide-react";

// ---------------------------------------------------------------------------
// TaxYearConfigForm
// Admin form to add or update a SARS tax year configuration:
// brackets, rebates, and thresholds — matching the TaxYearConfig schema.
//
// Props:
//   initialData   - existing TaxYearConfig object to edit (omit to "add" new)
//   onSubmit(data)- async fn called with the assembled payload on save
// ---------------------------------------------------------------------------

const emptyBracket = () => ({ min: "", max: "", baseAmount: "", rate: "" });

const blankForm = {
  taxYear: "",
  startDate: "",
  endDate: "",
  brackets: [emptyBracket()],
  rebates: { primary: "", secondary: "", tertiary: "" },
  thresholds: { under65: "", age65to74: "", age75plus: "" },
  isActive: true,
};

function toFormShape(data) {
  if (!data) return blankForm;
  return {
    taxYear: data.taxYear ?? "",
    startDate: data.startDate ? data.startDate.slice(0, 10) : "",
    endDate: data.endDate ? data.endDate.slice(0, 10) : "",
    brackets:
      data.brackets?.length > 0
        ? data.brackets.map((b) => ({
            min: b.min ?? "",
            max: b.max ?? "",
            baseAmount: b.baseAmount ?? "",
            rate: b.rate != null ? b.rate * 100 : "", // store as % in the UI
          }))
        : [emptyBracket()],
    rebates: {
      primary: data.rebates?.primary ?? "",
      secondary: data.rebates?.secondary ?? "",
      tertiary: data.rebates?.tertiary ?? "",
    },
    thresholds: {
      under65: data.thresholds?.under65 ?? "",
      age65to74: data.thresholds?.age65to74 ?? "",
      age75plus: data.thresholds?.age75plus ?? "",
    },
    isActive: data.isActive ?? true,
  };
}

export default function TaxYearConfigForm({ initialData = null, onSubmit }) {
  const isEditMode = Boolean(initialData);
  const [form, setForm] = useState(() => toFormShape(initialData));
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
    setForm(toFormShape(initialData));
    setErrors({});
    setStatus(null);
  };

  // --- validation --------------------------------------------------------

  function validate() {
    const errs = {};

    if (!/^\d{4}-\d{4}$/.test(form.taxYear.trim())) {
      errs.taxYear = "Use the format YYYY-YYYY, e.g. 2025-2026";
    }
    if (!form.startDate) errs.startDate = "Start date is required";
    if (!form.endDate) errs.endDate = "End date is required";
    if (form.startDate && form.endDate && form.startDate >= form.endDate) {
      errs.endDate = "End date must be after start date";
    }

    if (form.brackets.length === 0) {
      errs.brackets = "At least one bracket is required";
    }

    form.brackets.forEach((b, i) => {
      if (b.min === "" || Number(b.min) < 0) {
        errs[`bracket-${i}-min`] = "Required";
      }
      if (b.max !== "" && Number(b.max) <= Number(b.min)) {
        errs[`bracket-${i}-max`] = "Must be greater than min";
      }
      if (b.baseAmount === "" || Number(b.baseAmount) < 0) {
        errs[`bracket-${i}-baseAmount`] = "Required";
      }
      if (b.rate === "" || Number(b.rate) <= 0 || Number(b.rate) > 100) {
        errs[`bracket-${i}-rate`] = "0–100";
      }
      if (i > 0) {
        const prev = form.brackets[i - 1];
        if (prev.max !== "" && b.min !== "" && Number(b.min) !== Number(prev.max) + 1) {
          errs[`bracket-${i}-min`] = `Should follow previous bracket (${
            prev.max === "" ? "?" : Number(prev.max) + 1
          })`;
        }
      }
    });

    ["primary", "secondary", "tertiary"].forEach((k) => {
      if (form.rebates[k] === "" || Number(form.rebates[k]) < 0) {
        errs[`rebate-${k}`] = "Required";
      }
    });

    ["under65", "age65to74", "age75plus"].forEach((k) => {
      if (form.thresholds[k] === "" || Number(form.thresholds[k]) < 0) {
        errs[`threshold-${k}`] = "Required";
      }
    });

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // --- submit --------------------------------------------------------

  function buildPayload() {
    return {
      taxYear: form.taxYear.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      brackets: form.brackets.map((b) => ({
        min: Number(b.min),
        max: b.max === "" ? null : Number(b.max),
        baseAmount: Number(b.baseAmount),
        rate: Number(b.rate) / 100, // convert % back to decimal
      })),
      rebates: {
        primary: Number(form.rebates.primary),
        secondary: Number(form.rebates.secondary),
        tertiary: Number(form.rebates.tertiary),
      },
      thresholds: {
        under65: Number(form.thresholds.under65),
        age65to74: Number(form.thresholds.age65to74),
        age75plus: Number(form.thresholds.age75plus),
      },
      isActive: form.isActive,
    };
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus(null);

    if (!validate()) {
      setStatus("error");
      setStatusMessage("Please fix the highlighted fields.");
      return;
    }

    const payload = buildPayload();
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
        {/* <p >
          Defines the SARS brackets, rebates, and thresholds used by the tax
          calculator for a given tax year. New Budget Speech figures should
          be added here as a new tax year, not hardcoded in the calculator.
        </p> */}
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

      <form onSubmit={handleSubmit} noValidate id="add-tax-data-form">
      <div id="tax-form-details-input">
        {/* --- Tax year identity ------------------------------------- */}
      <div id="taxform-group1">
 <h5 className="formSectionHead">Tax Year</h5>
  <Stack  gap={3}>
      <div className="p-2" id="tax-year-block1">
          <label  className="tax-form-label">Tax year label</label>
              <input
                type="text"
                placeholder="2025-2026"
                className="taxdata-input"
                // className={fieldCls("taxYear")}
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
                className="taxdata-input"
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
                // className={fieldCls("endDate")}
                className="taxdata-input"
                value={form.endDate}
                onChange={(e) => updateField("endDate", e.target.value)}
              />
              {errors.endDate && <p className={errText}>{errors.endDate}</p>}
      </div>
      <div>
        
      </div>
    </Stack>
       <Stack direction="horizontal" gap={3}>
      <div className="p-2" id="taxyearcheckbox-input">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={form.isActive}
              onChange={(e) => updateField("isActive", e.target.checked)}
            />
             <label className="tax-checkbox-label"> Set as the active tax year (used by default in calculations)
          </label>
           </div>
      <div className="p-2"></div>
      <div className="p-2"></div>
    </Stack>
          
      </div>
        {/* --- Brackets ------------------------------------------------ */}
      <div id="taxform-group2">
 
    <Stack direction="horizontal" gap={3}>
      <div className="p-2"><h5 className="formSectionHead">Income Tax Brackets</h5></div>
      <div className="p-2 ms-auto">Second item</div>
      <div className="p-2">
        <Button
        type="button"
              onClick={addBracket}
              variant="secondary"
              id="addIncomeTaxBracket"
        >
<Plus size={16} /> Add bracket
        </Button>
      </div>
    </Stack>
          {errors.brackets && <p className={errText}>{errors.brackets}</p>}
          <div id="bracket-data">
            <div id="brackets">
              <span>Min (R)</span>
              <span>Max (R) — blank = no ceiling</span>
              <span>Base amount (R)</span>
              <span>Rate (%)</span>
              <span></span>
            </div>
            {form.brackets.map((b, i) => (
              <div
                key={i}
                id="form-bracket-layout"
              >
              <div id="bracket-input">
                <div>
                  <input
                    type="number"
                    placeholder="Min"
                    // className={fieldCls(`bracket-${i}-min`)}
                    className="taxdata-input"
                    value={b.min}
                    onChange={(e) => updateBracket(i, "min", e.target.value)}
                  />
                  {errors[`bracket-${i}-min`] && (
                    <p className={errText}>{errors[`bracket-${i}-min`]}</p>
                  )}
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="No ceiling"
                    className="taxdata-input"
                    // className={fieldCls(`bracket-${i}-max`)}
                    value={b.max}
                    onChange={(e) => updateBracket(i, "max", e.target.value)}
                  />
                  {errors[`bracket-${i}-max`] && (
                    <p className={errText}>{errors[`bracket-${i}-max`]}</p>
                  )}
                </div>
                <div>
                  <input
                    type="number"
                    placeholder="Base amount"
                    className="taxdata-input"
                    // className={fieldCls(`bracket-${i}-baseAmount`)}
                    value={b.baseAmount}
                    onChange={(e) => updateBracket(i, "baseAmount", e.target.value)}
                  />
                  {errors[`bracket-${i}-baseAmount`] && (
                    <p className={errText}>{errors[`bracket-${i}-baseAmount`]}</p>
                  )}
                </div>
                <div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Rate %"
                    className="taxdata-input"
                    // className={fieldCls(`bracket-${i}-rate`)}
                    value={b.rate}
                    onChange={(e) => updateBracket(i, "rate", e.target.value)}
                  />
                  {errors[`bracket-${i}-rate`] && (
                    <p className={errText}>{errors[`bracket-${i}-rate`]}</p>
                  )}
                </div>
              </div> 
              <div id="delete-bracket-div">
                <Button
                  type="button"
                  onClick={() => removeBracket(i)}
                  disabled={form.brackets.length === 1}
                  className="self-center text-gray-400 hover:text-red-600 disabled:opacity-30 disabled:hover:text-gray-400 p-2"
                  title="Remove bracket"
                  size="sm"
                  id="removeBracketBtn"
                >
                  <Trash2 size={16} />
                </Button>
                </div>
              </div>
            ))}
          </div>
      </div>
        {/* --- Rebates ------------------------------------------------- */}
        <div id="taxform-group3">
          <h5>Rebates (annual, R)</h5>
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
        {/* --- Thresholds ------------------------------------------------- */}
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
                  className={fieldCls(`threshold-${key}`)}
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
        <Stack direction="horizontal" gap={3}>
      <div className="p-2"></div>
      <div className="p-2 ms-auto">
           <Button
          variant="light"
            type="submit"
            disabled={status === "saving"}
           id="submitTaxDataBtn"
          >
            <Save size={16} />
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