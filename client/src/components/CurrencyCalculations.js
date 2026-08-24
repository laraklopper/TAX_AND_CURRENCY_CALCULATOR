//CurrencyCalculations.js
// The logged in user's saved currency conversions, listed newest first, and a
// details panal showing the full record of the conversion selected on the table.
//
// The figures are shown exactly as they were stored: each record carries the
// rate its save fetched, so an old conversion is never repriced at today's rate.
// `convertedAmount` is a virtual on the currency schema, recomputed here from
// amount * rate only if a record arrives without it.
//
// The table/panal behaviour is shared with the tax and interest lists through
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
import { NOT_AVAILABLE, rowClass, toDecimal, toFullName, toLongDate, toLongDateTime, toMoney } from '../utils/formatCalculations';
import { convertedAmountOf, toRate } from '../utils/currencyFunc';
import { X } from 'lucide-react';
//CurrencyCalculations.js function component
export default function CurrencyCalculations(
  {//PROPS PASSED FROM PARENT COMPONENT(CurrencyConverter.js)
    fetchConversions,
    loggedIn,
    conversions = [],
    conversionsTotal = 0,
    deleteConversion,
    setError
  }) {
    /* Loading, selection, delete and status handling, shared with the tax and
    interest calculation lists */
    const {
      selectedId,
      selected: selectedConversion,
      status,
      deleteLoading,
      isTruncated,
      selectItem,
      closePanal,
      removeSelected
    } = useCalculationsList({
      items: conversions,
      total: conversionsTotal,
      loggedIn,
      fetchItems: fetchConversions,
      deleteItem: deleteConversion,
      confirmMessage: 'Are you sure you want to delete this saved conversion? This cannot be undone.',
      successMessage: 'CONVERSION REMOVED FROM YOUR HISTORY',
      setError,
      logLabel: 'CurrencyCalculations.js'
    })
    //=============JSX RENDERING===============
  return (
    <div id='conversions-list' className='calculations-list'>
      {/* Display conversion calculations list in table format
      with a details panal displayed after clicking on the conversion*/}

      {/* Inline request feedback, announced to screen readers */}
      <CalculationsStatus status={status}/>

      {/* ------CONVERSION CALCULATIONS TABLE------------- */}
      <div className='calculations-table-block'>
      {conversions.length === 0 ? (
        <p className='infoText' aria-live='polite'>NO SAVED CONVERSION CALCULATIONS TO DISPLAY</p>
      ) : (
        <table className='calculations-table' role='table' aria-label={`${conversions.length} saved currency conversions`}>
          <thead>
            <tr>
              <th scope='col'>DATE SAVED</th>
              <th scope='col'>AMOUNT</th>
              <th scope='col'>FROM</th>
              <th scope='col'>TO</th>
              <th scope='col'>RATE</th>
              <th scope='col'>CONVERTED AMOUNT</th>
              <th scope='col'><span className='visually-hidden'>VIEW CONVERSION DETAILS</span></th>
            </tr>
          </thead>
          <tbody>
            {/* MAP EACH SAVED CONVERSION: selecting a row opens the details panal below */}
            {conversions.map((conversion, index) => {
              const isSelected = String(conversion._id) === String(selectedId)
              const baseCurrency = conversion.currency?.baseCurrency
              const targetCurrency = conversion.currency?.targetCurrency
              return (
                <tr
                  key={conversion._id}
                  className={`${rowClass(index)}${isSelected ? ' selectedRow' : ''}`}
                  aria-selected={isSelected}
                >
                  <th scope='row'>{toLongDate(conversion.createdAt)}</th>
                  <td>{toMoney(conversion.amount, baseCurrency)}</td>
                  <td>{baseCurrency || NOT_AVAILABLE}</td>
                  <td>{targetCurrency || NOT_AVAILABLE}</td>
                  <td>{toDecimal(conversion.rate, 6)}</td>
                  <td>{toMoney(convertedAmountOf(conversion), targetCurrency)}</td>
                  <td>
                    <Button
                      variant='light'
                      className='viewCalculationBtn'
                      type='button'
                      onClick={() => (isSelected ? closePanal() : selectItem(conversion._id))}
                      // ARIA ATTRIBUTES:
                      aria-label={`${isSelected ? 'Hide' : 'View'} details for the conversion saved on ${toLongDate(conversion.createdAt)}`}
                      aria-pressed={isSelected}
                      aria-expanded={isSelected}
                      aria-controls='conversion-details-panal'
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
          {`SHOWING THE NEWEST ${conversions.length} OF ${conversionsTotal} SAVED CONVERSIONS`}
        </p>
      )}
      </div>

      {/* DETAILS PANAL IF A CONVERSION IS SELECTED ON THE TABLE LIST */}
      {selectedConversion && (
      <div id='conversion-details-panal' className='calculations-panal'>
        <Stack direction="horizontal" gap={3} className='calculations-panal-head'>
          <div className="p-2">
            {/* THE CONVERSION ITSELF: base code to target code */}
            <h5 className='calculations-panal-heading'>
              {`${selectedConversion.currency?.baseCurrency || '???'} TO ${selectedConversion.currency?.targetCurrency || '???'}`}
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
            aria-label='Close conversion details'
            aria-controls='conversion-details-panal'
            ><X fontWeight={700} fontSize={16} aria-hidden='true' focusable='false'/>CLOSE</Button>
          </div>
        </Stack>
        <div className='calculations-panal-body'>
          <Stack gap={3} className='calculations-details-stack'>
            <div className="p-2">
              {/* CONVERSION: amount, rate and converted amount */}
              <div className='details-group'>
                <span><p className='nested-details-label'>CONVERSION:</p></span>
                <div className='nested-details-group'>
                  <span className='nested-details-span'>
                    <p className='details-label'>AMOUNT:</p>
                    <p className='details-value'>{toMoney(selectedConversion.amount, selectedConversion.currency?.baseCurrency)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>EXCHANGE RATE:</p>
                    <p className='details-value'>{toRate(selectedConversion.rate, selectedConversion.currency?.baseCurrency, selectedConversion.currency?.targetCurrency)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>CONVERTED AMOUNT:</p>
                    <p className='details-value'>{toMoney(convertedAmountOf(selectedConversion), selectedConversion.currency?.targetCurrency)}</p>
                  </span>
                </div>
              </div>
            </div>
            <div className="p-2">
              {/* CURRENCIES: the pair the conversion was priced in */}
              <div className='details-group'>
                <span><p className='nested-details-label'>CURRENCIES:</p></span>
                <div className='nested-details-group'>
                  <span className='nested-details-span'>
                    <p className='details-label'>BASE CURRENCY:</p>
                    <p className='details-value'>{selectedConversion.currency?.baseCurrency || NOT_AVAILABLE}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>TARGET CURRENCY:</p>
                    <p className='details-value'>{selectedConversion.currency?.targetCurrency || NOT_AVAILABLE}</p>
                  </span>
                </div>
              </div>
            </div>
          </Stack>
          <Stack gap={3} className='calculations-details-stack'>
            <div className="p-2">
              {/* SAVED BY: the fullName stored on the record */}
              <div className='details-group'>
                <span><p className='details-label'>SAVED BY:</p></span>
                <p className='details-value'>{toFullName(selectedConversion.fullName)}</p>
              </div>
            </div>
            <div className="p-2">
              {/* SAVED: createdAt timestamp on the currency schema */}
              <div className='details-group'>
                <span><p className='details-label'>SAVED:</p></span>
                <p className='details-value'>{toLongDateTime(selectedConversion.createdAt)}</p>
              </div>
            </div>
            <div className="p-2">
              {/* LAST UPDATED: updatedAt timestamp on the currency schema */}
              <div className='details-group'>
                <span><p className='details-label'>LAST UPDATED:</p></span>
                <p className='details-value'>{toLongDateTime(selectedConversion.updatedAt)}</p>
              </div>
            </div>
          </Stack>
        </div>
        {/* PANAL FOOTER: delete the saved conversion */}
        <Stack direction="horizontal" gap={3} className='calculations-panal-footer'>
          <div className="p-2">
            <h6>THE RATE SHOWN IS THE RATE THIS CONVERSION WAS SAVED AT</h6>
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
            aria-label={deleteLoading ? 'DELETING...' : 'delete conversion'}
            >{deleteLoading ? 'DELETING...' : 'DELETE CONVERSION'}</Button>
          </div>
        </Stack>
      </div>
      )}
    </div>
  )
}
