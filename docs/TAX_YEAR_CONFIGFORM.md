# TAX YEAR CONFIG FORM

- [TaxYearConfigForm]('../client/src/components/AddTaxDataForm.js')

Form component used to both create and edit TaxYearConfig documents, matching the tax yearSchema[taxYearSchema.js](../server/models/TaxYearSchema.js).

•	Accepts an optional initialData prop — present it prefilled to edit an existing tax year (taxYear field locked), or omit it to create a new one
•	Dynamic bracket rows: add/remove brackets, entering rate as a percentage in the UI and converting to a decimal on submit
•	Client-side validation: YYYY-YYYY tax year format, date ordering, bracket continuity (each bracket's min follows the previous bracket's max), and non-negative rebate/threshold values
•	Calls an onSubmit(payload) prop with a schema-shaped object; 
◦	the parent component wires this to POST /api/tax/config or PUT /api/tax/config/:taxYear
•	Restricted to admin users only — gated behind an admin-only PrivateRoute, since incorrect tax data would affect every user's calculations


## TABLE OF CONTENTS
1. [API REQUESTS](#1-api-requests)
2. [INPUT GROUPS](#2-input-groups)
    - [2.1. GROUP 1: TAX YEAR IDENTITY]
    - [2.2. GROUP 2: INCOME TAX BRACKETS]
    - [2.3. GROUP 3: REBATES]
    - [2.4. GROUP 4: THRESHOLDS]
3. [FORM OUTPUT DISPLAY](#3-form-output-display)
4. [REFERENCES](#)
## 1. API REQUEST(s):


## 2. INPUT GROUPS

### 2.1. GROUP 1: TAX YEAR IDENTITY

<!-- Explain the tax year -->
### 2.2. GROUP 2: INCOME TAX BRACKETS

<!-- explain different bracket input fields -->
### 2.3. GROUP 3: REBATES

A rebate is a **flat rand amount subtracted from tax already calculated** — not from income.

Rebates are **cumulative, not alternatives**. A 78-year-old receives all three: `17 235 + 9 444 + 3 145 = R29 824`.

Two rules worth knowing:

- **Age is assessed over the whole year of assessment.** A taxpayer who turns 65 at any point during the tax year receives the full secondary rebate for that year — it is not pro-rated by month.
- **Rebates are non-refundable.** They can reduce tax payable to zero but never below it. If the rebates exceed the calculated tax, the excess is simply lost — SARS does not pay it out. 

### 2.4. GROUP 4: THRESHOLDS

The threshold is the **annual income below which no income tax is payable**. It is *not* an independently legislated number — it is derived, and it exists because of the rebates.

Since the rebate is subtracted from tax payable, tax only becomes payable once the gross tax exceeds the rebate. Solving for that income:

```
threshold = totalRebates ÷ 0.18        (0.18 = the lowest bracket's rate)
```
## 3. FORM OUTPUT DISPLAY
<!-- Where is the form output displayed -->
<!-- File -->
- []

**STYLING**

- [TaxForm.css](../client/src/css/componentCss/TaxForm.css)
- [FormSetup.css](../client/src/css/componentCss/FormSetup.css)

*General styling [STY]*
## 4. REFERENCES

- SARS — Rates of tax for individuals: https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/
- SARS — Tax rebates and thresholds are published annually with the Budget; figures change each 1 March.