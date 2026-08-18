// TaxDataDisplay.js
// Read-only display of a tax year configuration: brackets, rebates and thresholds.
// Defaults to the seed data set (SARS 2025-2026) when no taxData prop is passed.
import React, { useState } from 'react'
import '../css/componentCss/TaxDataDisplay.css'
import { taxSeedData } from '../dataArrays/taxSeedData';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
// ===========HELPER FUNCTIONS===========
// Format a number as Rands, e.g. 237100 -> R 237 100
const toRands = (value) =>
  `R ${new Intl.NumberFormat('en-ZA').format(value)}`

// Format a decimal rate as a percentage, e.g. 0.18 -> 18%
const toPercent = (rate) => `${(rate * 100).toFixed(rate * 100 % 1 === 0 ? 0 : 2)}%`

// Format an ISO date string as e.g. 01 March 2025
const toLongDate = (value) =>
  new Date(value).toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })

// Row striping: STYLES.md 1.5. TABLES
const rowClass = (index) => (index % 2 === 0 ? 'evenRow' : 'oddRow')

export default function TaxDataDisplay({ taxData = taxSeedData }) {
  const { taxYear, startDate, endDate, brackets, rebates, thresholds, isActive } = taxData
  const [showTaxData, setShowTaxData] = useState(false)

  const toggleTaxData = () => setShowTaxData((prev) => !prev)

  // LABELS FOR THE REBATE AND THRESHOLD KEYS
  const rebateRows = [
    ['primary', 'Primary (all taxpayers)', rebates.primary],
    ['secondary', 'Secondary (age 65 to below 75)', rebates.secondary],
    ['tertiary', 'Tertiary (age 75 and older)', rebates.tertiary]
  ]
  const thresholdRows = [
    ['under65', 'Under 65', thresholds.under65],
    ['age65to74', '65 to below 75', thresholds.age65to74],
    ['age75plus', '75 and older', thresholds.age75plus]
  ]

  //===============JSX RENDERING=================
  return (
    <div id='tax-data-block'>
      {/* TAX YEAR SUMMARY */}
      <div id='tax-year-summary'>
      <Stack gap={3} id='tax-summary-stack'>
      <div className="p-2" id='summary-block1'>
        <h3 id='tax-data-heading'>TAX YEAR {taxYear}</h3>
      </div>
      <div className="p-2" id='summary-block2'>
         <p className='tax-data-info'>
          {toLongDate(startDate)} &ndash; {toLongDate(endDate)}
        </p>
      </div>
      <div className="p-2" id='summary-block3'> 
        <span id='active-year-span'>
            <h6 className={isActive ? 'activeYear' : 'inactiveYear'}>
                {isActive ? 'ACTIVE TAX YEAR' : 'NOT THE ACTIVE TAX YEAR'}
            </h6>
        </span>
        </div>
    </Stack>
        
       
       
        <div id='toggle-tax-data-div'>
        <Button variant='light' id='toggleTaxDataBtn' onClick={toggleTaxData}
        aria-label={showTaxData ? 'Hide tax data': 'show tax data'}
        aria-controls=''
        aria-pressed={showTaxData}
        aria-expanded={showTaxData}
        >
           {showTaxData ? <>Hide {taxYear} Data</> : <>SHOW {taxYear} TAX DATA</>} 

        </Button>
      </div>
      </div>
      
      {showTaxData  && (
        <div id='tax-data-panal'>
             {/* INCOME TAX BRACKETS */}
      <div className='tax-data-group' aria-labelledby='bracketsHead'>
        <h5 className='tax-data-subheading' id='bracketsHead'>INCOME TAX BRACKETS</h5>
        <table
          className='tax-data-table'
          role='table'
          aria-label={`Income tax brackets for the ${taxYear} tax year`}
        >
          <thead>
            <tr>
              <th scope='col'>TAXABLE INCOME</th>
              <th scope='col'>BASE AMOUNT</th>
              <th scope='col'>RATE</th>
            </tr>
          </thead>
          <tbody>
            {/* MAP EACH BRACKET: max of null = no upper ceiling */}
            {brackets.map(({ min, max, baseAmount, rate }, index) => (
              <tr key={min} className={rowClass(index)}>
                <th scope='row'>
                  {max === null
                    ? `${toRands(min)} and above`
                    : `${toRands(min)} – ${toRands(max)}`}
                </th>
                <td>{toRands(baseAmount)}</td>
                <td>{toPercent(rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* REBATES */}
      <div className='tax-data-group' aria-labelledby='rebatesHead'>
        <h5 className='tax-data-subheading' id='rebatesHead'>REBATES (ANNUAL)</h5>
        <table
          className='tax-data-table'
          role='table'
          aria-label={`Annual tax rebates for the ${taxYear} tax year`}
        >
          <thead>
            <tr>
              <th scope='col'>REBATE</th>
              <th scope='col'>AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            {rebateRows.map(([key, label, amount], index) => (
              <tr key={key} className={rowClass(index)}>
                <th scope='row'>{label}</th>
                <td>{toRands(amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TAX THRESHOLDS */}
      <div className='tax-data-group' aria-labelledby='thresholdsHead'>
        <h5 className='tax-data-subheading' id='thresholdsHead'>TAX THRESHOLDS</h5>
        <table
          className='tax-data-table'
          role='table'
          aria-label={`Tax thresholds by age group for the ${taxYear} tax year`}
        >
          <thead>
            <tr>
              <th scope='col'>AGE GROUP</th>
              <th scope='col'>THRESHOLD</th>
            </tr>
          </thead>
          <tbody>
            {thresholdRows.map(([key, label, amount], index) => (
              <tr key={key} className={rowClass(index)}>
                <th scope='row'>{label}</th>
                <td>{toRands(amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </div>
      )}

     
    </div>
  )
}
