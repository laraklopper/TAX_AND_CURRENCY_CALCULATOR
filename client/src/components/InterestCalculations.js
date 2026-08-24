//InterestCalculations.js
// The logged in user's saved interest calculations, listed newest first, and a
// details panal showing the full record of the calculation selected on the table.
//
// The figures are shown exactly as they were stored rather than being re-derived
// from the simple/compound formulas: neither formula can account for a recurring
// monthly contribution, so a re-derived figure would disagree with what the
// calculator showed. `durationInYears` and `totalCapital` are virtuals on the
// interest schema, recomputed here only if a record arrives without them.
//
// The table/panal behaviour is shared with the currency and tax lists through
// useCalculationsList; only the columns and the details below are its own.
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
import { durationInYearsOf, toCompounding, toTerm, totalCapitalOf } from '../utils/calculationFunc';

//InterestCalculations.js function component
export default function InterestCalculations(
  {//PROPS PASSED FROM PARENT COMPONENT(Calculators.js)
    fetchInterestCalculations,
    loggedIn,
    interestCalculations = [],
    interestCalculationsTotal = 0,
    deleteInterestCalculation,
    loadError,
    setError
  }) {
    /* Loading, selection, delete and status handling, shared with the currency
    and tax calculation lists */
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
      items: interestCalculations,
      total: interestCalculationsTotal,
      loggedIn,
      fetchItems: fetchInterestCalculations,
      deleteItem: deleteInterestCalculation,
      confirmMessage: 'Are you sure you want to delete this saved interest calculation? This cannot be undone.',
      successMessage: 'INTEREST CALCULATION REMOVED FROM YOUR HISTORY',
      setError,
      logLabel: 'InterestCalculations.js'
    })
    //=============JSX RENDERING===============
  return (
    <div id='interest-calculations-list' className='calculations-list'>
      {/* Display interest calculations list in table format
      with a details panal displayed after clicking on the calculation*/}

      {/* Inline request feedback, announced to screen readers */}
      <CalculationsStatus status={status} loadError={loadError}/>

      {/* ------INTEREST CALCULATIONS TABLE------------- */}
      <div className='calculations-table-block'>
      {interestCalculations.length === 0 ? (
        <p className='infoText' aria-live='polite'>NO SAVED INTEREST CALCULATIONS TO DISPLAY</p>
      ) : (
        <table className='calculations-table' role='table' aria-label={`${interestCalculations.length} saved interest calculations`}>
          <thead>
            <tr>
              <th scope='col'>DATE SAVED</th>
              <th scope='col'>TYPE</th>
              <th scope='col'>PRINCIPAL</th>
              <th scope='col'>RATE</th>
              <th scope='col'>TERM</th>
              <th scope='col'>INTEREST EARNED</th>
              <th scope='col'>FINAL AMOUNT</th>
              <th scope='col'><span className='visually-hidden'>VIEW CALCULATION DETAILS</span></th>
            </tr>
          </thead>
          <tbody>
            {/* MAP EACH SAVED CALCULATION: selecting a row opens the details panal below */}
            {interestCalculations.map((calculation, index) => {
              const isSelected = String(calculation._id) === String(selectedId)
              return (
                <tr
                  key={calculation._id}
                  className={`${rowClass(index)}${isSelected ? ' selectedRow' : ''}`}
                  aria-selected={isSelected}
                >
                  <th scope='row'>{toLongDate(calculation.createdAt)}</th>
                  <td>{(calculation.interestType || NOT_AVAILABLE).toUpperCase()}</td>
                  <td>{toRands(calculation.principal)}</td>
                  <td>{toPercent(calculation.interestRate)}</td>
                  <td>{toTerm(calculation.time)}</td>
                  <td>{toRands(calculation.totalInterest)}</td>
                  <td>{toRands(calculation.finalAmount)}</td>
                  <td>
                    <Button
                      variant='light'
                      className='viewCalculationBtn'
                      type='button'
                      onClick={() => (isSelected ? closePanal() : selectItem(calculation._id))}
                      // ARIA ATTRIBUTES:
                      aria-label={`${isSelected ? 'Hide' : 'View'} details for the interest calculation saved on ${toLongDate(calculation.createdAt)}`}
                      aria-pressed={isSelected}
                      aria-expanded={isSelected}
                      aria-controls='interest-calculation-details-panal'
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
          {`SHOWING THE NEWEST ${interestCalculations.length} OF ${interestCalculationsTotal} SAVED INTEREST CALCULATIONS`}
        </p>
      )}
      </div>

      {/* DETAILS PANAL IF A CALCULATION IS SELECTED ON THE TABLE LIST */}
      {selectedCalculation && (
      <div id='interest-calculation-details-panal' className='calculations-panal'>
        <Stack direction="horizontal" gap={3} className='calculations-panal-head'>
          <div className="p-2">
            {/* THE CALCULATION ITSELF: the closing balance and how it was earned */}
            <h5 className='calculations-panal-heading'>
              {`${toRands(selectedCalculation.finalAmount)} AFTER ${toTerm(selectedCalculation.time)} ${(selectedCalculation.interestType || '').toUpperCase()} INTEREST`}
            </h5>
          </div>
          <div className="p-2 ms-auto"></div>
          <div className="p-2">
            <Button
            variant='light'
            className='closeCalculationPanalBtn'
            type='button'
            onClick={closePanal}
            // ARIA ATTRIBUTES:
            aria-label='Close interest calculation details'
            aria-controls='interest-calculation-details-panal'
            >CLOSE</Button>
          </div>
        </Stack>
        <div className='calculations-panal-body'>
          <Stack gap={3} className='calculations-details-stack'>
            <div className="p-2">
              {/* CAPITAL: what the user paid in themselves */}
              <div className='details-group'>
                <span><p className='nested-details-label'>CAPITAL:</p></span>
                <div className='nested-details-group'>
                  <span className='nested-details-span'>
                    <p className='details-label'>PRINCIPAL:</p>
                    <p className='details-value'>{toRands(selectedCalculation.principal)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>MONTHLY CONTRIBUTION:</p>
                    <p className='details-value'>{toRands(selectedCalculation.monthlyContribution || 0)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>TOTAL CONTRIBUTIONS:</p>
                    <p className='details-value'>{toRands(selectedCalculation.totalContributions || 0)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>TOTAL CAPITAL:</p>
                    <p className='details-value'>{toRands(totalCapitalOf(selectedCalculation))}</p>
                  </span>
                </div>
              </div>
            </div>
            <div className="p-2">
              {/* RESULT: the interest earned and the closing balance */}
              <div className='details-group'>
                <span><p className='nested-details-label'>RESULT:</p></span>
                <div className='nested-details-group'>
                  <span className='nested-details-span'>
                    <p className='details-label'>INTEREST EARNED:</p>
                    <p className='details-value'>{toRands(selectedCalculation.totalInterest)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>FINAL AMOUNT:</p>
                    <p className='details-value'>{toRands(selectedCalculation.finalAmount)}</p>
                  </span>
                </div>
              </div>
            </div>
          </Stack>
          <Stack gap={3} className='calculations-details-stack'>
            <div className="p-2">
              {/* TERMS: the rate, the term and how the interest was applied */}
              <div className='details-group'>
                <span><p className='nested-details-label'>TERMS:</p></span>
                <div className='nested-details-group'>
                  <span className='nested-details-span'>
                    <p className='details-label'>INTEREST TYPE:</p>
                    <p className='details-value'>{(selectedCalculation.interestType || NOT_AVAILABLE).toUpperCase()}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>INTEREST RATE:</p>
                    <p className='details-value'>{toPercent(selectedCalculation.interestRate)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>TERM:</p>
                    <p className='details-value'>{toTerm(selectedCalculation.time)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>TERM IN YEARS:</p>
                    <p className='details-value'>{toTerm({ duration: durationInYearsOf(selectedCalculation), unit: 'years' })}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>COMPOUNDED:</p>
                    <p className='details-value'>{toCompounding(selectedCalculation)}</p>
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
              {/* SAVED: createdAt timestamp on the interest schema */}
              <div className='details-group'>
                <span><p className='details-label'>SAVED:</p></span>
                <p className='details-value'>{toLongDateTime(selectedCalculation.createdAt)}</p>
              </div>
            </div>
            <div className="p-2">
              {/* LAST UPDATED: updatedAt timestamp on the interest schema */}
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
            <h6>THESE FIGURES ARE SHOWN AS THEY WERE CALCULATED, NOT RE-DERIVED FROM THE FORMULAS</h6>
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
            aria-label={deleteLoading ? 'DELETING...' : 'delete interest calculation'}
            >{deleteLoading ? 'DELETING...' : 'DELETE CALCULATION'}</Button>
          </div>
        </Stack>
      </div>
      )}
    </div>
  )
}
