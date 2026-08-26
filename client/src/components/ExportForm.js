// ExportForm.js
/* The export form shown under each saved-calculation list
(CurrencyCalculations.js, TaxCalculations.js, ProvisionalTaxCalculations.js,
VatCalculations.js, InterestCalculations.js).

One form serves them all: the `type` prop decides which export endpoint the
request goes to and what the file is called, so the lists cannot drift apart on
how a download is asked for or reported.

The response is a FILE, not JSON, so it is read as a blob and handed to a
temporary anchor to trigger the browser's download. Only a failure comes back as
JSON, and the API's own message is what gets shown beside the button. The
filename is rebuilt here rather than read from the response's
Content-Disposition header: the API is a different origin, so that header is not
readable from the browser unless the server explicitly exposes it. */
import React, { useState } from 'react'
import '../css/componentCss/ExportForm.css'
import '../css/componentCss/FormSetup.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button'

// Base URL of the API the export requests are sent to
const API_BASE_URL = 'http://localhost:3001';

/* What each `type` exports: the route on the API, the name given to the
downloaded file and how the data is described to the user. Keyed by the `type`
prop so a list only has to name its own data. */
const EXPORTS = {
  interest: {
    endpoint: '/export/interestHistory',
    filename: 'interest-calculations',
    label: 'INTEREST CALCULATIONS'
  },
  tax: {
    endpoint: '/export/taxHistory',
    filename: 'tax-calculations',
    label: 'TAX CALCULATIONS'
  },
  provisional: {
    endpoint: '/export/provisionalHistory',
    filename: 'provisional-tax-calculations',
    label: 'PROVISIONAL TAX CALCULATIONS'
  },
  vat: {
    endpoint: '/export/vatHistory',
    filename: 'vat-calculations',
    label: 'VAT CALCULATIONS'
  },
  currency: {
    endpoint: '/export/currencyHistory',
    filename: 'currency-conversions',
    label: 'CURRENCY CONVERSIONS'
  }
}

