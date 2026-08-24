// TaxDataDisplay.js
// Read-only display of a tax year configuration: brackets, rebates and thresholds.
// Defaults to the seed data set (SARS 2025-2026) when no taxData prop is passed.
import React, { useState } from 'react'
import '../css/componentCss/TaxDataDisplay.css'
import { taxSeedData } from '../dataArrays/taxSeedData';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import TaxConcepts from './TaxConcepts';
// IMPORT UTILITY FUNCTIONS
import { toRatePercent, toWholeRands } from '../utils/calculationFunc';
import { rowClass, toLongDate } from '../utils/formatCalculations';

export default function TaxDataDisplay({ taxData = taxSeedData }) {
  const { taxYear, startDate, endDate, brackets, rebates, thresholds, isActive } = taxData
  const [showTaxData, setShowTaxData] = useState(false)
 

  const toggleTaxData = () => {
    setShowTaxData((prev) => !prev)
  }

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
    <Stack gap={3} id='toggle-tax-data-stack'>
      <div className="p-2" id='toggle-tax-data-block2'>
        <Button variant='light' id='toggleTaxDataBtn' onClick={toggleTaxData}
        aria-label={showTaxData ? 'Hide tax data': 'show tax data'}
        aria-controls=''
        aria-pressed={showTaxData}
        aria-expanded={showTaxData}
        >
           {showTaxData ? <>Hide {taxYear} Data</> : <>SHOW {taxYear} TAX DATA</>} 
        </Button>
      </div>
       <div className="p-2" id='sars-link-block'>
          <span className='web-link-item'>
            <a  target='blank'
            href='https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/' 
            className='web-Link'>https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/</a>
          </span>
        </div>
    </Stack>  
      </div>
     
        <div id='tax-concept-panal'>
          <TaxConcepts/>
        
   
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
                    ? `${toWholeRands(min)} and above`
                    : `${toWholeRands(min)} – ${toWholeRands(max)}`}
                </th>
                <td>{toWholeRands(baseAmount)}</td>
                <td>{toRatePercent(rate)}</td>
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
                <td>{toWholeRands(amount)}</td>
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
                <td>{toWholeRands(amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </div>
      )}</div>
    </div>
  )
}
