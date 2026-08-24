// ExportForm.js
import React, { useState } from 'react'
import '../css/componentCss/ExportForm.css'
import '../css/componentCss/FormSetup.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button'


// Export form to export currency, tax and interest calculations
// Use single form for all exports
export default function ExportForm() {
    const [format, setFormat] = useState() // selected file format ('csv' or 'xlsx')
    const [error, setError] = useState(null)// State to store any error messages that should be displayed to the user.
   // Tracks whether the download request is currently running.
    const [loading, setLoading] = useState(false)// State Used to disable the button and show loading text.

    return (
    <form aria-labelledby='formTitle'>
        <p className='visually-hidden' id='formTitle'>
            {/* EXPORT TITLE: e.g Export Currency calculations */}
        </p>
        <Stack direction="horizontal" gap={3} id='export-form-stack'>
      <div className="p-2">
        {/* Select export format */}
                    <label className='exportLabel' htmlFor='exportFormatSelect'>CHOOSE EXPORT FORMAT:</label>
                        <select
                        className='exportSelect'
                        required
                        id='exportFormatSelect'
                        // name=''
                        // value={}
                        // onChange={(e) => { setFormat(e.target.value); setError('') }}//Update selected format
                        // ARIA ATTRIBUTES:
                        aria-label='Export format'
                        aria-required='true'
                    >
                    {/* SET SELECT AS PLACEHOLDER */}
                        <option value=''>SELECT</option>
                        <option value='csv'>CSV (.csv)</option>
                        <option value='xlsx'>EXCEL (.xlsx)</option>
                    </select>
      </div>
      {/* ==========ERROR MESSAGE================ */}
      {error && (
        <div id='exportErrorBlock' role='alert' aria-live='polite' className="p-2 ms-auto">
            <p className='export-error'>{error}</p>
        </div>
        )}
      <div className="vr" />
      <div className="p-2">
        <Button variant='light'>EXPORT</Button>
      </div>
    </Stack>

    </form>
  )
}
