import React from 'react'
import '../css/componentCss/TaxForm.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { 
  // Plus, 
  // Trash2, 
  Save, 
  RotateCcw, 
  // CheckCircle2, 
  // AlertCircle 
} from "lucide-react";

export default function AddTaxDataForm() {
  return (
    <div id='tax-form-block'>
        <h3 id='formHeading'>TAX YEAR CONFIGURATION</h3>
        <form id='add-tax-data-form'>
        {/* INPUT */}
            <div id='tax-form-input-detail'>
            {/* GROUP 1: TAX YEAR */}
              <div id='taxform-group1' aria-labelledby='taxYearHead'>
                <span><h6 className='formSectionHead' id='taxYearHead'>TAX YEAR</h6></span>
                <Stack gap={3}>
      <div className="p-2">
       <label className='tax-form-label'>YEAR:</label>
        <div className='tax-input-div'>
                
                 
                  <input
                    className='taxdata-input'
                    

                  />
                </div>
      </div>
      <div className="p-2">
      <label className='tax-form-label'>START DATE:</label>
         <div className='tax-input-div'>
                
                 
                  <input
                    className='taxdata-input'

                  />
                </div>
      </div>
      <div className="p-2">
      <label className='tax-form-label'>END DATE:</label>
          <div className='tax-input-div'>
                
                 
                  <input
                    className='taxdata-input'

                  />
                </div>
      </div>
    </Stack>
                
               

              </div>
              {/* GROUP 2 */}
              <div id='taxform-group2'>
                <span><h6 className='formSectionHead' id='incomeTaxBrackets'>Income Tax Brackets</h6></span>
                <div>
                  <span>Min (R)</span>
              <span>Max (R) — blank = no ceiling</span>
              <span>Base amount (R)</span>
              <span>Rate (%)</span>
                </div>
              </div>

            </div>
            <div>
            <Stack direction="horizontal" gap={3}>
      <div className="p-2">First item</div>
      <div className="p-2 ms-auto">
        <Button variant='light' id='submitTaxDataBtn'><Save/>CREATE TAX YEAR</Button>
      </div>
      <div className="p-2">
        <Button variant='danger' id='clearFormBtn'><RotateCcw/>RESET FORM</Button>
      </div>
    </Stack>
              
              
            </div>
        </form>
    </div>
  )
}
