# SCHEMAS

Reference for every Mongoose schema in [server/models/](../server/models/). Nested
objects are listed with dot notation (e.g. `fullName.firstName`).

## TABLE OF CONTENTS
1. [USER](#1-user)
2. [TAX CALCULATION](#2-tax-calculation)
3. [PROVISIONAL TAX CALCULATION](#3-provisional-tax-calculation)
4. [INTEREST CALCULATION](#4-interest-calculation)
5. [CURRENCY CONVERSION](#5-currency-conversion)
6. [TAX YEAR CONFIG](#6-tax-year-config)
7. [SHARED SCHEMA OPTIONS](#7-shared-schema-options)

## 1. USER

Model `user` — [server/models/userSchema.js](../server/models/userSchema.js)

### FIELDS

| Field | Type | Required | Default | Constraints | Notes |
|---|---|---|---|---|---|
| `fullName.firstName` | String | Yes | — | trim, 2–50 chars | |
| `fullName.lastName` | String | Yes | — | trim, 2–50 chars | |
| `email` | String | Yes | — | unique, trim, lowercase, regex `^[^\s@]+@[^\s@]+\.[^\s@]+$` | Login identifier; any country allowed |
| `dateOfBirth` | Date | Yes | — | Must be a valid date in the past | All users must be 18 or older |
| `address.line1` | String | Yes | — | trim, 2–100 chars | Street |
| `address.line2` | String | No | — | trim, 2–100 chars | Complex/building/floor |
| `address.city` | String | Yes | — | trim, 2–50 chars | City or town |
| `address.province` | String | No | — | trim, 2–50 chars, enum: `provinces` | See [server/dataArrays/locations.js](../server/dataArrays/locations.js) |
| `password` | String | Yes | — | 8–1024 chars, `select: false` | Hashed in registration middleware (not used during dev) |
| `admin` | Boolean | No | `false` | — | `true` = admin privileges; admins must be 21 or older |
| `resetPasswordToken` | String | No | — | `select: false` | Password reset |
| `resetPasswordExpiry` | Date | No | — | `select: false` | Token expiry time |

### VIRTUALS

| Virtual | Type | Returns |
|---|---|---|
| `userAddress` | String | `line1`, `line2`, `city`, `province` joined with `, `, empty parts omitted |

### ENUM — `address.province`

`Eastern Cape`, `Free State`, `Gauteng`, `KwaZulu-Natal`, `Limpopo`,
`Mpumalanga`, `North West`, `Northern Cape`, `Western Cape`

## 2. TAX CALCULATION

Model `tax` — [server/models/taxCalcSchema.js](../server/models/taxCalcSchema.js)

A saved income tax calculation using the bracket model described in
[docs/TAX_CONCEPTS.md](TAX_CONCEPTS.md).

### FIELDS

| Field | Type | Required | Default | Constraints | Notes |
|---|---|---|---|---|---|
| `user` | ObjectId | Yes | — | `ref: 'user'`, indexed | Reference, not `fullName`, so history cannot return another user's calculations when two users share a name |
| `fullName.firstName` | String | Yes | — | trim, 2–50 chars | Logged in user |
| `fullName.lastName` | String | Yes | — | trim, 2–50 chars | Logged in user |
| `income.grossIncome` | Number | Yes | — | min 0 | Gross annual income |
| `income.taxYear` | String | Yes | — | trim, match `^\d{4}-\d{4}$` | e.g. `"2025-2026"`; a SARS year of assessment straddles two calendar years |
| `deductions` | Number | No | `0` | min 0 | Applied to gross income before tax |
| `age` | Number | Yes | — | 16–120 | Decides how many rebates apply |
| `ageGroup` | String | Yes | — | enum: `under65`, `age65to74`, `age75plus` | Resolved at calculation time so the record still explains itself if rebate rules change |
| `dependants` | Number | No | `0` | min 0 | Reference only — no medical scheme fees tax credit is applied |
| `grossTax` | Number | Yes | — | min 0 | Tax the brackets produced, before rebate |
| `rebate` | Number | Yes | — | min 0 | Cumulative age-based rebate |
| `netTax` | Number | Yes | — | min 0 | Tax payable; floored at zero since rebates are non-refundable |
| `effectiveRate` | Number | Yes | — | 0–100 | Total tax as a percentage of total income |
| `marginalRate` | Number | Yes | — | 0–100 | Rate charged on the next rand earned |

`grossTax`, `rebate`, `netTax`, `effectiveRate` and `marginalRate` are worked out
by [server/utils/taxCalculator.js](../server/utils/taxCalculator.js) and stored so the record
reproduces exactly what the user saw.

### VIRTUALS

| Virtual | Type | Returns |
|---|---|---|
| `taxableIncome` | Number | `income.grossIncome - deductions` |
| `netIncome` | Number | `income.grossIncome - netTax` |
| `monthlyTax` | Number | `netTax / 12` — monthly PAYE equivalent |

## 3. PROVISIONAL TAX CALCULATION

Model `provisionalTax` — [server/models/provTaxCalcSchema.js](../server/models/provTaxCalcSchema.js)

A saved provisional tax calculation — one IRP6 as the calculator worked it out.
Provisional tax is the same normal tax as section 2, paid in advance, so the
tax-on-the-estimate figures mirror the tax calculation schema. What this model
adds is everything that makes an instalment an instalment: which of the three
payments it is, the portion of the year it covers, when it fell due, and what
was already withheld or paid.

### FIELDS

| Field | Type | Required | Default | Constraints | Notes |
|---|---|---|---|---|---|
| `user` | ObjectId | Yes | — | `ref: 'user'`, indexed | Reference, not `fullName`, as in section 2 |
| `fullName.firstName` | String | Yes | — | trim, 2–50 chars | Logged in user |
| `fullName.lastName` | String | Yes | — | trim, 2–50 chars | Logged in user |
| `taxYear` | String | Yes | — | trim, match `^\d{4}-\d{4}$` | e.g. `"2025-2026"` |
| `period` | String | Yes | — | enum: `first`, `second`, `third` | Which IRP6 payment this is |
| `periodPortion` | Number | Yes | — | 0–1 | `0.5` for the first payment, `1` for the second and third. Stored rather than derived, so the record explains its own arithmetic |
| `dueDate` | Date | No | `null` | — | Worked out from the tax year's start and end dates; `null` where the year carries no usable dates |
| `estimatedTaxableIncome` | Number | Yes | — | min 0 | The estimate for the WHOLE year of assessment |
| `age` | Number | Yes | — | 16–120 | Decides how many rebates apply |
| `ageGroup` | String | Yes | — | enum: `under65`, `age65to74`, `age75plus` | As in section 2 |
| `basicAmount` | Number | No | `null` | min 0 | Taxable income per the most recent assessment. `null` where none was supplied — not the same as nil |
| `taxOnEstimate` | Number | Yes | — | min 0 | Tax the brackets produced on the estimate, before rebate |
| `rebate` | Number | Yes | — | min 0 | Cumulative age-based rebate |
| `medicalCredits` | Number | No | `0` | min 0 | Supplied by the taxpayer: `TaxYearConfig` holds no per-year credit figures |
| `annualTaxLiability` | Number | Yes | — | min 0 | Tax for the full year after rebate and credits; floored at zero |
| `taxForPeriod` | Number | Yes | — | min 0 | `annualTaxLiability × periodPortion` |
| `employeesTax` | Number | No | `0` | min 0 | PAYE already withheld for the period |
| `foreignTaxCredits` | Number | No | `0` | min 0 | Tax already paid abroad on the same income |
| `priorPayments` | Number | No | `0` | min 0 | Provisional tax already paid; always `0` on a first payment |
| `amountPayable` | Number | Yes | — | min 0 | Floored at zero: an IRP6 cannot ask for a negative payment |
| `effectiveRate` | Number | Yes | — | 0–100 | Tax for the year as a percentage of the estimate |
| `marginalRate` | Number | Yes | — | 0–100 | Rate charged on the next rand of taxable income |

Every calculated figure is worked out by
[server/utils/provisionalTaxCalculator.js](../server/utils/provisionalTaxCalculator.js),
which resolves the brackets and rebates through
[taxCalculator.js](../server/utils/taxCalculator.js) so the two calculators can
never disagree about the tax on an income.

### VIRTUALS

| Virtual | Type | Returns |
|---|---|---|
| `totalCredits` | Number | `employeesTax + foreignTaxCredits + priorPayments` — everything already paid towards the year |
| `overpaid` | Number | The surplus where the credits exceeded `taxForPeriod`, which `amountPayable` floors away |
| `remainingForYear` | Number | `annualTaxLiability - taxForPeriod` — the liability left for later payments |

## 4. INTEREST CALCULATION

Model `interest` — [server/models/interestSchema.js](../server/models/interestSchema.js)

### FIELDS

| Field | Type | Required | Default | Constraints | Notes |
|---|---|---|---|---|---|
| `user` | ObjectId | Yes | — | `ref: 'user'`, indexed | Reference, not `fullName`, so history cannot return another user's calculations when two users share a name |
| `fullName.firstName` | String | Yes | — | trim, 2–50 chars | Logged in user |
| `fullName.lastName` | String | Yes | — | trim, 2–50 chars | Logged in user |
| `principal` | Number | Yes | — | min 0 | Amount the interest is calculated on |
| `interestRate` | Number | Yes | — | min 0 | Annual rate (percentage) |
| `time.duration` | Number | Yes | — | min 0 | Length of the investment/loan |
| `time.unit` | String | No | `'years'` | enum: `years`, `months` | Unit the duration is measured in |
| `interestType` | String | No | `'simple'` | enum: `simple`, `compound` | |
| `compoundFrequency` | Number | No | `1` | min 1 | Times compounded per year; only used when `interestType` is `compound` |
| `monthlyContribution` | Number | No | `0` | min 0 | Optional recurring contribution |
| `totalInterest` | Number | Yes | — | min 0 | Interest earned over the whole period |
| `totalContributions` | Number | No | `0` | min 0 | Sum of all recurring monthly contributions |
| `finalAmount` | Number | Yes | — | min 0 | Closing balance: principal + contributions + interest |

`totalInterest`, `totalContributions` and `finalAmount` are worked out by
[server/utils/interestCalculator.js](../server/utils/interestCalculator.js) and stored rather than
derived on read — a recurring monthly contribution cannot be expressed by the
closed-form interest formulas, so recomputing on read would not reproduce what
the user was shown.

### VIRTUALS

| Virtual | Type | Returns |
|---|---|---|
| `durationInYears` | Number | `time.duration / 12` when `time.unit` is `months`, otherwise `time.duration` |
| `totalCapital` | Number | `principal + totalContributions` — capital the user paid in themselves |

`interestAmount` and `totalAmount` were previously virtuals that re-derived the
result from the closed-form formulas. They were replaced by the stored
`totalInterest` and `finalAmount` fields for the reason given above.

## 5. CURRENCY CONVERSION

Model `currency` — [server/models/curConvertSchema.js](../server/models/curConvertSchema.js)

### FIELDS

| Field | Type | Required | Default | Constraints | Notes |
|---|---|---|---|---|---|
| `user` | ObjectId | Yes | — | ref `user`, indexed | Owner of the saved conversion |
| `fullName.firstName` | String | Yes | — | trim, 2–50 chars | Logged in user |
| `fullName.lastName` | String | Yes | — | trim, 2–50 chars | Logged in user |
| `currency.baseCurrency` | String | Yes | — | trim, uppercase, match `/^[A-Z]{3}$/` | Convert from |
| `currency.targetCurrency` | String | Yes | — | trim, uppercase, match `/^[A-Z]{3}$/` | Convert to |
| `amount` | Number | Yes | — | min 0 | Entered in the base currency |
| `rate` | Number | Yes | — | min 0 | Exchange rate used (target per base) |

### VIRTUALS

| Virtual | Type | Returns |
|---|---|---|
| `convertedAmount` | Number | `amount * rate` |

### NO CURRENCY ENUM

Both currency codes are validated by format, not against a list of codes.
`targetCurrency` used to carry an `enum` while `baseCurrency` did not, which
made the two fields disagree about what a valid code was. The set of currencies
the converter accepts is now read from Frankfurter at runtime
([server/utils/currencyService.js](../server/utils/currencyService.js)), so a
whitelist baked into the schema would drift away from it and could start
rejecting conversions the API had already quoted. `GET /api/convert` decides
whether a code is supported; the schema only insists the stored value is a
3-letter uppercase code.

### OWNED BY A USER, NOT A NAME

`user` was added alongside `POST /api/save` and mirrors the same field on
`interestSchema`. The conversion is tied to a user id rather than to `fullName`,
so a history lookup cannot return another user's conversions when two users
share a name. `fullName` is kept as a snapshot of the name at the time of the
save, and is read from the database by the route rather than trusted from the
request body.

## 6. TAX YEAR CONFIG

Model `TaxYearConfig` — [server/models/TaxYearSchema.js](../server/models/TaxYearSchema.js)

The per-year SARS figures the tax calculator reads from. Made up of one top
level schema and three subdocument schemas.

### `TaxYearConfigSchema` (top level)

| Field | Type | Required | Default | Constraints | Notes |
|---|---|---|---|---|---|
| `taxYear` | String | Yes | — | unique | e.g. `"2025-2026"` |
| `startDate` | Date | Yes | — | — | 1 March |
| `endDate` | Date | Yes | — | — | 28/29 February |
| `brackets` | [`BracketSchema`] | Yes | — | — | Array of tax brackets |
| `rebates` | `RebateSchema` | Yes | — | — | Age-based rebates |
| `thresholds` | `ThresholdSchema` | Yes | — | — | Tax thresholds by age band |
| `isActive` | Boolean | No | `true` | — | Current tax year flag |
| `createdAt` | Date | No | `Date.now` | — | |

### `BracketSchema` (subdocument, `_id: false`)

| Field | Type | Required | Default | Notes |
|---|---|---|---|---|
| `min` | Number | Yes | — | Lower bound of bracket (R) |
| `max` | Number | No | `null` | Upper bound (R); `null` = no ceiling |
| `baseAmount` | Number | Yes | — | Fixed amount owed at bracket start |
| `rate` | Number | Yes | — | Marginal rate, e.g. `0.18` for 18% |

### `RebateSchema` (subdocument, `_id: false`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `primary` | Number | Yes | All taxpayers |
| `secondary` | Number | Yes | Age 65+ |
| `tertiary` | Number | Yes | Age 75+ |

### `ThresholdSchema` (subdocument, `_id: false`)

| Field | Type | Required | Notes |
|---|---|---|---|
| `under65` | Number | Yes | |
| `age65to74` | Number | Yes | |
| `age75plus` | Number | Yes | |

## 7. SHARED SCHEMA OPTIONS

| Schema | `timestamps` | `toJSON: { virtuals: true }` | `toObject: { virtuals: true }` |
|---|---|---|---|
| `userSchema` | Yes | Yes | Yes |
| `taxCalcSchema` | Yes | Yes | Yes |
| `provTaxCalcSchema` | Yes | Yes | Yes |
| `interestSchema` | Yes | Yes | Yes |
| `currencyConvertSchema` | Yes | Yes | Yes |
| `TaxYearConfigSchema` | No | No | No |

`timestamps: true` adds `createdAt` and `updatedAt`. The virtuals options make
virtual fields appear when a document is serialised, so the API returns them
alongside the stored fields. `TaxYearConfigSchema` opts out and declares its own
`createdAt` field instead.

## REFERENCES
- [docs/API.md](API.md) — endpoints these models back
- [docs/TAX_CONCEPTS.md](TAX_CONCEPTS.md) — bracket, rebate and threshold model
- [docs/CALCULATORS.md](CALCULATORS.md) — form input fields
