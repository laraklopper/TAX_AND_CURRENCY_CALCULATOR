# CALCULATORS

## TABLE OF CONTENTS
1. [APPLICATION CALCULATORS](#1-application-calculators)
2. [TAX CALCULATOR FORM](#2-tax-calculator-form)
3. [INTEREST CALCULATOR FORM](#3-interest-calculator-form)
4. [GENERAL CALCULATOR](#4-general-calculator)
5. [CURRENCY CONVERTER](#5-currency-converter)
6. [EXPORT FORM](#6-export-form)
7. [REFERENCES](#)

## 1. APPLICATION CALCULATORS

The application provides users with four calculators: 
- TaxCalculator
- InterestCalculator
- General/basic calculator 
- CurrencyConverter

All Tax and Interest calculations are calculated in terms of South African Tax and Interest.

## 2. TAX CALCULATOR FORM [TaxCalculatorForm.js]('../client/src/components/TaxCalculatorForm.js')

SARS income tax calculator and renders the result plus a bracket-by-bracket breakdown.

### 2.1. INPUT FIELDS
|Field| Data Type| Input Type| Required |
|----|----|----|-----------|
|Income Period| Button | Button | Yes |
|(monthly/annual) Income (R)| Number | Yes |
|Age| Number | Input| Yes|
|Tax Year| Text | Select | Yes |
|Medical Aid Dependents| Number | Input | No |


## 3. INTEREST CALCULATOR FORM [InterestCalculatorForm]('../client/src/components/InterestCalculatorForm.js')

Calculator used to calculate compound or simple interest.Simple interest is worked out on the principal, or original, amount of a loan.​
Compound interest is calculated on the principal (original) amount and also on the added interest of previous periods, and so can be seen as “interest on interest.”​

The TIME PERIOD toggle lets the user work in either ANNUAL periods (time entered in years, one breakdown row per year) or MONTHLY periods (time entered in months, one breakdown row per month).

The interest rate is always entered as an annual nominal rate so both options can be compared against the same quoted rate.

### 3.1. INPUT FIELDS


|Field| Data Type| Input Type| Required |
|----|----|----|-----------|
|Interest Type| Button | Button | Yes|
|Principal Amount (R)| Number |Input|Yes|
| Select TIME PERIOD(Button)|Button | Button | Yes|
|Annual Interest Rate %| Number |Input|Yes|
|Time Period (set in years or months)| Number |Input|Yes|
|Compounding frequency(*compound interest only*)|Text| Select |No|
|Recurring Monthly Contribution(R)|NUMBER|INPUT|No|

## 4. GENERAL CALCULATOR [NumberCalculator.js]('../client/src/components/NumberCalculator.js')

The buttons for the calculator are imported from [ButtonGrid.js]('../client/src/components/ButtonGrid.js')

The input for the calculation is entered in a readonly input field which is filled by clicking on the buttons.

## 5. CURRENCY CONVERTER [CurrencyConverterForm.js]('../client/src/components/CurrencyConvertForm.js')

The currency converter uses Frankfurter API for currency conversions. The codes, names and symbols come from `currencyOptions`, which the page loaded from GET /api/currencies, so the table lists exactly what Frankfurter supports.

Displays every currency the converter can work with in table format.

### INPUT FIELDS

|Field| Data Type | Input Type | Required |
|------|----|----|----|
|Amount| Number | Input | YES |
|Base currency(convert from)| Text/String |Select | YES |
|Target currency(convert to) | Text/String |Select | YES |


## 6. EXPORT FORM [ExportForm.js]('../client/src/components/ExportForm.js')

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

### INPUT FIELDS

The only input field is a select input field which allows the user to select the excel document format either xlsx or csv

## 7. REFERENCES
- https://www.jse.co.za/learn-how-to-invest/what-interest
- https://frankfurter.dev/