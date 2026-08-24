//TaxCalculations.js
// The logged in user's saved income tax calculations, listed newest first, and a
// details panal showing the full record of the calculation selected on the table.
//
// The figures are shown exactly as they were stored. A saved calculation holds
// the gross tax the brackets produced, the age-based rebate that reduced it and
// the resulting tax payable, so an old record still reproduces what the
// calculator showed even after the tax year's brackets change. `taxableIncome`,
// `netIncome` and `monthlyTax` are virtuals on the tax schema, recomputed here
// only if a record arrives without them.
//
// The table/panal behaviour is shared with the currency and interest lists
// through useCalculationsList; only the columns and the details below are its own.
import React from 'react'
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
import { monthlyTaxOf, netIncomeOf, taxableIncomeOf, toAgeGroup } from '../utils/calculationFunc';
import { X } from 'lucide-react';

//TaxCalculations.js function component
export default function TaxCalculations(
  {//PROPS PASSED FROM PARENT COMPONENT(Calculators.js)
    fetchTaxCalculations,
    loggedIn,
    taxCalculations = [],
    taxCalculationsTotal = 0,
    deleteTaxCalculation,
    loadError,
    setError
  }) {
    /* Loading, selection, delete and status handling, shared with the currency
    and interest calculation lists */
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
      items: taxCalculations,
      total: taxCalculationsTotal,
      loggedIn,
      fetchItems: fetchTaxCalculations,
      deleteItem: deleteTaxCalculation,
      confirmMessage: 'Are you sure you want to delete this saved tax calculation? This cannot be undone.',
      successMessage: 'TAX CALCULATION REMOVED FROM YOUR HISTORY',
      setError,
      logLabel: 'TaxCalculations.js'
    })
    //=============JSX RENDERING===============
  return (
    <div id='tax-calculations-list' className='calculations-list'>
      {/* Display tax calculations list in table format
      with a details panal displayed after clicking on the calculation*/}

      {/* Inline request feedback, announced to screen readers */}
      <CalculationsStatus status={status} loadError={loadError}/>

      {/* ------TAX CALCULATIONS TABLE------------- */}
      <div className='calculations-table-block'>
      {taxCalculations.length === 0 ? (
        <p className='infoText' aria-live='polite'>NO SAVED TAX CALCULATIONS TO DISPLAY</p>
      ) : (
        <table className='calculations-table' role='table' aria-label={`${taxCalculations.length} saved tax calculations`}>
          <thead>
            <tr>
              <th scope='col'>DATE SAVED</th>
              <th scope='col'>TAX YEAR</th>
              <th scope='col'>GROSS INCOME</th>
              <th scope='col'>TAXABLE INCOME</th>
              <th scope='col'>TAX PAYABLE</th>
              <th scope='col'>EFFECTIVE RATE</th>
              <th scope='col'><span className='visually-hidden'>VIEW CALCULATION DETAILS</span></th>
            </tr>
          </thead>
          <tbody>
            {/* MAP EACH SAVED CALCULATION: selecting a row opens the details panal below */}
            {taxCalculations.map((calculation, index) => {
              const isSelected = String(calculation._id) === String(selectedId)
              return (
                <tr
                  key={calculation._id}
                  className={`${rowClass(index)}${isSelected ? ' selectedRow' : ''}`}
                  aria-selected={isSelected}
                >
                  <th scope='row'>{toLongDate(calculation.createdAt)}</th>
                  <td>{calculation.income?.taxYear || NOT_AVAILABLE}</td>
                  <td>{toRands(calculation.income?.grossIncome)}</td>
                  <td>{toRands(taxableIncomeOf(calculation))}</td>
                  <td>{toRands(calculation.netTax)}</td>
                  <td>{toPercent(calculation.effectiveRate)}</td>
                  <td>
                    <Button
                      variant='light'
                      className='viewCalculationBtn'
                      type='button'
                      onClick={() => (isSelected ? closePanal() : selectItem(calculation._id))}
                      // ARIA ATTRIBUTES:
                      aria-label={`${isSelected ? 'Hide' : 'View'} details for the tax calculation saved on ${toLongDate(calculation.createdAt)}`}
                      aria-pressed={isSelected}
                      aria-expanded={isSelected}
                      aria-controls='tax-calculation-details-panal'
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
          {`SHOWING THE NEWEST ${taxCalculations.length} OF ${taxCalculationsTotal} SAVED TAX CALCULATIONS`}
        </p>
      )}
      </div>

      {/* DETAILS PANAL IF A CALCULATION IS SELECTED ON THE TABLE LIST */}
      {selectedCalculation && (
      <div id='tax-calculation-details-panal' className='calculations-panal'>
        <Stack direction="horizontal" gap={3} className='calculations-panal-head'>
          <div className="p-2">
            {/* THE CALCULATION ITSELF: tax payable for the tax year */}
            <h5 className='calculations-panal-heading'>
              {`${toRands(selectedCalculation.netTax)} TAX PAYABLE FOR ${selectedCalculation.income?.taxYear || NOT_AVAILABLE}`}
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
            aria-label='Close tax calculation details'
            aria-controls='tax-calculation-details-panal'
            ><X fontWeight={700} fontSize={16} aria-hidden='true' focusable='false'/>CLOSE</Button>
          </div>
        </Stack>
        <div className='calculations-panal-body'>
          <Stack gap={3} className='calculations-details-stack'>
            <div className="p-2">
              {/* INCOME: what the tax was worked out on */}
              <div className='details-group'>
                <span><p className='nested-details-label'>INCOME:</p></span>
                <div className='nested-details-group'>
                  <span className='nested-details-span'>
                    <p className='details-label'>GROSS INCOME:</p>
                    <p className='details-value'>{toRands(selectedCalculation.income?.grossIncome)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>DEDUCTIONS:</p>
                    <p className='details-value'>{toRands(selectedCalculation.deductions || 0)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>TAXABLE INCOME:</p>
                    <p className='details-value'>{toRands(taxableIncomeOf(selectedCalculation))}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>INCOME AFTER TAX:</p>
                    <p className='details-value'>{toRands(netIncomeOf(selectedCalculation))}</p>
                  </span>
                </div>
              </div>
            </div>
            <div className="p-2">
              {/* TAX: the bracket result, the rebate and what is payable */}
              <div className='details-group'>
                <span><p className='nested-details-label'>TAX:</p></span>
                <div className='nested-details-group'>
                  <span className='nested-details-span'>
                    <p className='details-label'>GROSS TAX:</p>
                    <p className='details-value'>{toRands(selectedCalculation.grossTax)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>REBATE:</p>
                    <p className='details-value'>{toRands(selectedCalculation.rebate)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>TAX PAYABLE:</p>
                    <p className='details-value'>{toRands(selectedCalculation.netTax)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>MONTHLY PAYE:</p>
                    <p className='details-value'>{toRands(monthlyTaxOf(selectedCalculation))}</p>
                  </span>
                </div>
              </div>
            </div>
          </Stack>
          <Stack gap={3} className='calculations-details-stack'>
            <div className="p-2">
              {/* RATES: what the calculation worked out to */}
              <div className='details-group'>
                <span><p className='nested-details-label'>RATES:</p></span>
                <div className='nested-details-group'>
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
              {/* TAXPAYER: the age band the rebates were applied from */}
              <div className='details-group'>
                <span><p className='nested-details-label'>TAXPAYER:</p></span>
                <div className='nested-details-group'>
                  <span className='nested-details-span'>
                    <p className='details-label'>AGE:</p>
                    <p className='details-value'>{typeof selectedCalculation.age === 'number' ? selectedCalculation.age : NOT_AVAILABLE}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>AGE GROUP:</p>
                    <p className='details-value'>{toAgeGroup(selectedCalculation.ageGroup)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>DEPENDANTS:</p>
                    <p className='details-value'>{typeof selectedCalculation.dependants === 'number' ? selectedCalculation.dependants : 0}</p>
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
              {/* SAVED: createdAt timestamp on the tax schema */}
              <div className='details-group'>
                <span><p className='details-label'>SAVED:</p></span>
                <p className='details-value'>{toLongDateTime(selectedCalculation.createdAt)}</p>
              </div>
            </div>
            <div className="p-2">
              {/* LAST UPDATED: updatedAt timestamp on the tax schema */}
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
            <h6>DEPENDANTS ARE RECORDED FOR REFERENCE ONLY: NO MEDICAL SCHEME CREDIT IS APPLIED</h6>
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
            aria-label={deleteLoading ? 'DELETING...' : 'delete tax calculation'}
            >{deleteLoading ? 'DELETING...' : 'DELETE CALCULATION'}</Button>
          </div>
        </Stack>
      </div>
      )}
    </div>
  )
}
