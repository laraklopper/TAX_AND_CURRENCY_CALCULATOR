# TAX CONCEPTS: BRACKETS, REBATES, THRESHOLDS, VAT AND PROVISIONAL TAX

All examples use the SARS **2025-2026** year of assessment (1 March 2025 – 28 February 2026) held in [taxSeedData.js](client/src/dataArrays/taxSeedData.js).
---

## TABLE OF CONTENTS
1. [TAX BRACKETS](#1-tax-brackets)
    - [1.1. 2027 TAX YEAR (1 March 2026 – 28 February 2027)](#11-2027-tax-year-1-march-2026--28-february-2027)
    - [1.2. 2025-2026 BRACKETS](#12-2025-2026-brackets)
    - [1.3. THE FORMULA](#13-the-formula)
    - [1.4. MARGINAL VS EFFECTIVE RATE](#14-marginal-vs-effective-rate)
2. [REBATES](#2-rebates)
    - [2.1. 2025-2026 REBATES (ANNUAL)](#21-2025-2026-rebates-annual)
    - [2.2. HISTORY](#22-history)
3. [TAX THRESHOLDS](#3-tax-thresholds)
    - [3.1. 2025-2026 THRESHOLDS](#31-2025-2026-thresholds)
    - [3.2. HISTORY](#32-history)
    - [3.3. WHAT THE THRESHOLD IS ACTUALLY USED FOR](#33-what-the-threshold-is-actually-used-for)
4. [VAT (VALUE-ADDED TAX)](#4-vat-value-added-tax)
    - [4.1. 2026-2027 VAT RATE](#41-2026-2027-vat-rate)
    - [4.2. THE FORMULAS](#42-the-formulas)
    - [4.3. RATE CATEGORIES](#43-rate-categories)
5. [PROVISIONAL TAX](#5-provisional-tax)
    - [5.1. WHO IT APPLIES TO](#51-who-it-applies-to)
    - [5.2. THE PAYMENT SCHEDULE (IRP6)](#52-the-payment-schedule-irp6)
    - [5.3. THE FORMULA](#53-the-formula)
    - [5.4. WORKED EXAMPLE — ESTIMATED TAX OF R131 272](#54-worked-example--estimated-tax-of-r131-272)
    - [5.5. WHY IT MATTERS FOR A CALCULATOR](#55-why-it-matters-for-a-calculator)
6. [WORKED EXAMPLES](#6-worked-examples)
    - [6.1. EXAMPLE 1 — R450 000, UNDER 65](#61-example-1--r450-000-under-65)
    - [6.2. EXAMPLE 2 — R160 000, AGE 68](#62-example-2--r160-000-age-68)
    - [6.3. EXAMPLE 3 — R140 000, AGE 68 (BELOW THRESHOLD)](#63-example-3--r140-000-age-68-below-threshold)
    - [6.4. EXAMPLE 4 — VAT ON A R1 000 EXCLUSIVE AMOUNT](#64-example-4--vat-on-a-r1-000-exclusive-amount)
    - [6.5. EXAMPLE 5 — REMOVING VAT FROM A R1 150 INCLUSIVE AMOUNT](#65-example-5--removing-vat-from-a-r1-150-inclusive-amount)
    - [6.6. EXAMPLE 6 — PROVISIONAL TAX, ESTIMATED ANNUAL TAX OF R131 272](#66-example-6--provisional-tax-estimated-annual-tax-of-r131-272)
7. [HOW THIS MAPS TO THE CODEBASE](#7-how-this-maps-to-the-codebase)
8. [REFERENCES](#8-references)

- *View [GLOSSARY.js](../GLOSSARY.md) for terminology*
----
## 1. TAX BRACKETS
### 1.1. 2027 TAX YEAR (1 March 2026 – 28 February 2027)

|**TAXABLE INCOME (R)**|**RATES ON TAX**|
|----|-----|
|1 – 245 100 |18% of taxable income|
|245 101 – 383 100 |44 118 + 26% of taxable income above 245 100 |
|383 101 – 530 200|	79 998 + 31% of taxable income above 383 100|
|530 201 – 695 800	|125 599 + 36% of taxable income above 530 200|
|695 801 – 887 000	|185 215 + 39% of taxable income above 695 800|
|887 001 – 1 878 600|	259 783 + 41% of taxable income above 887 000|
|1 878 601 and above|	666 339 + 45% of taxable income above 1 878 600|

### 1.2. 2025-2026 BRACKETS

| **TAXABLE INCOME (R)** | **BASE AMOUNT (R)** | **MARGINAL RATE** |
|---|---|---|
| 1 – 237 100 | 0 | 18% |
| 237 101 – 370 500 | 42 678 | 26% |
| 370 501 – 512 800 | 77 362 | 31% |
| 512 801 – 673 000 | 121 475 | 36% |
| 673 001 – 857 900 | 179 147 | 39% |
| 857 901 – 1 817 000 | 251 258 | 41% |
| 1 817 001 and above | 644 489 | 45% |

### 1.3. THE FORMULA

```
grossTax = baseAmount + rate × (taxableIncome − bracketFloor)
```

Where `bracketFloor` is the **top of the previous bracket**, i.e. `min − 1` in the stored data.


### 1.4. MARGINAL VS EFFECTIVE RATE

Two different rates come out of the same calculation, and confusing them is the most common misreading of a bracket table:

- **Marginal rate** — the rate on your *next* rand earned. This is the `rate` column.
- **Effective rate** — total tax ÷ total income. Always lower than the marginal rate, because the earlier slices were taxed more lightly.

Someone in the 31% bracket does **not** pay 31% of their income. See the worked example below: a 31% marginal rate produces an 18.84% effective rate.

---

## 2. REBATES

A rebate is a **flat rand amount subtracted from tax already calculated** — not from income. This is what separates it from a deduction:

| | **DEDUCTION** | **REBATE** |
|---|---|---|
| Subtracted from | Taxable **income** | Tax **payable** |
| Applied | Before the brackets | After the brackets |
| Value to taxpayer | Depends on marginal rate | The same rand-for-rand for everyone |
| In this project | `deductions` field on [taxCalcSchema.js](server/models/taxCalcSchema.js) | `rebates` on `TaxYearConfig` |

A R1 000 deduction saves an 18% taxpayer R180 and a 45% taxpayer R450. A R1 000 rebate saves both of them exactly R1 000.

### 2.1. 2025-2026 REBATES (ANNUAL)

| **REBATE** | **WHO GETS IT** | **AMOUNT (R)** | **CUMULATIVE (R)** |
|---|---|---|---|
| Primary | All individual taxpayers | 17 235 | 17 235 |
| Secondary | Age 65 to below 75 | 9 444 | 26 679 |
| Tertiary | Age 75 and older | 3 145 | 29 824 |

### 2.2. HISTORY
|Tax Rebate|2027   |2026   | 2025 |2024 |	    2023|
|----------|-------|-------|------  |------|---------|
|Primary   |R17 820|R17 235| R17 235| R17 235 |	R16 425|
|Secondary (65 and older)|	R9 765 |	R9 444	|R9 444	|R9 444|	R9 000|
|Tertiary (75 and older)|	R3 249	|R3 145 |R3 145	|R3 145 |R2 997|

Rebates are **cumulative, not alternatives**. A 78-year-old receives all three: `17 235 + 9 444 + 3 145 = R29 824`.

Two rules worth knowing:

- **Age is assessed over the whole year of assessment.** A taxpayer who turns 65 at any point during the tax year receives the full secondary rebate for that year — it is not pro-rated by month.
- **Rebates are non-refundable.** They can reduce tax payable to zero but never below it. If the rebates exceed the calculated tax, the excess is simply lost — SARS does not pay it out. (See example 3.)

---

## 3. TAX THRESHOLDS

The threshold is the **annual income below which no income tax is payable**. It is *not* an independently legislated number — it is derived, and it exists because of the rebates.

Since the rebate is subtracted from tax payable, tax only becomes payable once the gross tax exceeds the rebate. Solving for that income:

```
threshold = totalRebates ÷ 0.18        (0.18 = the lowest bracket's rate)
```

### 3.1. 2025-2026 THRESHOLDS

| **AGE GROUP** | **REBATES USED (R)** | **CALCULATION** | **THRESHOLD (R)** |
|---|---|---|---|
| Under 65 | 17 235 | 17 235 ÷ 0.18 | 95 750 |
| 65 to below 75 | 26 679 | 26 679 ÷ 0.18 | 148 217 |
| 75 and older | 29 824 | 29 824 ÷ 0.18 | 165 689 |

### 3.2. HISTORY

|  Age|  2027	|2026	|2025 |	2024	|2023| 	 
|------|-------|------|--------|-----|----|
|Under 65|	R99 000	|R95 750	|R95 750	|R95 750	|R91 250|
|65 and older|	R153 250 |	R148 217|	R148 217 |	R148 217 |	R141 250|
|75 and older	|R171 300|	R165 689|	R165 689|	R165 689|	R157 900|

Because every threshold falls inside the first bracket, the divisor is always 18%.

This derivation is the key relationship between the three concepts: **change a rebate and the matching threshold moves with it.** When adding a new tax year via [AddTaxDataForm.js](client/src/components/AddTaxDataForm.js), the two must stay consistent — the stored thresholds should reconcile against `rebates ÷ lowest bracket rate` (allowing a rand of rounding).

### 3.3. WHAT THE THRESHOLD IS ACTUALLY USED FOR

- Deciding whether a taxpayer must **submit a return** at all.
- Setting the point at which an employer starts deducting **PAYE**.
- A quick eligibility check before running a full calculation.

It is **not** a tax-free allowance carved off the top of a higher earner's income. Someone earning R400 000 does not get the first R95 750 free — they get the R17 235 rebate, which is a different (and much smaller) benefit.

---

## 4. VAT (VALUE-ADDED TAX)

VAT is a different animal from income tax: it's an **indirect, consumption-based tax** charged on transactions, not a tax on a person's annual earnings. It has no brackets, no rebates, and no age dependency — it's a flat percentage applied at the point of sale, collected by the vendor on SARS's behalf, and remitted via a VAT201 return.

### 4.1. 2026-2027 VAT RATE

| **RATE** | **VALUE** | **IN EFFECT SINCE** |
|---|---|---|
| Standard rate | 15% | 1 April 2018 |

A proposed increase to 15.5% (2025) and then 16% (2026) was announced and then reversed before taking effect — the rate has held at 15% throughout. Because this figure has been politically contested twice in recent years, it should be treated as **configurable data, not a hardcoded constant**, the same way `TaxYearConfig` treats brackets and rebates.

### 4.2. THE FORMULAS

```
Adding VAT (exclusive → inclusive):
  vatAmount       = exclusiveAmount × 0.15
  inclusiveAmount = exclusiveAmount × 1.15

Removing VAT (inclusive → exclusive):
  exclusiveAmount = inclusiveAmount ÷ 1.15
  vatAmount       = inclusiveAmount − exclusiveAmount
```

### 4.3. RATE CATEGORIES

Not everything is taxed at the standard rate. A VAT calculator that only handles the 15% case will misrepresent real invoices:

| **CATEGORY** | **RATE** | **EXAMPLE** | **INPUT VAT CLAIMABLE?** |
|---|---|---|---|
| Standard-rated | 15% | Most goods and services | Yes |
| Zero-rated | 0% | Certain basic foodstuffs, exports | Yes |
| Exempt | No VAT charged | Residential rental, certain financial services | No |

Zero-rated and exempt look identical on a receipt (both show R0 VAT), but they behave differently for a VAT-registered vendor: zero-rated supplies still let the vendor claim back input VAT on their own purchases; exempt supplies don't. This distinction matters if the project ever adds vendor-side (not just consumer-side) VAT reporting.

---

## 5. PROVISIONAL TAX

Provisional tax is **not a separate tax** — it's a prepayment mechanism for income tax, for anyone whose income isn't already taxed at source through PAYE. It reuses the exact same bracket/rebate/threshold logic from Sections 1–3; the only thing that differs is *when* the tax gets paid.

### 5.1. WHO IT APPLIES TO

Provisional taxpayers are typically:

- Sole proprietors and freelancers
- Company directors receiving non-PAYE income
- Landlords and investors with material rental, interest, or investment income
- Anyone earning income SARS classifies as "other than remuneration"

Salaried employees under standard PAYE deduction are generally **not** provisional taxpayers — their income tax is already being paid in instalments by their employer.

### 5.2. THE PAYMENT SCHEDULE (IRP6)

Provisional tax is declared and paid via the **IRP6** form, in up to three instalments per year of assessment:

| **PERIOD** | **DUE DATE** | **WHAT'S PAID** |
|---|---|---|
| First period | 31 August (mid-year) | 50% of the estimated total tax liability for the full year |
| Second period | End of February (year-end) | Remaining balance, based on a recalculated, more accurate estimate |
| Third period (voluntary top-up) | ~September (after year-end) | Optional top-up to avoid interest if the first two estimates fell short |

### 5.3. THE FORMULA

```
firstPayment  = estimatedAnnualTax × 0.50
secondPayment = estimatedAnnualTax − firstPayment
                (recalculated against actual/updated taxable income)
```

`estimatedAnnualTax` here is just the **normal income tax calculation from Sections 1–3** — bracket lookup, minus rebates, floored at zero — run against an *estimated* taxable income rather than a final, confirmed one.

### 5.4. WORKED EXAMPLE — ESTIMATED TAX OF R131 272

| **STEP** | **WORKING** | **RESULT (R)** |
|---|---|---|
| Estimated annual tax liability | (from bracket/rebate calculation) | 131 272 |
| First payment (due 31 Aug) | 131 272 × 0.50 | 65 636 |
| Second payment (due end Feb) | Recalculated once actual income is known, less first payment already made | *depends on final figure* |

If the taxpayer's actual taxable income for the year turns out higher or lower than estimated, the second payment is trued up against the *new* figure — it is not simply "the other half" of the original estimate.

### 5.5. WHY IT MATTERS FOR A CALCULATOR

- A provisional tax feature doesn't need new tax logic — it needs to **run the existing bracket/rebate calculation twice** (once per estimate) and split the result 50/50 for the first payment.
- Under- or over-estimating income triggers SARS penalties and interest, so an honest provisional tax tool should flag that the first payment is based on an *estimate*, not a guarantee.
- VAT and provisional tax are **independent of each other** — a VAT-registered sole trader files VAT201 returns bi-monthly *and* pays provisional tax twice a year on the same business's profit. They shouldn't be conflated in the UI even though the same user often deals with both.

---

## 6. WORKED EXAMPLES

### 6.1. EXAMPLE 1 — R450 000, UNDER 65

| **STEP** | **WORKING** | **RESULT (R)** |
|---|---|---|
| Taxable income | — | 450 000 |
| Bracket | 370 501 – 512 800 → base 77 362 @ 31% | — |
| Gross tax | 77 362 + 0.31 × (450 000 − 370 500) | 102 007 |
| Less primary rebate | 102 007 − 17 235 | **84 772** |
| Monthly PAYE | 84 772 ÷ 12 | 7 064 |

- Marginal rate: **31%**
- Effective rate: 84 772 ÷ 450 000 = **18.84%**

### 6.2. EXAMPLE 2 — R160 000, AGE 68

| **STEP** | **WORKING** | **RESULT (R)** |
|---|---|---|
| Taxable income | Above the 148 217 threshold, so tax is payable | 160 000 |
| Gross tax | 0.18 × 160 000 (first bracket) | 28 800 |
| Less primary + secondary | 28 800 − 17 235 − 9 444 | **2 121** |

- Marginal rate: **18%**
- Effective rate: 2 121 ÷ 160 000 = **1.33%**

Note how close this is to zero. Just above the threshold, the rebates absorb almost all the tax — which is exactly what the threshold marks.

### 6.3. EXAMPLE 3 — R140 000, AGE 68 (BELOW THRESHOLD)

| **STEP** | **WORKING** | **RESULT (R)** |
|---|---|---|
| Taxable income | Below the 148 217 threshold | 140 000 |
| Gross tax | 0.18 × 140 000 | 25 200 |
| Less primary + secondary | 25 200 − 26 679 = −1 479 | **0** |

The rebates exceed the tax by R1 479. Tax payable is floored at **R0** — the surplus is not refunded. Any calculator must clamp the result:

```js
const taxPayable = Math.max(0, grossTax - totalRebates)
```

Without that clamp, a below-threshold pensioner shows a negative tax payable.

### 6.4. EXAMPLE 4 — VAT ON A R1 000 EXCLUSIVE AMOUNT

| **STEP** | **WORKING** | **RESULT (R)** |
|---|---|---|
| Amount excluding VAT | — | 1 000.00 |
| VAT | 1 000 × 0.15 | 150.00 |
| Amount including VAT | 1 000 × 1.15 | **1 150.00** |

### 6.5. EXAMPLE 5 — REMOVING VAT FROM A R1 150 INCLUSIVE AMOUNT

| **STEP** | **WORKING** | **RESULT (R)** |
|---|---|---|
| Amount including VAT | — | 1 150.00 |
| Amount excluding VAT | 1 150 ÷ 1.15 | 1 000.00 |
| VAT portion | 1 150 − 1 000 | **150.00** |

### 6.6. EXAMPLE 6 — PROVISIONAL TAX, ESTIMATED ANNUAL TAX OF R131 272

| **STEP** | **WORKING** | **RESULT (R)** |
|---|---|---|
| Estimated annual tax (from bracket/rebate calc) | — | 131 272 |
| First payment, due 31 August | 131 272 × 0.50 | **65 636** |
| Second payment, due end February | Recalculated against actual/updated income for the year, less R65 636 already paid | *trued up at year-end* |

---

## 7. HOW THIS MAPS TO THE CODEBASE

| **CONCEPT** | **WHERE IT LIVES** |
|---|---|
| Brackets, rebates, thresholds (per year) | `TaxYearConfig` — [TaxYearSchema.js](server/models/TaxYearSchema.js) |
| Seeded 2025-2026 figures | [taxSeedData.js](client/src/dataArrays/taxSeedData.js), [taxSeedData.json](server/dataArrays/taxSeedData.json) |
| Read-only display of all three | [TaxDataDisplay.js](client/src/components/TaxDataDisplay.js) |
| Capturing a new tax year | [AddTaxDataForm.js](client/src/components/AddTaxDataForm.js) |
| User input for a calculation | [TaxCalculatorForm.js](client/src/components/TaxCalculatorForm.js) |
| Saved calculation record | [taxCalcSchema.js](server/models/taxCalcSchema.js) |
| VAT rate + add/remove logic | [vatController.js](server/controllers/vatController.js) — `calculateVat` |
| VAT user input | [VatCalculatorForm.jsx](client/src/components/VatCalculatorForm.jsx) |
| Saved VAT calculation record | `saveVat` handler, wired into [Calculators.js](client/src/components/Calculators.js) |
| Provisional tax | *Not yet built* — would reuse the bracket/rebate logic above against an estimated income, split 50/50 for the first IRP6 payment |


## 8. REFERENCES

- SARS — Rates of tax for individuals: https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/
- SARS — Tax rebates and thresholds are published annually with the Budget; figures change each 1 March.
- SARS — Value-Added Tax: https://www.sars.gov.za/types-of-tax/value-added-tax/
- SARS — VAT registration thresholds (R2.3m compulsory / R120k voluntary) effective 1 April 2026, per the 2026 Budget.
- SARS — Provisional tax and the IRP6 form: instalments due 31 August (period 1) and end of February (period 2), with an optional voluntary top-up (period 3) around September.