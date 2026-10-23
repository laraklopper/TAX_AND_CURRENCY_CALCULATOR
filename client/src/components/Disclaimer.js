import React from 'react'
import Stack from 'react-bootstrap/Stack';
import { Link } from 'react-router-dom';

export default function Disclaimer() {
  return (
    <Stack direction="horizontal" gap={3} id='disclaimerStack'>
      <div className="p-2">
      <h5 className='paraHeading'>DISCLAIMER:</h5>
      </div>
      <div className="p-2" >
        <span className='textSpan'>
            <p className='textPara'>This tool is intended as a general estimation aid. It does not 
            replace professional tax or financial advice. Tax rates should be 
            reviewed and updated annually following the <strong>SARS</strong> Budget Speech, as figures are subject to change.</p>
        </span>
      </div>
      <div className="vr" />
      <div className="p-2 ms-auto">
        <Link href='https://www.sars.gov.za/' target='blank'>https://www.sars.gov.za/</Link>
      </div>
    </Stack>
  )
}
