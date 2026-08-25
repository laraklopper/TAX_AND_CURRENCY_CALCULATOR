# TAX YEAR CONFIG FORM

- [TaxYearConfigForm](../client/src/components/AddTaxDataForm.js)

Form component used to both create and edit TaxYearConfig documents, matching the tax year schema [TaxYearSchema.js](../server/models/TaxYearSchema.js).

•	Accepts an optional initialData prop — present it prefilled to edit an existing tax year (taxYear field locked), or omit it to create a new one
•	Dynamic bracket rows: add/remove brackets, entering rate as a percentage in the UI and converting to a decimal on submit
•	Client-side validation: YYYY-YYYY tax year format, date ordering, bracket continuity (each bracket's min follows the previous bracket's max), and non-negative rebate/threshold values
•	Calls an onSubmit(payload) prop with a schema-shaped object; 
◦	the parent component ([TaxData.js](../client/src/pages/TaxData.js)) wires this to `POST /tax/config`, which upserts on the tax year label — the same request creates a new year or corrects an existing one
•	Restricted to admin users only — gated behind ProtectedAdminRoute on the `/taxes` route, since incorrect tax data would affect every user's calculations


## TABLE OF CONTENTS
1. [API REQUESTS](#1-api-requests)
2. [INPUT GROUPS](#2-input-groups)
    - [2.1. GROUP 1: TAX YEAR IDENTITY](#21-group-1-tax-year-identity)
    - [2.2. GROUP 2: INCOME TAX BRACKETS](#22-group-2-income-tax-brackets)
    - [2.3. GROUP 3: REBATES](#23-group-3-rebates)
    - [2.4. GROUP 4: THRESHOLDS](#24-group-4-thresholds)
    - [2.5. GROUP 5: FORM ACTIONS](#25-group-5-form-actions)
3. [FORM OUTPUT DISPLAY](#3-form-output-display)
4. [REFERENCES](#4-references)
## 1. API REQUEST(s):

The form itself makes **no network calls**. It builds a payload and awaits the `onSubmit` prop; [TaxData.js](../client/src/pages/TaxData.js) owns the requests.

| Method | Endpoint | Called from | Purpose |
| --- | --- | --- | --- |
| `GET` | `/tax/sconfig` | `loadTaxYearConfig` — [TaxData.js:47](../client/src/pages/TaxData.js#L47) | Loads the stored configuration on mount so the read-only display shows real figures, not seed data |
| `POST` | `/tax/config` | `saveTaxYearConfig` — [TaxData.js:76](../client/src/pages/TaxData.js#L76) | Saves the payload the form assembles |

Both requests send `Authorization: Bearer <token>` from `localStorage`, against `API_BASE_URL` (`http://localhost:3001`).

### There is no PUT route

The tax year **label is the identity** of a configuration, not an id from the request — so [taxRoutes.js:282](../server/routes/taxRoutes.js#L282) upserts:

- year already exists → `findOneAndUpdate` → **200** `"Tax year 2025-2026 updated"`
- year is new → `create` → **201** `"Tax year 2025-2026 created"`

The form posts the same way in either mode, so correcting a year can never quietly create a second, competing copy of one already there. If the saved year has `isActive: true`, the route stands every other active year down — only one year may be active, because `GET /config` and the calculator both resolve the current year with `findOne({ isActive: true })`.

### Response handling

The response body is `{ success, message, config }`. `config` is the saved document, and `TaxData.js` feeds it back into `taxConfigToEdit` — so after a create the form flips into edit mode on the year just saved, and a follow-up save updates it instead of trying to create it twice. It then re-runs `GET /tax/config` to refresh the display.

`saveTaxYearConfig` deliberately **throws** the API's message rather than handling it, because the form's `catch` renders it in the error banner.

| Status | Cause |
| --- | --- |
| 400 | Server-side validation failed, or Mongoose schema validation failed |
| 401 / 403 | Missing or non-admin token — `checkAdmin` re-reads the admin flag from the database rather than trusting the token |
| 409 | Duplicate key on the unique `taxYear` index — the year was created by another request between the lookup and the write |
| 500 | Internal server error |

### Validation runs twice, on purpose

[validateTaxYearConfig](../server/routes/taxRoutes.js#L79) repeats the browser's checks because the browser's copy can be bypassed. The server is stricter in three ways:

- `MAX_BRACKETS = 12` — a runaway-payload guard (SARS has never published more than seven)
- **only the last bracket** may have a `null` max; the client only checks that a filled-in max exceeds its min
- dates go through `parseIsoDate`, which rejects rollover dates — `new Date('2025-02-30')` silently becomes 2 March, and a start date that quietly moved would put the year of assessment out by days

`parseTaxYearConfig` then rebuilds the document field by field, so a request can never set `_id` or `createdAt`.

## 2. INPUT GROUPS

The form's state is one object shaped by [toTaxYearFormShape](../client/src/utils/calculationFunc.js#L289). Every value is held as a **string**, because that is what an input holds, and rates are held as **percentages** rather than the decimals the schema stores. [buildTaxYearPayload](../client/src/utils/calculationFunc.js#L379) reverses both conversions on submit.

Three helpers write to it: `updateField` (top-level), `updateNested` (rebates/thresholds), and `updateBracket` (one row of the bracket array).

### 2.1. GROUP 1: TAX YEAR IDENTITY

Identifies *which* tax year this configuration belongs to: its label, the period it covers, and whether calculations should default to it.

| Field | Input | Notes |
| --- | --- | --- |
| `taxYear` | text, `2025-2026` placeholder | The lookup key. `disabled` in edit mode — it is the record identifier |
| `startDate` | date | First day of the year of assessment; SARS years start **1 March** |
| `endDate` | date | Last day; **28/29 February**. Must fall after the start date |
| `isActive` | checkbox | Marks this as the year the calculator uses when the user does not pick one |

**Why the label is locked in edit mode.** `taxYear` is `unique` in the schema and is what the upsert matches on. Editing it would not rename the year — it would create a second one and leave the original untouched.

**Validation** ([calculationFunc.js:325](../client/src/utils/calculationFunc.js#L325)):

- `/^\d{4}-\d{4}$/` — "Use the format YYYY-YYYY, e.g. 2025-2026"
- both dates required
- `startDate >= endDate` → "End date must be after start date" (string comparison is safe here: `YYYY-MM-DD` sorts chronologically)

Nothing enforces that the two years in the label match the two dates, or that the period is exactly 12 months — both are left to the admin.

### 2.2. GROUP 2: INCOME TAX BRACKETS

The sliding scale SARS publishes for the year. Each row reads: *for income between `min` and `max`, charge `baseAmount` plus `rate`% of the amount above `min`.*

Rendered from `form.brackets.map(...)`, so the row count is whatever the admin builds. **Add bracket** appends an `emptyBracket()`; the per-row delete button is `disabled` when only one row is left, since at least one bracket is required.

| Field | Input | Meaning |
| --- | --- | --- |
| `min` | number | Lowest taxable income this bracket applies to (R) |
| `max` | number, placeholder "No ceiling" | Upper bound (R). **Blank → `null`** — the top bracket has no ceiling |
| `baseAmount` | number | Tax already owed on all income below this bracket's `min`, before the rate applies |
| `rate` | number, `step="0.01"` | Entered as **%**, stored as a decimal — `18` in the UI becomes `0.18` in the database |

**Rate conversion.** `toTaxYearFormShape` multiplies by 100 on load, `buildTaxYearPayload` divides by 100 on save. The form never displays a decimal rate.

**Errors are keyed by row** — `bracket-0-min`, `bracket-2-rate` — so each input shows its own message. Per row: `min` required and ≥ 0; `max` (if filled) greater than `min`; `baseAmount` required and ≥ 0; `rate` in `0–100`.

**Bracket continuity** is the rule worth understanding. From row 2 onwards each `min` must equal the previous row's `max + 1`:

```
bracket 1:  min 1        max 237 100
bracket 2:  min 237 101  max 370 500     ← 237 100 + 1
```

A gap would leave an income no bracket taxes; an overlap would leave one two brackets could tax. The error names the expected figure: *"Should follow previous bracket (237101)"*.

**Accessibility.** The bracket inputs have no visible `<label>` — the `ListGroup` above them is the column legend and is `aria-hidden`, so each input carries its own `aria-label` (`"Bracket 2 minimum income in Rand"`), and each row is a `role="group"` labelled `"Tax bracket 2"`.

### 2.3. GROUP 3: REBATES

A rebate is a **flat rand amount subtracted from tax already calculated** — not from income.

Rebates are **cumulative, not alternatives**. A 78-year-old receives all three: `17 235 + 9 444 + 3 145 = R29 824`.

| Field | Label | Applies to |
| --- | --- | --- |
| `primary` | Primary | All taxpayers |
| `secondary` | Secondary | Age 65+ |
| `tertiary` | Tertiary | Age 75+ |

Two rules worth knowing:

- **Age is assessed over the whole year of assessment.** A taxpayer who turns 65 at any point during the tax year receives the full secondary rebate for that year — it is not pro-rated by month.
- **Rebates are non-refundable.** They can reduce tax payable to zero but never below it. If the rebates exceed the calculated tax, the excess is simply lost — SARS does not pay it out. 

All three are required and must be ≥ 0.

### 2.4. GROUP 4: THRESHOLDS

The threshold is the **annual income below which no income tax is payable**. It is *not* an independently legislated number — it is derived, and it exists because of the rebates.

Since the rebate is subtracted from tax payable, tax only becomes payable once the gross tax exceeds the rebate. Solving for that income:

```
threshold = totalRebates ÷ 0.18        (0.18 = the lowest bracket's rate)
```

| Field | Band | Rebates behind it |
| --- | --- | --- |
| `under65` | Under 65 | primary |
| `age65to74` | 65 to below 75 | primary + secondary |
| `age75plus` | 75 and older | primary + secondary + tertiary |

They are **stored explicitly rather than computed** so the display and saved calculations can show the published figure, and so a record still explains itself if the derivation later changes. Nothing checks the entered value against the formula — a threshold inconsistent with the rebates will save.

All three are required and must be ≥ 0.

### 2.5. GROUP 5: FORM ACTIONS

| Control | Behaviour |
| --- | --- |
| **Create / Update tax year** (submit) | Validates, builds the payload, awaits `onSubmit`. Label and `aria-label` follow `isEditMode`; reads "Saving..." and is `disabled` while in flight |
| **Reset** | `toTaxYearFormShape(initialData)` — restores the loaded year, or clears to blank in add mode. Also drops errors and status |

`handleSubmit` ([AddTaxDataForm.js:82](../client/src/components/AddTaxDataForm.js#L82)) runs in order: `preventDefault` → validate → on failure show the error banner and **return without any request** → on success build the payload, set `status = "saving"`, `await onSubmit(payload)` → success banner, or `catch` and show `err.message`.

**Status banners** sit above the form, driven by one `status` state (`null | "saving" | "success" | "error"`):

- success → `role="status"` + `aria-live="polite"` — announced without interrupting
- error → `role="alert"` + `aria-live="assertive"` — interrupts, so a failed save is not missed
- while saving → `aria-busy` on both the form and the submit button

Every input carries `aria-invalid` and, via the `describedBy` helper, `aria-describedby` **only when its error actually exists** — otherwise the attribute would point at a missing id.

## 3. FORM OUTPUT DISPLAY

The form has no output of its own beyond its status banner. What was saved is shown by a separate read-only component on the same page.

**Page:** [TaxData.js](../client/src/pages/TaxData.js) — the `/taxes` admin route. The form is behind an **ADD/UPDATE TAX DATA** toggle (`showTaxForm`); the display sits below it and is always visible.

**File**
- [TaxDataDisplay.js](../client/src/components/TaxDataDisplay.js)

- Receives `activeConfig ?? undefined`, so until `GET /tax/config` answers it falls back to its own default — the seeded SARS 2025-2026 figures in [taxSeedData.js](../client/src/dataArrays/taxSeedData.js). A page that cannot reach the API still renders.
- Renders brackets, rebates and thresholds through `toRatePercent` and `toWholeRands`, converting the stored decimal rates back to percentages for reading.
- Refreshed immediately after each save, so a change is visible without a reload.

The saved configuration is also consumed by [Calculators.js](../client/src/pages/Calculators.js), which loads the same endpoint and passes the years to the tax calculator.

**STYLING**

- [TaxForm.css](../client/src/css/componentCss/TaxForm.css)
- [FormSetup.css](../client/src/css/componentCss/FormSetup.css)

*General styling [STYLES.md](../client/src/css/STYLES.md)*
## 4. REFERENCES

- SARS — Rates of tax for individuals: https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/
- SARS — Tax rebates and thresholds are published annually with the Budget; figures change each 1 March.
- Related docs: [CALCULATORS.md](./CALCULATORS.md)