// Export form to export currency, tax and interest calculations
// Use single form for all exports
export default function ExportForm({ type }) {
    const [format, setFormat] = useState('') // selected file format ('csv' or 'xlsx')
    const [error, setError] = useState(null)// State to store any error messages that should be displayed to the user.
    const [notice, setNotice] = useState(null)// State to confirm a download once the file has been handed to the browser.
   // Tracks whether the download request is currently running.
    const [loading, setLoading] = useState(false)// State Used to disable the button and show loading text.

    /* The export this form is for. An unrecognised `type` is a mistake in the
    component that rendered the form, not something the user can act on, so it
    is reported once rather than being sent to the API as a bad URL. */
    const exportConfig = EXPORTS[type]

    //================EVENT LISTENERS========================
    /* Requests the file and hands it to the browser as a download. The token is
    attached because the export is scoped to the logged in user: the API reads
    the user off the JWT, so a request without one returns nothing to export. */
    const submitExport = async (event) => {
      event.preventDefault()// Stop the browser reloading the page on submit
      setError(null)// Clear feedback from the previous attempt
      setNotice(null)

      // Conditional rendering to check a format was chosen
      if (!format) {
        setError('SELECT A FILE FORMAT TO EXPORT TO')
        return;// Exit the function early: there is nothing to request yet
      }

      setLoading(true)//Set the loading state while the request is in flight
      try {
        const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
        const response = await fetch(`${API_BASE_URL}${exportConfig.endpoint}?format=${format}`, {
          method: 'GET',//HTTP request method
          mode: 'cors',//Enable Cross-Origin Resource Sharing
          headers: {
            'Authorization': `Bearer ${token}`// Attach the token in the Authorization header
          }
        })

        /* Conditional rendering to check the request succeeded. Only a failure
        answers with JSON, so the body is read as JSON here and as a file below. */
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));// Safely parse the JSON response (avoid crash if server returns non-JSON)
          const message = data.message || 'The export could not be generated. Please try again.';
          console.error(`[ERROR: ExportForm.js, GET ${exportConfig.endpoint}]`, message);//Log an error message in the console for debugging purposes
          setError(message.toUpperCase())// Show the API's own reason beside the button
          return;
        }

        const blob = await response.blob();// The file itself
        // Named the same way the API names it: <data>-<YYYY-MM-DD>.<format>
        const [today] = new Date().toISOString().split('T');
        const filename = `${exportConfig.filename}-${today}.${format}`;

        /* Handed to a temporary anchor: a blob has no address of its own, so it
        is given one, clicked, and the address released again once the browser
        has taken the file. */
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename// Downloads the file instead of navigating to it
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)// Release the blob, which would otherwise be held until the page is left

        console.log(`[SUCCESS: ExportForm.js, GET ${exportConfig.endpoint}] Downloaded ${filename}`);//Log a success message in the console for debugging purposes
        setNotice(`${filename.toUpperCase()} DOWNLOADED`)
      } catch (error) {
        // A network failure never reaches the API, so there is no message to show but our own
        console.error(`[ERROR: ExportForm.js, GET ${exportConfig?.endpoint}]`, error.message);//Log an error message in the console for debugging purposes
        setError('THE EXPORT COULD NOT BE DOWNLOADED. PLEASE CHECK YOUR CONNECTION AND TRY AGAIN.')
      } finally {
        setLoading(false)//Set Loading state to false
      }
    }

    //=============JSX RENDERING===============
    /* Conditional rendering to check the form was given data it can export:
    without it there is no endpoint to send the user to */
    if (!exportConfig) {
      console.error('[ERROR: ExportForm.js] Unknown export type:', type);//Log an error message in the console for debugging purposes
      return (
        <p className='export-error' role='alert'>THIS DATA CANNOT BE EXPORTED</p>
      )
    }

    return (
    <form aria-labelledby='formTitle' onSubmit={submitExport}>
        <p className='visually-hidden' id='formTitle'>
            {/* EXPORT TITLE: e.g Export Currency calculations */}
            {`EXPORT ${exportConfig.label}`}
        </p>
        <Stack direction="horizontal" gap={3} id='export-form-stack'>
      <div className="p-2">
        {/* Select export format */}
                    <label className='exportLabel' htmlFor='exportFormatSelect'>CHOOSE EXPORT FORMAT:</label>
                        <select
                        className='exportSelect'
                        required
                        id='exportFormatSelect'
                        name='format'
                        value={format}
                        onChange={(e) => { setFormat(e.target.value); setError(''); setNotice(null) }}//Update selected format
                        disabled={loading}
                        // ARIA ATTRIBUTES:
                        aria-label='Export format'
                        aria-required='true'
                        aria-invalid={Boolean(error)}
                        aria-describedby={error || notice ? 'exportStatusBlock' : undefined}
                    >
                    {/* SET SELECT AS PLACEHOLDER */}
                        <option value=''>SELECT</option>
                        <option value='csv'>CSV (.csv)</option>
                        <option value='xlsx'>EXCEL (.xlsx)</option>
                    </select>
      </div>
      {/* ==========ERROR/CONFIRMATION MESSAGE================
      A failure is an assertive alert, because the user pressed a button and
      needs to know it did not work; a completed download is a polite status. */}
      {(error || notice) && (
        <div
        id='exportStatusBlock'
        className="p-2 ms-auto"
        // ARIA ATTRIBUTES:
        role={error ? 'alert' : 'status'}
        aria-live={error ? 'assertive' : 'polite'}
        >
            <p className={error ? 'export-error' : 'export-notice'}>{error || notice}</p>
        </div>
        )}
      <div className="vr" />
      <div className="p-2">
        <Button
        variant='light'
        type='submit'
        id='exportBtn'
        disabled={loading}
        // ARIA ATTRIBUTES:
        aria-disabled={loading}
        aria-label={loading ? 'EXPORTING...' : `Export ${exportConfig.label.toLowerCase()}`}
        >{loading ? 'EXPORTING...' : 'EXPORT'}</Button>
      </div>
    </Stack>

    </form>
  )
}
