# TAX CONCEPTS: BRACKETS, REBATES AND THRESHOLDS

Explains the three sets of figures shown by [TaxDataDisplay.js](client/src/components/TaxDataDisplay.js) and stored on the `TaxYearConfig` model in [TaxYearSchema.js](server/models/TaxYearSchema.js).

All examples use the SARS **2025-2026** year of assessment (1 March 2025 – 28 February 2026) held in [taxSeedData.js](client/src/dataArrays/taxSeedData.js).
[p']

### 2027 TAX YEAR (1 March 2026 – 28 February 2027)

|**TAXABLE INCOME (R)**|**RATES ON TAX**|
|----|-----|
|1 – 245 100 |18% of taxable income|
|245 101 – 383 100 |44 118 + 26% of taxable income above 245 100 |
|383 101 – 530 200|	79 998 + 31% of taxable income above 383 100|
|530 201 – 695 800	|125 599 + 36% of taxable income above 530 200|
|695 801 – 887 000	|185 215 + 39% of taxable income above 695 800|
|887 001 – 1 878 600|	259 783 + 41% of taxable income above 887 000|
|1 878 601 and above|	666 339 + 45% of taxable income above 1 878 600|
### 2025-2026 BRACKETS

| **TAXABLE INCOME (R)** | **BASE AMOUNT (R)** | **MARGINAL RATE** |
|---|---|---|
| 1 – 237 100 | 0 | 18% |
| 237 101 – 370 500 | 42 678 | 26% |
| 370 501 – 512 800 | 77 362 | 31% |
| 512 801 – 673 000 | 121 475 | 36% |
| 673 001 – 857 900 | 179 147 | 39% |
| 857 901 – 1 817 000 | 251 258 | 41% |
| 1 817 001 and above | 644 489 | 45% |

### THE FORMULA

```
grossTax = baseAmount + rate × (taxableIncome − bracketFloor)
```

Where `bracketFloor` is the **top of the previous bracket**, i.e. `min − 1` in the stored data.

> **Implementation note:** the brackets in `taxSeedData` store `min` as `237101`, `370501`, and so on, but the marginal rate is charged on income above `237100` / `370500`. A calculator that subtracts `min` instead of `min - 1` will under-charge by one rand's worth of the marginal rate on every calculation. Use `bracket.min - 1`, or compare against the previous bracket's `max`.

### MARGINAL VS EFFECTIVE RATE

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

### 2025-2026 REBATES (ANNUAL)

| **REBATE** | **WHO GETS IT** | **AMOUNT (R)** | **CUMULATIVE (R)** |
|---|---|---|---|
| Primary | All individual taxpayers | 17 235 | 17 235 |
| Secondary | Age 65 to below 75 | 9 444 | 26 679 |
| Tertiary | Age 75 and older | 3 145 | 29 824 |

## HISTORY
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

### 2025-2026 THRESHOLDS

| **AGE GROUP** | **REBATES USED (R)** | **CALCULATION** | **THRESHOLD (R)** |
|---|---|---|---|
| Under 65 | 17 235 | 17 235 ÷ 0.18 | 95 750 |
| 65 to below 75 | 26 679 | 26 679 ÷ 0.18 | 148 217 |
| 75 and older | 29 824 | 29 824 ÷ 0.18 | 165 689 |
### HISTORY

|  Age|  2027	|2026	|2025 |	2024	|2023| 	 
|------|-------|------|--------|-----|----|
|Under 65|	R99 000	|R95 750	|R95 750	|R95 750	|R91 250|
|65 and older|	R153 250 |	R148 217|	R148 217 |	R148 217 |	R141 250|
|75 and older	|R171 300|	R165 689|	R165 689|	R165 689|	R157 900|

Because every threshold falls inside the first bracket, the divisor is always 18%.

This derivation is the key relationship between the three concepts: **change a rebate and the matching threshold moves with it.** When adding a new tax year via [AddTaxDataForm.js](client/src/components/AddTaxDataForm.js), the two must stay consistent — the stored thresholds should reconcile against `rebates ÷ lowest bracket rate` (allowing a rand of rounding).

### WHAT THE THRESHOLD IS ACTUALLY USED FOR

- Deciding whether a taxpayer must **submit a return** at all.
- Setting the point at which an employer starts deducting **PAYE**.
- A quick eligibility check before running a full calculation.

It is **not** a tax-free allowance carved off the top of a higher earner's income. Someone earning R400 000 does not get the first R95 750 free — they get the R17 235 rebate, which is a different (and much smaller) benefit.

---

## WORKED EXAMPLES

### EXAMPLE 1 — R450 000, UNDER 65

| **STEP** | **WORKING** | **RESULT (R)** |
|---|---|---|
| Taxable income | — | 450 000 |
| Bracket | 370 501 – 512 800 → base 77 362 @ 31% | — |
| Gross tax | 77 362 + 0.31 × (450 000 − 370 500) | 102 007 |
| Less primary rebate | 102 007 − 17 235 | **84 772** |
| Monthly PAYE | 84 772 ÷ 12 | 7 064 |

- Marginal rate: **31%**
- Effective rate: 84 772 ÷ 450 000 = **18.84%**

### EXAMPLE 2 — R160 000, AGE 68

| **STEP** | **WORKING** | **RESULT (R)** |
|---|---|---|
| Taxable income | Above the 148 217 threshold, so tax is payable | 160 000 |
| Gross tax | 0.18 × 160 000 (first bracket) | 28 800 |
| Less primary + secondary | 28 800 − 17 235 − 9 444 | **2 121** |

- Marginal rate: **18%**
- Effective rate: 2 121 ÷ 160 000 = **1.33%**

Note how close this is to zero. Just above the threshold, the rebates absorb almost all the tax — which is exactly what the threshold marks.

### EXAMPLE 3 — R140 000, AGE 68 (BELOW THRESHOLD)

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

---

## HOW THIS MAPS TO THE CODEBASE

| **CONCEPT** | **WHERE IT LIVES** |
|---|---|
| Brackets, rebates, thresholds (per year) | `TaxYearConfig` — [TaxYearSchema.js](server/models/TaxYearSchema.js) |
| Seeded 2025-2026 figures | [taxSeedData.js](client/src/dataArrays/taxSeedData.js), [taxSeedData.json](server/dataArrays/taxSeedData.json) |
| Read-only display of all three | [TaxDataDisplay.js](client/src/components/TaxDataDisplay.js) |
| Capturing a new tax year | [AddTaxDataForm.js](client/src/components/AddTaxDataForm.js) |
| User input for a calculation | [TaxCalculatorForm.js](client/src/components/TaxCalculatorForm.js) |
| Saved calculation record | [taxCalcSchema.js](server/models/taxCalcSchema.js) |

> **Open discrepancy:** `taxCalcSchema` stores a single flat `taxRate` percentage and derives `taxAmount` as `taxableIncome × (taxRate / 100)`. That is a flat-rate model, not the bracket model described here, and it has no rebate field — so a saved calculation cannot currently reproduce the figures in the worked examples above. Bringing it in line means storing the resolved `taxYear` config reference plus the taxpayer's age group, and persisting `grossTax`, `rebatesApplied` and `taxPayable` rather than a single rate.

---

## REFERENCES

- SARS — Rates of tax for individuals: https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/
- SARS — Tax rebates and thresholds are published annually with the Budget; figures change each 1 March.
