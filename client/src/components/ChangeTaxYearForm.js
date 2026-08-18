import React from 'react'
import '../css/componentCss/EditTaxForm.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { SaveCheck } from 'lucide-react';
export default function ChangeTaxYearForm() {
  return (
    <form id='change-tax-year-form' method='PUT' aria-describedby='formTitle'>
    {/* ----------Screen Reader Heading---------------- */}
        <p className='visually-hidden' id='formTitle'>EDIT TAX YEAR FORM</p>
             <Stack gap={3} id='edit-tax-year-stack'>
                  <div className="p-2" id='edit-year-block'>
                    <label className='edit-taxyear-label' htmlFor='edit-taxyear-input'>CHANGE TAX YEAR:</label>
                    <input
                      id='edit-taxyear-input'
                    //   required //required if the form is submitted
                      autoComplete='year'
                      placeholder='TAX YEAR'//CURRENT TAX YEAR AS DISPLAYED IN THE HEADING
                    //   name=''
                    // value={}
                    // onChange={}
                    // ARIA ATTRIBUTES:
                    aria-label=''
                    />
                  </div>
                  <div className="p-2" id='edit-year-block2'>
                    <Button
                    variant='warning'
                    size='sm'
                    id='saveTaxYearBtn'
                    type='submit'
                    // ARIA ATTRIBUTES:
                    >
                        <SaveCheck fontSize={32} fontWeight={700} aria-hidden='true' focusable='false'/>
                    </Button>
                  </div>
              </Stack>
       
    </form>
  )
}
