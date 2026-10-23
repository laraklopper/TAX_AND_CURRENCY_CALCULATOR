import React from 'react'
import Stack from 'react-bootstrap/Stack';
import { Link } from 'react-router-dom';

export default function Disclaimer() {
  return (
    <Stack direction="horizontal" gap={3} id='disclaimerStack'>
      <div id='disclaimerTextBlock'>
      <span className='textSpan' aria-labelledby=''>
      <p id='disclaimer' className='visually-hidden'>DISCLAIMER:</p>
      <h5 id='headingNote'>NOTE:</h5>
        
            <p className='textPara'>This application is intended as a general estimation aid. It does not 
            replace professional tax or financial advice. Tax rates should be 
            reviewed and updated annually following the <strong>SARS</strong> Budget Speech, as figures are subject to change.</p>
        </span>
      
      </div>
      <div  className="p-2 ms-auto">
        
      </div>
      <div className="vr" style={{margin: '5px 0px'}}/>
      <div className="p-2 ms-auto" id='sarsWebLinkBlock'>
        <Link id='webLink' href='https://www.sars.gov.za/' target='blank'>https://www.sars.gov.za/</Link>
      </div>
    </Stack>
  )
}
