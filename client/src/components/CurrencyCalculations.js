//CurrencyCalculations.js
// The logged in user's saved currency conversions, listed newest first, and a
// details panal showing the full record of the conversion selected on the table.
//
// The figures are shown exactly as they were stored: each record carries the
// rate its save fetched, so an old conversion is never repriced at today's rate.
// `convertedAmount` is a virtual on the currency schema, recomputed here from
// amount * rate only if a record arrives without it.
import React, { useCallback, useEffect, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentCss/CalculationsList.css'
import '../css/componentCss/DetailsPanal.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// ===========HELPER FUNCTIONS===========
// Shown in place of any detail a record does not carry
const NOT_AVAILABLE = 'NOT AVAILABLE'

// Format an ISO date string as e.g. 01 March 2025
const toLongDate = (value) => {
  if (!value) return NOT_AVAILABLE
  const date = new Date(value)
  if (isNaN(date.getTime())) return NOT_AVAILABLE
  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

// Format an ISO date string as e.g. 01 March 2025, 14:30
const toLongDateTime = (value) => {
  if (!value) return NOT_AVAILABLE
  const date = new Date(value)
  if (isNaN(date.getTime())) return NOT_AVAILABLE
  return `${toLongDate(value)}, ${date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}`
}

// Join the first and last name, tolerating a missing half
const toFullName = (fullName) => {
  const name = [fullName?.firstName, fullName?.lastName].filter(Boolean).join(' ')
  return name || NOT_AVAILABLE
}

/* Format an amount in its own currency, e.g. 1 500,00 ZAR. The code is a
3-letter code off the record, so it is handed to Intl rather than looked up in a
symbol table of our own; a record missing its code still shows its figure. */
const toMoney = (value, code) => {
  if (typeof value !== 'number' || isNaN(value)) return NOT_AVAILABLE
  if (!code) return value.toFixed(2)
  try {
    return value.toLocaleString('en-ZA', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'code',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  } catch (error) {
    // An unusable currency code should not cost the user the figure itself
    return `${code} ${value.toFixed(2)}`
  }
}

/* Format an exchange rate. Rates are quoted to far more than 2 decimals, and
rounding one to currency precision would show a weak pair as 0.00, so a rate is
shown to 6 decimals and labelled with the pair it prices. */
const toRate = (rate, baseCurrency, targetCurrency) => {
  if (typeof rate !== 'number' || isNaN(rate)) return NOT_AVAILABLE
  const formatted = rate.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 6 })
  if (!baseCurrency || !targetCurrency) return formatted
  return `${formatted} ${targetCurrency} PER 1 ${baseCurrency}`
}

/* The converted amount as stored. The schema exposes it as a virtual, so it
arrives on the record; it is recomputed from amount * rate only as a fallback. */
const convertedAmountOf = (conversion) => {
  if (typeof conversion?.convertedAmount === 'number') return conversion.convertedAmount
  if (typeof conversion?.amount === 'number' && typeof conversion?.rate === 'number') {
    return conversion.amount * conversion.rate
  }
  return null
}

// Row striping: STYLES.md 1.5. TABLES
const rowClass = (index) => (index % 2 === 0 ? 'evenRow' : 'oddRow')

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
    // ========STATE VARIABLES=====================
    /* The _id of the conversion selected on the table: the details panal is
    only rendered once a conversion has been selected */
    const [selectConversionId, setSelectConversionId] = useState(null)
    // Inline feedback shown above the table: {type: 'error' | 'success', text: string}
    const [status, setStatus] = useState(null)
    const [deleteLoading, setDeleteLoading] = useState(false)

  /* Load the saved conversions once the panel is shown. Guarded on `loggedIn`
  because the history is scoped to the token: without one there is nothing to
  fetch. */
  useEffect(() => {
    if (loggedIn) {
      fetchConversions()
    }
  },[fetchConversions, loggedIn])

    /* The full record of the selected conversion, looked up on every render so
    the panal always shows the latest details held in the conversions list */
    const selectedConversion = conversions.find(conversion => String(conversion._id) === String(selectConversionId)) || null

    /* True when the user has more saved conversions than GET /api/history
    returns, so the list can say so rather than looking complete */
    const isTruncated = conversionsTotal > conversions.length

    // ======HANDLERS/REQUESTS===========
    // Open the details panal for the conversion selected on the table
    const selectConversion = (id) => {
      setSelectConversionId(id)
      setStatus(null)// Clear feedback left over from the previously selected conversion
    }

    // Close the details panal
    const closeConversionPanal = () => {
      setSelectConversionId(null)
      setStatus(null)
    }

    /* DELETE /api/history/:id: remove the selected conversion. The parent owns
    the request and throws on failure, so the message is reported here, beside
    the button the user pressed. */
    const removeConversion = useCallback(async () => {
      //Conditional rendering to check a conversion is selected
      if (!selectedConversion) return;

      const confirmDelete = window.confirm(
        'Are you sure you want to delete this saved conversion? This cannot be undone.'
      )

      if (!confirmDelete) return;// Exit the function early if the user cancels

      setDeleteLoading(true)//Set the loading state while the request is in flight
      setStatus(null)// Clear feedback from the previous attempt
      try {
        await deleteConversion?.(selectedConversion._id)
        /* The parent has already dropped the record from the list, so the panal
        is closed and the outcome reported above the table instead */
        setSelectConversionId(null)
        setStatus({ type: 'success', text: 'CONVERSION REMOVED FROM YOUR HISTORY' })
        setError?.('')//Clear any previous error messages
      } catch (error) {
        const msg = error?.message || 'An error occurred while removing the conversion.';// Default error message
        setStatus({ type: 'error', text: msg })// Show the message above the table
        setError?.(msg)// Set the error state to display the error in the UI
        console.error('[ERROR: CurrencyCalculations.js, removeConversion]', msg);//Log an error message in the console for debugging purposes
      } finally {
        setDeleteLoading(false)//Set Loading state to false
      }
    }, [selectedConversion, deleteConversion, setError])
    //=============JSX RENDERING===============
  return (
    <div id='conversions-list' className='calculations-list'>
      {/* Display conversion calculations list in table format
      with a details panal displayed after clicking on the conversion*/}

      {/* Inline request feedback, announced to screen readers */}
      {status && (
        <div className='calculations-status'>
          <p
            className='msgText'
            role={status.type === 'error' ? 'alert' : 'status'}
            aria-live={status.type === 'error' ? 'assertive' : 'polite'}
            style={{ color: status.type === 'error' ? '#C22419' : '#1B6E2F' }}
          >
            {status.text}
          </p>
        </div>
      )}

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
              const isSelected = String(conversion._id) === String(selectConversionId)
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
                  <td>{typeof conversion.rate === 'number' ? conversion.rate.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : NOT_AVAILABLE}</td>
                  <td>{toMoney(convertedAmountOf(conversion), targetCurrency)}</td>
                  <td>
                    <Button
                      variant='light'
                      className='viewCalculationBtn'
                      type='button'
                      onClick={() => (isSelected ? closeConversionPanal() : selectConversion(conversion._id))}
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
            variant='light'
            className='closeCalculationPanalBtn'
            type='button'
            onClick={closeConversionPanal}
            // ARIA ATTRIBUTES:
            aria-label='Close conversion details'
            aria-controls='conversion-details-panal'
            >CLOSE</Button>
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
            className='deleteCalculationBtn'
            type='button'
            onClick={removeConversion}
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
