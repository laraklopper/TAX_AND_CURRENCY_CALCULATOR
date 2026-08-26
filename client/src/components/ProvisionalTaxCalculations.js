//ProvisionalTaxCalculations.js
// The logged in user's saved provisional tax (IRP6) calculations, listed newest
// first, and a details panal showing the full record of the calculation selected
// on the table.
//
// Provisional tax is the same normal tax the income tax calculator produces,
// paid in advance, so the tax-on-the-estimate figures read like the ones on the
// tax calculations list. What this list has to show on top of them is everything
// that makes an instalment an instalment: WHICH of the three payments it is, the
// portion of the year's liability that payment covers, the date it fell due, and
// the employees' tax, foreign tax credits and earlier provisional payments
// deducted from it.
//
// The figures are shown exactly as they were stored. A saved record therefore
// still reproduces what the calculator showed after the tax year's brackets or
// the taxpayer's own estimate change - which is the point of keeping an IRP6:
// the second payment is worked out with the first one deducted from it.
// `totalCredits`, `overpaid` and `remainingForYear` are virtuals on the
// provisional tax schema, recomputed here only if a record arrives without them.
//
// The table/panal behaviour is shared with the other saved-calculation lists
// through useCalculationsList; only the columns and the details below are its own.
import React, { useCallback, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentCss/CalculationsList.css'
import '../css/componentCss/DetailsPanal.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// IMPORT SHARED LIST BEHAVIOUR/FORMATTING
import CalculationsStatus from './CalculationsStatus';
import useCalculationsList from '../utils/useCalculationsList';
import { NOT_AVAILABLE, rowClass, toFullName, toLongDate, toLongDateTime, toPercent, toRands } from '../utils/formatCalculations';
import {
  overpaidOf,
  remainingForYearOf,
  toAgeGroup,
  toPeriodPortion,
  toProvisionalPeriod,
  toProvisionalPeriodLabel,
  totalCreditsOf
} from '../utils/calculationFunc';
import { X } from 'lucide-react';
import ExportForm from './ExportForm';

/* Shown in place of the basic amount on a record that carries none. A taxpayer
filing their first IRP6 has no assessment to take one from, and the third
payment is made once the year has ended, so there is no estimate left to judge
against it. Neither case is a missing detail: nothing was supplied because
nothing applied. */
const NOT_SUPPLIED = 'NOT SUPPLIED'

//ProvisionalTaxCalculations.js function component
export default function ProvisionalTaxCalculations(
  {//PROPS PASSED FROM PARENT COMPONENT(Calculations.js)
    fetchProvTaxCalculations,
    loggedIn,
    provTaxCalculations = [],
    provTaxCalculationsTotal = 0,
    deleteProvTaxCalculation,
    loadError,
    setError
  }) {
    const [toggleExport, setToggleExport] = useState(false)
    /* Loading, selection, delete and status handling, shared with the tax, VAT,
    currency and interest calculation lists */
    const {
      selectedId,
      selected: selectedCalculation,
      status,
      deleteLoading,
      isTruncated,
      selectItem,
      closePanal,
      removeSelected
    } = useCalculationsList({
      items: provTaxCalculations,
      total: provTaxCalculationsTotal,
      loggedIn,
      fetchItems: fetchProvTaxCalculations,
      deleteItem: deleteProvTaxCalculation,
      confirmMessage: 'Are you sure you want to delete this saved provisional tax calculation? This cannot be undone.',
      successMessage: 'PROVISIONAL TAX CALCULATION REMOVED FROM YOUR HISTORY',
      setError,
      logLabel: 'ProvisionalTaxCalculations.js'
    })

    const toggleExportForm = useCallback(() => {
      setToggleExport(prev => !prev)
      closePanal()//Close panal
    },[closePanal])
    //=============JSX RENDERING===============
  return (
    <div id='prov-tax-calculations-list' className='calculations-list'>
      {/* Display provisional tax calculations list in table format
      with a details panal displayed after clicking on the calculation*/}

      {/* Inline request feedback, announced to screen readers */}
      <CalculationsStatus status={status} loadError={loadError}/>

      {/* ------PROVISIONAL TAX CALCULATIONS TABLE------------- */}
      <div className='calculations-table-block'>
      {provTaxCalculations.length === 0 ? (
        <p className='infoText' aria-live='polite'>NO SAVED PROVISIONAL TAX CALCULATIONS TO DISPLAY</p>
      ) : (
        <table className='calculations-table' role='table' aria-label={`${provTaxCalculations.length} saved provisional tax calculations`}>
          <thead>
            <tr>
              <th scope='col'>DATE SAVED</th>
              <th scope='col'>TAX YEAR</th>
              <th scope='col'>PAYMENT</th>
              <th scope='col'>DUE DATE</th>
              <th scope='col'>ESTIMATED INCOME</th>
              <th scope='col'>TAX FOR PERIOD</th>
              <th scope='col'>AMOUNT PAYABLE</th>
              <th scope='col'><span className='visually-hidden'>VIEW CALCULATION DETAILS</span></th>
            </tr>
          </thead>
          <tbody>
            {/* MAP EACH SAVED CALCULATION: selecting a row opens the details panal below */}
            {provTaxCalculations.map((calculation, index) => {
              const isSelected = String(calculation._id) === String(selectedId)
              return (
                <tr
                  key={calculation._id}
                  className={`${rowClass(index)}${isSelected ? ' selectedRow' : ''}`}
                  aria-selected={isSelected}
                >
                  <th scope='row'>{toLongDate(calculation.createdAt)}</th>
                  <td>{calculation.taxYear || NOT_AVAILABLE}</td>
                  <td>{toProvisionalPeriodLabel(calculation.period)}</td>
                  {/* Null where the tax year carried no usable dates to work it out from */}
                  <td>{toLongDate(calculation.dueDate)}</td>
                  <td>{toRands(calculation.estimatedTaxableIncome)}</td>
                  <td>{toRands(calculation.taxForPeriod)}</td>
                  <td>{toRands(calculation.amountPayable)}</td>
                  <td>
                    <Button
                      variant='light'
                      className='viewCalculationBtn'
                      type='button'
                      onClick={() => (isSelected ? closePanal() : selectItem(calculation._id))}
                      // ARIA ATTRIBUTES:
                      aria-label={`${isSelected ? 'Hide' : 'View'} details for the provisional tax calculation saved on ${toLongDate(calculation.createdAt)}`}
                      aria-pressed={isSelected}
                      aria-expanded={isSelected}
                      aria-controls='prov-tax-calculation-details-panal'
                    >
                      {isSelected ? 'HIDE' : 'VIEW'}
                    </Button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Say so when the list is only the newest slice of a longer history */}
      {isTruncated && (
        <p className='infoText' aria-live='polite'>
          {`SHOWING THE NEWEST ${provTaxCalculations.length} OF ${provTaxCalculationsTotal} SAVED PROVISIONAL TAX CALCULATIONS`}
        </p>
      )}
      </div>
      <div>
        <Button
        variant='light'
        id='toggleExportBtn'
        onClick={toggleExportForm}
        type='button'
        // ARIA ATTRIBUTES:
        aria-label={toggleExport ? 'Exit': 'Export provisional tax calculations'}
        aria-controls='prov-tax-export-form-panal'
        aria-pressed={toggleExport}
        aria-expanded={toggleExport}
        >
          {toggleExport ? 'Exit': 'Export calculations'}
        </Button>
      </div>
      {toggleExport && (
        <div id='prov-tax-export-form-panal'>
          <ExportForm type='provisional'/>
        </div>
      )}

      {/* DETAILS PANAL IF A CALCULATION IS SELECTED ON THE TABLE LIST */}
      {selectedCalculation && (
      <div id='prov-tax-calculation-details-panal' className='calculations-panal'>
        <Stack direction="horizontal" gap={3} className='calculations-panal-head'>
          <div className="p-2">
            {/* THE CALCULATION ITSELF: what this IRP6 asks for, and which one it is */}
            <h5 className='calculations-panal-heading'>
              {`${toRands(selectedCalculation.amountPayable)} PAYABLE: ${toProvisionalPeriod(selectedCalculation.period)} FOR ${selectedCalculation.taxYear || NOT_AVAILABLE}`}
            </h5>
          </div>
          <div className="p-2 ms-auto"></div>
          <div className="p-2">
            <Button
            variant='warning'
            id='closeCalculationPanalBtn'
            type='button'
            onClick={closePanal}
            // ARIA ATTRIBUTES:
            aria-label='Close provisional tax calculation details'
            aria-controls='prov-tax-calculation-details-panal'
            ><X fontWeight={700} fontSize={16} aria-hidden='true' focusable='false'/>CLOSE</Button>
          </div>
        </Stack>
        <div className='calculations-panal-body'>
          <Stack gap={3} className='calculations-details-stack'>
            <div className="p-2">
              {/* THE IRP6: which of the three payments this is, and when it fell due */}
              <div className='details-group'>
                <span><p className='nested-details-label'>THE IRP6:</p></span>
                <div className='nested-details-group'>
                  <span className='nested-details-span'>
                    <p className='details-label'>TAX YEAR:</p>
                    <p className='details-value'>{selectedCalculation.taxYear || NOT_AVAILABLE}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>PAYMENT:</p>
                    <p className='details-value'>{toProvisionalPeriod(selectedCalculation.period)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>PORTION OF THE YEAR:</p>
                    <p className='details-value'>{toPeriodPortion(selectedCalculation.periodPortion)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>DUE DATE:</p>
                    <p className='details-value'>{toLongDate(selectedCalculation.dueDate)}</p>
                  </span>
                </div>
              </div>
            </div>
            <div className="p-2">
              {/* THE ESTIMATE: what the tax for the year was worked out on */}
              <div className='details-group'>
                <span><p className='nested-details-label'>THE ESTIMATE:</p></span>
                <div className='nested-details-group'>
                  <span className='nested-details-span'>
                    <p className='details-label'>ESTIMATED TAXABLE INCOME:</p>
                    <p className='details-value'>{toRands(selectedCalculation.estimatedTaxableIncome)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>BASIC AMOUNT:</p>
                    <p className='details-value'>
                      {typeof selectedCalculation.basicAmount === 'number'
                        ? toRands(selectedCalculation.basicAmount)
                        : NOT_SUPPLIED}
                    </p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>AGE:</p>
                    <p className='details-value'>{typeof selectedCalculation.age === 'number' ? selectedCalculation.age : NOT_AVAILABLE}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>AGE GROUP:</p>
                    <p className='details-value'>{toAgeGroup(selectedCalculation.ageGroup)}</p>
                  </span>
                </div>
              </div>
            </div>
            <div className="p-2">
              {/* TAX FOR THE YEAR: the brackets, the rebate and the credits */}
              <div className='details-group'>
                <span><p className='nested-details-label'>TAX FOR THE YEAR:</p></span>
                <div className='nested-details-group'>
                  <span className='nested-details-span'>
                    <p className='details-label'>TAX ON ESTIMATE:</p>
                    <p className='details-value'>{toRands(selectedCalculation.taxOnEstimate)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>LESS REBATE:</p>
                    <p className='details-value'>{toRands(selectedCalculation.rebate)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>LESS MEDICAL CREDITS:</p>
                    <p className='details-value'>{toRands(selectedCalculation.medicalCredits || 0)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>ANNUAL TAX LIABILITY:</p>
                    <p className='details-value'>{toRands(selectedCalculation.annualTaxLiability)}</p>
                  </span>
                </div>
              </div>
            </div>
          </Stack>
          <Stack gap={3} className='calculations-details-stack'>
            <div className="p-2">
              {/* THIS PAYMENT: the portion of the year's liability it covers */}
              <div className='details-group'>
                <span><p className='nested-details-label'>THIS PAYMENT:</p></span>
                <div className='nested-details-group'>
                  <span className='nested-details-span'>
                    <p className='details-label'>TAX FOR THE PERIOD:</p>
                    <p className='details-value'>{toRands(selectedCalculation.taxForPeriod)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>REMAINING FOR THE YEAR:</p>
                    <p className='details-value'>{toRands(remainingForYearOf(selectedCalculation))}</p>
                  </span>
                </div>
              </div>
            </div>
            <div className="p-2">
              {/* ALREADY PAID: what came off the instalment */}
              <div className='details-group'>
                <span><p className='nested-details-label'>ALREADY PAID:</p></span>
                <div className='nested-details-group'>
                  <span className='nested-details-span'>
                    <p className='details-label'>EMPLOYEES' TAX:</p>
                    <p className='details-value'>{toRands(selectedCalculation.employeesTax || 0)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>FOREIGN TAX CREDITS:</p>
                    <p className='details-value'>{toRands(selectedCalculation.foreignTaxCredits || 0)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>PROVISIONAL TAX ALREADY PAID:</p>
                    <p className='details-value'>{toRands(selectedCalculation.priorPayments || 0)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>TOTAL CREDITS:</p>
                    <p className='details-value'>{toRands(totalCreditsOf(selectedCalculation))}</p>
                  </span>
                </div>
              </div>
            </div>
            <div className="p-2">
              {/* RESULT: what is payable, and any surplus the floor hid */}
              <div className='details-group'>
                <span><p className='nested-details-label'>RESULT:</p></span>
                <div className='nested-details-group'>
                  <span className='nested-details-span'>
                    <p className='details-label'>AMOUNT PAYABLE:</p>
                    <p className='details-value'>{toRands(selectedCalculation.amountPayable)}</p>
                  </span>
                  {/* The amount payable is floored at zero, so a surplus is
                  reported separately rather than as a negative payment */}
                  <span className='nested-details-span'>
                    <p className='details-label'>OVERPAID:</p>
                    <p className='details-value'>{toRands(overpaidOf(selectedCalculation))}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>EFFECTIVE RATE:</p>
                    <p className='details-value'>{toPercent(selectedCalculation.effectiveRate)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>MARGINAL RATE:</p>
                    <p className='details-value'>{toPercent(selectedCalculation.marginalRate)}</p>
                  </span>
                </div>
              </div>
            </div>
            <div className="p-2">
              {/* SAVED BY: the fullName stored on the record */}
              <div className='details-group'>
                <span><p className='details-label'>SAVED BY:</p></span>
                <p className='details-value'>{toFullName(selectedCalculation.fullName)}</p>
              </div>
            </div>
            <div className="p-2">
              {/* SAVED: createdAt timestamp on the provisional tax schema */}
              <div className='details-group'>
                <span><p className='details-label'>SAVED:</p></span>
                <p className='details-value'>{toLongDateTime(selectedCalculation.createdAt)}</p>
              </div>
            </div>
            <div className="p-2">
              {/* LAST UPDATED: updatedAt timestamp on the provisional tax schema */}
              <div className='details-group'>
                <span><p className='details-label'>LAST UPDATED:</p></span>
                <p className='details-value'>{toLongDateTime(selectedCalculation.updatedAt)}</p>
              </div>
            </div>
          </Stack>
        </div>
        {/* PANAL FOOTER: delete the saved calculation */}
        <Stack direction="horizontal" gap={3} className='calculations-panal-footer'>
          <div className="p-2">
            <h6>THE RATES DESCRIBE THE ESTIMATE FOR THE WHOLE YEAR, NOT THIS INSTALMENT</h6>
          </div>
          <div className="p-2 ms-auto"></div>
          <div className="p-2">
            <Button
            variant='danger'
            id='deleteCalculationBtn'
            type='button'
            onClick={removeSelected}
            disabled={deleteLoading}
            // ARIA ATTRIBUTES:
            aria-disabled={deleteLoading}
            aria-label={deleteLoading ? 'DELETING...' : 'delete provisional tax calculation'}
            >{deleteLoading ? 'DELETING...' : 'DELETE CALCULATION'}</Button>
          </div>
        </Stack>
      </div>
      )}
    </div>
  )
}
