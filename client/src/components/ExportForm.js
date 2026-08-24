// ExportForm.js
import React, { useState } from 'react'
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
      <div className="p-2">First item</div>
      <div className="p-2 ms-auto">Second item</div>
      <div className="p-2">Third item</div>
    </Stack>

    </form>
  )
}
