//VatCalculations.js
// The logged in user's saved VAT calculations, listed newest first, and a
// details panal showing the full record of the calculation selected on the table.
//
// The figures are shown exactly as they were stored, and the RATE they were
// worked out at is read off the record rather than taken from the current SARS
// rate. That matters more here than on the other lists: the VAT rate is a single
// published figure that has changed before (14% to 15% in 2018, with a rise to
// 15.5% tabled and withdrawn for 2025/2026), so restating an old calculation at
// today's rate would silently contradict the invoice it was worked out for.
//
// `enteredAmount` is a virtual on the VAT schema, recomputed here only if a
// record arrives without it. It is what says which of the three amounts the user
// actually typed: `mode` decides whether VAT was added to a VAT-exclusive price
// or stripped back out of a VAT-inclusive one, and the amounts read the same
// either way.
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
import { rowClass, toFullName, toLongDate, toLongDateTime, toRands } from '../utils/formatCalculations';
import { enteredAmountOf, toVatMode, toVatModeLabel, toVatRate } from '../utils/calculationFunc';
import { X } from 'lucide-react';
import ExportForm from './ExportForm';

//VatCalculations.js function component
export default function VatCalculations(
  {//PROPS PASSED FROM PARENT COMPONENT(Calculations.js)
    fetchVatCalculations,
    loggedIn,
    vatCalculations = [],
    vatCalculationsTotal = 0,
    deleteVatCalculation,
    loadError,
    setError
  }) {
    const [toggleExport, setToggleExport] = useState(false)
    /* Loading, selection, delete and status handling, shared with the tax,
    provisional tax, currency and interest calculation lists */
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
      items: vatCalculations,
      total: vatCalculationsTotal,
      loggedIn,
      fetchItems: fetchVatCalculations,
      deleteItem: deleteVatCalculation,
      confirmMessage: 'Are you sure you want to delete this saved VAT calculation? This cannot be undone.',
      successMessage: 'VAT CALCULATION REMOVED FROM YOUR HISTORY',
      setError,
      logLabel: 'VatCalculations.js'
    })

    const toggleExportForm = useCallback(() => {
      setToggleExport(prev => !prev)
      closePanal()//Close panal
    },[closePanal])
    //=============JSX RENDERING===============
  return (
    <div id='vat-calculations-list' className='calculations-list'>
      {/* Display VAT calculations list in table format
      with a details panal displayed after clicking on the calculation*/}

      {/* Inline request feedback, announced to screen readers */}
      <CalculationsStatus status={status} loadError={loadError}/>

      {/* ------VAT CALCULATIONS TABLE------------- */}
      <div className='calculations-table-block'>
      {vatCalculations.length === 0 ? (
        <p className='infoText' aria-live='polite'>NO SAVED VAT CALCULATIONS TO DISPLAY</p>
      ) : (
        <table className='calculations-table' role='table' aria-label={`${vatCalculations.length} saved VAT calculations`}>
          <thead>
            <tr>
              <th scope='col'>DATE SAVED</th>
              <th scope='col'>CALCULATION</th>
              <th scope='col'>VAT RATE</th>
              <th scope='col'>EXCL. VAT</th>
              <th scope='col'>VAT</th>
              <th scope='col'>INCL. VAT</th>
              <th scope='col'><span className='visually-hidden'>VIEW CALCULATION DETAILS</span></th>
            </tr>
          </thead>
          <tbody>
            {/* MAP EACH SAVED CALCULATION: selecting a row opens the details panal below */}
            {vatCalculations.map((calculation, index) => {
              const isSelected = String(calculation._id) === String(selectedId)
              return (
                <tr
                  key={calculation._id}
                  className={`${rowClass(index)}${isSelected ? ' selectedRow' : ''}`}
                  aria-selected={isSelected}
                >
                  <th scope='row'>{toLongDate(calculation.createdAt)}</th>
                  <td>{toVatModeLabel(calculation.mode)}</td>
                  <td>{toVatRate(calculation)}</td>
                  <td>{toRands(calculation.netAmount)}</td>
                  <td>{toRands(calculation.vatAmount)}</td>
                  <td>{toRands(calculation.grossAmount)}</td>
                  <td>
                    <Button
                      variant='light'
                      className='viewCalculationBtn'
                      type='button'
                      onClick={() => (isSelected ? closePanal() : selectItem(calculation._id))}
                      // ARIA ATTRIBUTES:
                      aria-label={`${isSelected ? 'Hide' : 'View'} details for the VAT calculation saved on ${toLongDate(calculation.createdAt)}`}
                      aria-pressed={isSelected}
                      aria-expanded={isSelected}
                      aria-controls='vat-calculation-details-panal'
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
          {`SHOWING THE NEWEST ${vatCalculations.length} OF ${vatCalculationsTotal} SAVED VAT CALCULATIONS`}
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
        aria-label={toggleExport ? 'Exit': 'Export VAT calculations'}
        aria-controls='vat-export-form-panal'
        aria-pressed={toggleExport}
        aria-expanded={toggleExport}
        >
          {toggleExport ? 'Exit': 'Export calculations'}
        </Button>
      </div>
      {toggleExport && (
        <div id='vat-export-form-panal'>
          <ExportForm type='vat'/>
        </div>
      )}

      {/* DETAILS PANAL IF A CALCULATION IS SELECTED ON THE TABLE LIST */}
      {selectedCalculation && (
      <div id='vat-calculation-details-panal' className='calculations-panal'>
        <Stack direction="horizontal" gap={3} className='calculations-panal-head'>
          <div className="p-2">
            {/* THE CALCULATION ITSELF: the VAT, and the amount it was worked out on */}
            <h5 className='calculations-panal-heading'>
              {`${toRands(selectedCalculation.vatAmount)} VAT ON ${toRands(enteredAmountOf(selectedCalculation))} AT ${toVatRate(selectedCalculation)}`}
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
            aria-label='Close VAT calculation details'
            aria-controls='vat-calculation-details-panal'
            ><X fontWeight={700} fontSize={16} aria-hidden='true' focusable='false'/>CLOSE</Button>
          </div>
        </Stack>
        <div className='calculations-panal-body'>
          <Stack gap={3} className='calculations-details-stack'>
            <div className="p-2">
              {/* AMOUNTS: the three figures that reconcile, and which was typed */}
              <div className='details-group'>
                <span><p className='nested-details-label'>AMOUNTS:</p></span>
                <div className='nested-details-group'>
                  <span className='nested-details-span'>
                    <p className='details-label'>AMOUNT ENTERED:</p>
                    <p className='details-value'>{toRands(enteredAmountOf(selectedCalculation))}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>AMOUNT EXCL. VAT:</p>
                    <p className='details-value'>{toRands(selectedCalculation.netAmount)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>VAT:</p>
                    <p className='details-value'>{toRands(selectedCalculation.vatAmount)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>AMOUNT INCL. VAT:</p>
                    <p className='details-value'>{toRands(selectedCalculation.grossAmount)}</p>
                  </span>
                </div>
              </div>
            </div>
          </Stack>
          <Stack gap={3} className='calculations-details-stack'>
            <div className="p-2">
              {/* CALCULATION: which way it ran, and at what rate */}
              <div className='details-group'>
                <span><p className='nested-details-label'>CALCULATION:</p></span>
                <div className='nested-details-group'>
                  <span className='nested-details-span'>
                    <p className='details-label'>DIRECTION:</p>
                    <p className='details-value'>{toVatMode(selectedCalculation.mode)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>VAT RATE:</p>
                    <p className='details-value'>{toVatRate(selectedCalculation)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>ZERO-RATED:</p>
                    <p className='details-value'>{selectedCalculation.isZeroRated ? 'YES' : 'NO'}</p>
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
              {/* SAVED: createdAt timestamp on the VAT schema */}
              <div className='details-group'>
                <span><p className='details-label'>SAVED:</p></span>
                <p className='details-value'>{toLongDateTime(selectedCalculation.createdAt)}</p>
              </div>
            </div>
            <div className="p-2">
              {/* LAST UPDATED: updatedAt timestamp on the VAT schema */}
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
            <h6>A ZERO-RATED SUPPLY IS STILL A TAXABLE SUPPLY, LEVIED AT 0%: IT IS NOT THE SAME AS AN EXEMPT SUPPLY</h6>
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
            aria-label={deleteLoading ? 'DELETING...' : 'delete VAT calculation'}
            >{deleteLoading ? 'DELETING...' : 'DELETE CALCULATION'}</Button>
          </div>
        </Stack>
      </div>
      )}
    </div>
  )
}
