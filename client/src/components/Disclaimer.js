import React from 'react'
import Stack from 'react-bootstrap/Stack';
import { Link } from 'react-router-dom';

export default function Disclaimer() {
  return (
    <Stack gap={3} id='disclaimerStack'>
      <div id='disclaimerTextBlock'>
      <h5 id='headingNote'>NOTE:</h5>
      <span className='textSpan' id='disclaimerSpan' aria-labelledby='disclaimer'>
        <p id='disclaimer' className='visually-hidden'>DISCLAIMER:</p>
            <p className='textPara'>This application is intended as a general estimation aid.
             It does not  replace professional tax or financial advice.</p>
             <p className='textPara'> Tax rates should be 
            reviewed and updated annually following the <strong>SARS</strong> Budget Speech, as figures are subject to change.</p>
        </span>
      </div>
      <div className="p-2" id='sarsWebLinkBlock'>
        <label className='webLinkLabel'>VISIT SARS:</label>
        <Link id='webLink' href='https://www.sars.gov.za/' target='blank'>https://www.sars.gov.za/</Link>
      </div>
    </Stack>
  )
}
