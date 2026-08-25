# CALCULATORS

## TABLE OF CONTENTS
1. [APPLICATION CALCULATORS](#1-application-calculators)
2. [TAX CALCULATOR FORM](#2-tax-calculator-form)
    - [2.1. INPUT FIELDS](#21-input-fields)
    - [2.2. VALIDATION](#22-validation)
    - [2.3. HOW THE TAX IS CALCULATED](#23-how-the-tax-is-calculated)
    - [2.4. RESULTS DISPLAYED](#24-results-displayed)
    - [2.5. SAVING A TAX CALCULATION](#25-saving-a-tax-calculation)
3. [INTEREST CALCULATOR FORM](#3-interest-calculator-form)
    - [3.1. INPUT FIELDS](#31-input-fields)
    - [3.2. VALIDATION](#32-validation)
    - [3.3. HOW THE INTEREST IS CALCULATED](#33-how-the-interest-is-calculated)
    - [3.4. RESULTS DISPLAYED](#34-results-displayed)
    - [3.5. SAVING AN INTEREST CALCULATION](#35-saving-an-interest-calculation)
4. [GENERAL CALCULATOR](#4-general-calculator)
    - [4.1. BUTTON GRID](#41-button-grid)
    - [4.2. KEYBOARD SUPPORT](#42-keyboard-support)
    - [4.3. HOW AN EXPRESSION IS WORKED OUT](#43-how-an-expression-is-worked-out)
5. [CURRENCY CONVERTER](#5-currency-converter)
    - [5.1. INPUT FIELDS](#51-input-fields)
    - [5.2. HOW A CONVERSION IS MADE](#52-how-a-conversion-is-made)
    - [5.3. RESULTS DISPLAYED](#53-results-displayed)
    - [5.4. AVAILABLE CURRENCIES LIST](#54-available-currencies-list)
    - [5.5. SAVING A CONVERSION](#55-saving-a-conversion)
6. [SAVED CALCULATIONS](#6-saved-calculations)
7. [EXPORT FORM](#7-export-form)
8. [REFERENCES](#8-references)

---

## 1. APPLICATION CALCULATORS

The application provides users with four calculators:
- TaxCalculator
- InterestCalculator
- General/basic calculator
- CurrencyConverter

All Tax and Interest calculations are calculated in terms of South African Tax and Interest.

| Calculator | Component | Page | API endpoint | Saves to history |
|----|----|----|----|----|
| Income tax | [TaxCalculatorForm.js](../client/src/components/TaxCalculatorForm.js) | [Calculators.js](../client/src/pages/Calculators.js) | `POST /api/tax/calculate` | Yes |
| Interest | [InterestCalculatorForm.js](../client/src/components/InterestCalculatorForm.js) | [Calculators.js](../client/src/pages/Calculators.js) | `POST /api/interest/calculate` | Yes |
| General/basic | [NumberCalculator.js](../client/src/components/NumberCalculator.js) | [Calculators.js](../client/src/pages/Calculators.js) | None (worked out in the browser) | No |
| Currency converter | [CurrencyConvertForm.js](../client/src/components/CurrencyConvertForm.js) | [CurrencyConverter.js](../client/src/pages/CurrencyConverter.js) | `GET /api/convert` | Yes |

The three financial calculators are opened one at a time from the toggle
buttons on the calculators page, so only one form is ever on screen; the
currency converter has a page of its own.

**Where the shared logic lives**

The forms hold the inputs and render the results, but the shape of a form, the
checks on it and the request body it builds are shared functions rather than
component code:

| Concern | Module |
|----|----|
| Blank form shapes, validation, request payloads, local interest maths | [calculationFunc.js](../client/src/utils/calculationFunc.js) |
| Currency options, converted amounts, quoted rates | [currencyFunc.js](../client/src/utils/currencyFunc.js) |
| Dates, names, rands, percentages shown on saved records | [formatCalculations.js](../client/src/utils/formatCalculations.js) |
| Loading, selecting, deleting a saved calculation | [useCalculationsList.js](../client/src/utils/useCalculationsList.js) |

Every calculator endpoint is behind the JWT, so all four calculators are only
reachable once the user is logged in.

**The backend is the source of truth.** The tax and interest routes recalculate
from the submitted inputs before storing anything, and a saved conversion has
its rate fetched again server-side, so a saved record can never disagree with
the maths or with the rate the provider quoted.

---

## 2. TAX CALCULATOR FORM [TaxCalculatorForm.js](../client/src/components/TaxCalculatorForm.js)

SARS income tax calculator and renders the result plus a bracket-by-bracket breakdown.

The tax years offered in the dropdown are not hardcoded: the page loads them
from `GET /api/tax/config` on mount and passes them in as the `taxYears` prop.
The list can therefore arrive after the form has mounted, so a selected year
that is not in the list that arrives falls back to the newest year offered. The
seeded year is used while the API is unreachable, leaving the calculator usable.

### 2.1. INPUT FIELDS

|Field| Data Type| Input Type| Required |
|----|----|----|-----------|
|Income Period (monthly/annual)| Text | Button | Yes |
|(monthly/annual) Income (R)| Number | Input | Yes |
|Age| Number | Input| Yes|
|Tax Year| Text | Select | Yes |
|Medical Aid Dependents| Number | Input | No |

The INCOME PERIOD toggle only changes what the income figure means: the label
and placeholder follow the selection, and a monthly income is multiplied by 12
before it is sent, because the brackets are annual figures.

Medical aid dependants default to `0` and are recorded with the calculation but
**no credit is applied** — the tax year data holds no medical scheme fees credit
figures. The form says so beneath the field.

### 2.2. VALIDATION

Checked by `validateTaxForm` before anything is sent, and each message is shown
under the field it belongs to. The alert above the form reads "Please fix the
highlighted fields."

| Field | Rule | Message |
|----|----|----|
| Income | Greater than 0 | Enter an income amount greater than 0 |
| Age | Between 16 and 120 | Enter a valid age |
| Tax year | Must be selected | Select a tax year |
| Dependants | Not negative, not blank | Cannot be negative |

The route validates the same figures again ([taxRoutes.js](../server/routes/taxRoutes.js)),
and additionally caps the income at R1 000 000 000 so a nonsense value cannot
overflow the maths. A rejected request answers 400 with its own message, which
the form shows in place of a generic failure.

### 2.3. HOW THE TAX IS CALCULATED

The form builds its request body with `buildTaxPayload` and posts it to
`POST /api/tax/calculate`:

```js
{
  annualIncome,   // monthly income × 12 when the monthly period is selected
  age,
  taxYear,
  dependants
}
```

The maths itself lives in [taxCalculator.js](../server/utils/taxCalculator.js)
and follows [TAX_CONCEPTS.md](TAX_CONCEPTS.md):

1. **BRACKETS** produce the gross tax — the bracket's base amount plus its rate
   charged on the income above the top of the previous bracket.
2. **REBATES** reduce it. They are cumulative by age (primary for everyone,
   plus secondary from 65, plus tertiary from 75) and non-refundable, so they
   can take the tax to zero but never below it.
3. **THRESHOLD** is the income at which the rebates wipe the tax out entirely,
   returned for the taxpayer's age band.

The tax year's brackets, rebates and thresholds are read from the database
first, so an admin-captured year is used when present, and fall back to the
seeded 2025-2026 figures on a fresh database. An unknown tax year is a 400,
not a silent default.

### 2.4. RESULTS DISPLAYED

The result is only rendered once a calculation has come back, and is cleared
again as soon as any field is edited, so the figures on screen always belong to
the inputs above them.

| Shown as | Field | Note |
|----|----|----|
| Gross tax | `grossTax` | What the brackets produced |
| Rebate applied | `rebate` | Cumulative, by age |
| Net tax payable | `netTax` | Highlighted card |
| Effective rate | `effectiveRate` | Total tax as a percentage of total income |
| Marginal rate | `marginalRate` | The rate charged on the next rand earned |

Beneath the summary, `bracketBreakdown` is rendered as a table of **Bracket
(R)**, **Rate**, **Amount in bracket** and **Tax for bracket**, so the user can
see where the tax came from. The top bracket has no ceiling, so its range is
shown as `min – +`. Rates arrive as decimal fractions (0.18) and are shown as
percentages (18.00%).

A disclaimer closes the panel: the calculator is for estimation only and does
not constitute tax advice.

### 2.5. SAVING A TAX CALCULATION

"Save to history" is only rendered for a logged-in user, and posts the same
payload to `POST /api/tax/save`. The route recalculates from the inputs and
reads the `fullName` off the user record rather than the request body, so a
calculation can only ever be filed under the account that saved it.

The button reports its own outcome: it turns green and reads "Saved to history"
once the record is stored, red with "Could not save. Try again." if the request
was rejected, and is disabled while saving and after a successful save so the
same calculation cannot be written twice. A save also refreshes the tax
calculations list, so an open panel does not sit there missing the record just
saved.

`deductions` is accepted by the route (0 up to the annual income) but is not an
input on this form, so a saved calculation records 0 unless the record was
created elsewhere.

---

## 3. INTEREST CALCULATOR FORM [InterestCalculatorForm.js](../client/src/components/InterestCalculatorForm.js)

Calculator used to calculate compound or simple interest. Simple interest is worked out on the principal, or original, amount of a loan.​
Compound interest is calculated on the principal (original) amount and also on the added interest of previous periods, and so can be seen as “interest on interest.”​

The TIME PERIOD toggle lets the user work in either ANNUAL periods (time entered in years, one breakdown row per year) or MONTHLY periods (time entered in months, one breakdown row per month).

The interest rate is always entered as an annual nominal rate so both options can be compared against the same quoted rate.

Switching the toggle clears the time period rather than reinterpreting it — 10
years is not the same investment as 10 months — and the field's label,
placeholder and maximum follow the unit that is selected.

### 3.1. INPUT FIELDS

|Field| Data Type| Input Type| Required |
|----|----|----|-----------|
|Interest Type| Text | Button | Yes|
|Principal Amount (R)| Number |Input|Yes|
| Select TIME PERIOD(Button)|Text | Button | Yes|
|Annual Interest Rate %| Number |Input|Yes|
|Time Period (set in years or months)| Number |Input|Yes|
|Compounding frequency(*compound interest only*)|Text| Select |No|
|Recurring Monthly Contribution(R)|Number|Input|No|
|Full name (first and last)|Text|Read-only input (hidden)|Yes, to save|

**Interest type** — `simple` or `compound`; the form opens on compound.

**Compounding frequency** is only rendered for compound interest, because
simple interest does not compound. The options are ANNUALLY, SEMI-ANNUALLY,
QUARTERLY, MONTHLY and DAILY (1, 2, 4, 12 and 365 times per year).

**Recurring monthly contribution** is optional and defaults to 0. It is paid in
at the end of each month, at the finest granularity the calculator simulates.

**Full name** is not typed. The two fields are hidden, read-only and filled from
the logged-in user fetched by `GET /users/me`, so a calculation cannot be edited
into somebody else's name before it is saved. They are not cleared by Reset,
because there is nothing of the user's to clear.

### 3.2. VALIDATION

Checked by `validateInterestForm`, with the time period judged against the unit
the toggle is on, so the same figure is read as years or as months:

| Field | Rule | Message |
|----|----|----|
| Principal | Greater than 0 | Enter an amount greater than 0 |
| Annual rate | Above 0, up to 100 | Enter a rate between 0 and 100 |
| Time period | Whole number, 1–100 years or 1–1200 months | Enter a whole number of *years/months* between 1 and *max* |
| Monthly contribution | Not negative | Cannot be negative |

[interestRoutes.js](../server/routes/interestRoutes.js) validates the same
figures again, plus the interest type, the period unit and — for compound
interest only — the compounding frequency. The duration cap is what stops a
single request asking for an unbounded breakdown.

### 3.3. HOW THE INTEREST IS CALCULATED

`buildInterestPayload` assembles the request body for
`POST /api/interest/calculate`:

```js
{
  type,                   // 'simple' | 'compound'
  principal,
  rate,                   // annual nominal rate, as a percentage
  duration,               // measured in whatever periodUnit says
  periodUnit,             // 'years' | 'months'
  compoundingFrequency,   // null for simple interest
  monthlyContribution
}
```

The maths lives in [interestCalculator.js](../server/utils/interestCalculator.js).
The balance is simulated **one month at a time** — the finest granularity the
form allows for contributions — and those months are then grouped into the
reporting period the user selected:

- **Compound interest** grows by the monthly equivalent of the selected
  frequency, `(1 + r/n)^(n/12)`. Over twelve months this multiplies out to
  exactly `(1 + r/n)^n`, so the annual total still matches the standard
  compound interest formula while giving a usable month-by-month breakdown.
- **Simple interest** is only ever charged on capital paid in — the principal
  plus any contributions — never on interest already earned.
- A row is closed off on every reporting boundary and always on the final
  month, so a part-year is reported rather than silently dropped.

The client carries the same maths as `calculateInterestLocally`, used only when
no `onCalculate` handler is supplied (preview/demo). It mirrors the server
function exactly; the backend remains the source of truth for anything saved.

See [INTEREST.md](INTEREST.md) for the simple and compound interest formulas
themselves.

### 3.4. RESULTS DISPLAYED

| Shown as | Field | Note |
|----|----|----|
| Total interest earned | `totalInterest` | |
| Total contributions | `totalContributions` | Only rendered when contributions were added |
| Final amount | `finalAmount` | Principal + contributions + interest |

The breakdown table below the summary is one row per reporting period —
**Year**/**Month**, **Contributions**, **Interest earned**, **Balance**. Its
first column is headed from `result.periodUnit` rather than from the form, so
the heading always describes the figures currently on screen.

### 3.5. SAVING AN INTEREST CALCULATION

"Save to history" posts to `POST /api/interest/save` with the inputs and the
user's name attached. Only the inputs are sent: the route recalculates the
totals before storing them.

The interest schema requires both halves of `fullName`, so the button is
disabled with an explanation when the name could not be read from the profile,
rather than letting the request be rejected by the database. Server-side the
**account's own name wins**; a submitted name is only used when the account has
no usable one, and a mismatch is logged rather than rejected.

The schema stores the compounding frequency as a *number* of times per year, so
the frequency name is mapped to its count on the way in (and simple interest
falls back to 1, reported as NOT APPLICABLE in the list).

Save status is reported on the button itself in the same way as the tax
calculator, and a successful save refreshes the interest calculations list.

---

## 4. GENERAL CALCULATOR [NumberCalculator.js](../client/src/components/NumberCalculator.js)

The buttons for the calculator are imported from [ButtonGrid.js](../client/src/components/ButtonGrid.js)

The input for the calculation is entered in a readonly input field which is filled by clicking on the buttons.

Nothing is sent anywhere: the expression is worked out in the browser, and
nothing this calculator produces can be saved or exported.

### 4.1. BUTTON GRID

`ButtonGrid` renders the buttons and takes the four handlers it needs from
`NumberCalculator` — `handleClick`, `handleEquals`, `handleClear` and
`handleBackspace` — so the button layout holds no calculator logic of its own.

| Row | Buttons |
|----|----|
| 1 | 7, 8, 9, ÷ |
| 2 | 4, 5, 6, × |
| 3 | 1, 2, 3, − |
| 4 | 0, ., =, + |
| 5 | C (clear), ⌫ (backspace) |

Each button appends its own character to the expression and announces itself,
so the operator buttons show an icon while still being announced by name
(`aria-label='Divide'`, and so on).

### 4.2. KEYBOARD SUPPORT

A window key listener mirrors the buttons, and is removed again when the
component unmounts:

| Key | Action |
|----|----|
| `0`–`9`, `.`, `+`, `-`, `*`, `/` | Appended to the expression |
| `Enter` or `=` | Work out the expression |
| `Escape` or `c` | Clear the expression and the result |
| `Backspace` | Remove the last character |

The keys accepted are decided by `isCalculatorKey`. The listener stands down
while another input or textarea has focus, so typing into a form elsewhere on
the page cannot type into the calculator.

### 4.3. HOW AN EXPRESSION IS WORKED OUT

`evaluateExpression` hands the expression to **math.js**. The expression comes
from the user, so an unfinished one (`5 +`) is expected rather than exceptional:
the failure comes back as `{ ok: false }` rather than being thrown, and the
display shows `Error`.

The result sits in a `aria-live='polite'` region, and every action — a button
press, a clear, a result, an invalid expression — is announced through an
assertive live region, so the calculator is usable without seeing it.

---

## 5. CURRENCY CONVERTER [CurrencyConvertForm.js](../client/src/components/CurrencyConvertForm.js)

The currency converter uses Frankfurter API for currency conversions. The codes, names and symbols come from `currencyOptions`, which the page loaded from GET /api/currencies, so the table lists exactly what Frankfurter supports.

Displays every currency the converter can work with in table format.

`FALLBACK_CURRENCIES` — built from the local `currencyCountries` data — is
offered until `GET /api/currencies` answers, and kept if it never does, so an
unreachable API leaves the converter working off a curated list rather than an
empty dropdown.

### 5.1. INPUT FIELDS

|Field| Data Type | Input Type | Required |
|------|----|----|----|
|Amount| Number | Input | YES |
|Base currency(convert from)| Text/String |Select | YES |
|Target currency(convert to) | Text/String |Select | YES |

Both dropdowns are built from `currencyOptions` and are labelled
`CODE - NAME` (e.g. `ZAR - South African Rand`) by `currencyOptionLabel`; a code
the provider reports without a name is still offered, listed by its code alone.
The amount accepts 0.01 upwards.

### 5.2. HOW A CONVERSION IS MADE

Any edit clears the previous result, the error and the save status, so what is
on screen always belongs to the inputs above it. The page checks all three
fields are filled ("Please fill in all fields.") and then calls
`GET /api/convert?amount=&from=&to=`.

Server-side ([apiRoutes.js](../server/routes/apiRoutes.js)) the codes are
trimmed and uppercased, the amount is checked as a positive number, and both
codes are validated against the list Frankfurter reports it supports — the same
list `GET /api/currencies` serves — so the codes the browser can pick and the
codes the server accepts cannot drift apart. Converting a currency into itself
short-circuits to a rate of 1 without calling the provider.

`GET /api/convert` only converts. Nothing is written to the database until the
user presses SAVE CALCULATION.

### 5.3. RESULTS DISPLAYED

The result block is a polite live region and shows two lines:

- the conversion itself — `100 ZAR = 5.24 USD` — with the converted amount
  fixed to 2 decimals, the way money is written.
- the rate it was priced at — `1 ZAR = 0.0524 USD (rate of 2026-08-24)` — kept
  to 4 decimals, because rounding a rate to currency precision would show a
  weak pair as 0.00. The date is the day Frankfurter published the rate, so the
  figure on screen is dated.

A failure is shown in the same block as an assertive alert, using the API's own
message where there is one.

### 5.4. AVAILABLE CURRENCIES LIST [CurrencyList.js](../client/src/components/CurrencyList.js)

Toggled from "Show available currencies" below the form, this table lists every
currency the converter can work with: **CODE**, **CURRENCY**, **SYMBOL** and
**COUNTRY/S**.

The codes, names and symbols come from the provider list. The countries a
currency is used in are *not* something the API reports, so they are looked up
in the local [currencyCountries.js](../client/src/dataArrays/currencyCountries.js)
data and left as a dash for any code that data does not cover.

### 5.5. SAVING A CONVERSION

SAVE CALCULATION is only rendered once a conversion is on screen and posts to
`POST /api/save`. The figures come from `result` rather than from `form`, so
what is saved is what the user is looking at, not whatever has since been typed
into the inputs.

Only the inputs — `amount`, `from`, `to` — are sent. **The route fetches its own
rate**, so a saved record can never disagree with the rate the provider quoted
and a tampered request cannot write a false rate. Frankfurter publishes one rate
per pair per day, so the rate a save fetches is the rate the conversion was
quoted at.

The button colours its own outcome (green SAVED TO HISTORY, red on failure) and
is disabled while saving and after a successful save, so the same conversion
cannot be written to the history twice. A save refreshes the conversions list.

---

## 6. SAVED CALCULATIONS

Each calculator has a list of the logged-in user's saved records, toggled open
from the page it belongs to:

| List | Component | History endpoint |
|----|----|----|
| Tax calculations | [TaxCalculations.js](../client/src/components/TaxCalculations.js) | `GET /api/tax/history` |
| Interest calculations | [InterestCalculations.js](../client/src/components/InterestCalculations.js) | `GET /api/interest/history` |
| Currency conversions | [CurrencyCalculations.js](../client/src/components/CurrencyCalculations.js) | `GET /api/history` |

All three do the same things — load the history once the user is logged in,
remember which row's details panel is open, confirm a delete, report how it went
and close the panel on success — so that behaviour lives in
[useCalculationsList.js](../client/src/utils/useCalculationsList.js) and each
component only renders its own columns and details. Dates, names, rands and
percentages are formatted by [formatCalculations.js](../client/src/utils/formatCalculations.js),
so the three lists cannot start disagreeing about how a date or an amount is
written.

**Table columns**

| List | Columns |
|----|----|
| Tax | DATE SAVED, TAX YEAR, GROSS INCOME, TAXABLE INCOME, TAX PAYABLE, EFFECTIVE RATE |
| Interest | DATE SAVED, TYPE, PRINCIPAL, RATE, TERM, INTEREST EARNED, FINAL AMOUNT |
| Currency | DATE SAVED, AMOUNT, FROM, TO, RATE, CONVERTED AMOUNT |

Selecting a row opens a details panel showing the full stored record, with a
DELETE CALCULATION button in its footer. A delete is confirmed in the browser
first, and its outcome is reported above the table; the API's own message is
what gets shown when it fails.

Each history endpoint returns only the **newest 100** records and reports the
`total` alongside them, so a list can say when it is showing a truncated view
("SHOWING THE NEWEST 100 OF 143 SAVED TAX CALCULATIONS") rather than looking
complete. Every history query is scoped by the user id on the JWT, and a delete
matches the id and the user in a single query, so a record belonging to someone
else behaves exactly like one that does not exist.

The figures are shown exactly as they were stored, so an old record still
reproduces what the calculator showed even after the tax year's brackets or the
exchange rate change. `taxableIncome`, `netIncome`, `monthlyTax`,
`durationInYears`, `totalCapital` and `convertedAmount` are virtuals on their
schemas and arrive on the record; the helpers in
[calculationFunc.js](../client/src/utils/calculationFunc.js) and
[currencyFunc.js](../client/src/utils/currencyFunc.js) recompute them only as a
fallback.

---

## 7. EXPORT FORM [ExportForm.js](../client/src/components/ExportForm.js)

The TaxCalculatorForm, InterestCalculatorForm, and currencyConverter allows users to save calculations and the application includes a form to export calculations. One form serves all three: the `type` prop decides which export endpoint the request goes to and what the file is called, so the three lists cannot drift
apart on how a download is asked for or reported.

The export form is shown under each saved-calculation list
(CurrencyCalculations.js, TaxCalculations.js, InterestCalculations.js).

The response is a FILE, not JSON, so it is read as a blob and handed to a
temporary anchor to trigger the browser's download. Only a failure comes back as
JSON, and the API's own message is what gets shown beside the button. The
filename is rebuilt here rather than read from the response's
Content-Disposition header: the API is a different origin, so that header is not
readable from the browser unless the server explicitly exposes it.

| `type` | Endpoint | Downloaded as |
|----|----|----|
| `tax` | `GET /export/taxHistory?format=` | `tax-calculations-YYYY-MM-DD.csv/.xlsx` |
| `interest` | `GET /export/interestHistory?format=` | `interest-calculations-YYYY-MM-DD.csv/.xlsx` |
| `currency` | `GET /export/currencyHistory?format=` | `currency-conversions-YYYY-MM-DD.csv/.xlsx` |

An unrecognised `type` is a mistake in the component that rendered the form,
not something the user can act on, so it is reported once ("THIS DATA CANNOT BE
EXPORTED") rather than being sent to the API as a bad URL.

The JWT is attached because the export is scoped to the logged-in user: the API
reads the user off the token, so a request without one has nothing to export.

### 7.1. INPUT FIELDS

The only input field is a select input field which allows the user to select the excel document format either xlsx or csv

|Field| Data Type | Input Type | Required |
|----|----|----|----|
|Choose export format (csv / xlsx)| Text/String | Select | Yes |

Submitting without choosing one is answered in the form rather than by a
request ("SELECT A FILE FORMAT TO EXPORT TO"). A failure is announced as an
assertive alert, because the user pressed a button and needs to know it did not
work; a completed download is a polite status naming the file that was saved.

---

## 8. REFERENCES
- https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/
- https://www.jse.co.za/learn-how-to-invest/what-interest
- https://frankfurter.dev/
- https://mathjs.org/docs/expressions/parsing.html
