import React from 'react'
import Stack from 'react-bootstrap/Stack';
export default function TaxConcepts() {
  return (
    <div id='tax-concept-info'>
     <Stack gap={3}>
      <div className="p-2" id='tax-concept-block1'>
        <h5 className='tax-concept-head'>INCOME TAX BRACKET</h5>
        <div className='tax-concept-div'>
            <p className='concept-para'>{/* EXPLAIN INCOME TAX BRACKETS */}</p>
        </div>
      </div>
      <div className="p-2" id='tax-concept-block2'>
        <h5 className='tax-concept-head'>REBATES</h5>
        <div className='tax-concept-div'>
            <p className='concept-para'>{/*EXPLAIN REBATES */}</p>
        </div>
      </div>
      <div className="p-2" id='tax-concept-block3'>
        <h5 className='tax-concept-head'>TAX THRESHOLDS</h5>
        <div className='tax-concept-div'>
    <p className='concept-para'>{/* EXPLAIN TAX THRESHOLDS */}</p>
</div>
      </div>
    </Stack>
    </div>
  )
}

