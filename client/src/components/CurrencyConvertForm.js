import React, { useState } from 'react'
import '../css/componentCss/FormSetup.css'
import '../css/componentCss/CurrencyConverter.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Asterisk } from 'lucide-react';

// Default values used when the form is first loaded or reset
const EMPTY_FORM = {
    amount: '',
    from: '',
    to: ''
};
export default function CurrencyConvertForm() {
   // ================STATE VARIABLES===================
    const [form, setForm] = useState(EMPTY_FORM); // Stores the user's form inputs
    const [result, setResult] = useState(null);// Stores the conversion returned by the API
    const [loading, setLoading] = useState(false);// Indicates whether an API request is currently running
    const [error, setError] = useState('');// Stores any error messages shown to the user
  return (
    <form>
        <div id='formHeadingBlock'>
            <h3 id='formHeading'>CURRENCY CONVERTER</h3>
        </div>
        <div id='converter-details-input'>
            <Stack gap={3} id='converterStack1'>
      <div className="p-2" id='converterAmountBlock'>
        <label className='converterLabel' htmlFor='converterAmount'>AMOUNT</label>
        <div className='input-div'>
            <input
                className='input'
                id='converterAmount'
                // name=''
                // value={}
                
            />
            <small><Asterisk color='#C22419' fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      <div className="p-2">
      <label className='converterLabel' htmlFor='converterFrom'>CONVERT FROM:</label>
        <div className='input-div'>
            <select
             className='input'
                id='converterFrom'
                required
                // name=''
                // value={}
                // onChange={}
                // ARIA ATTRIBUTES:
                aria-required= 'true'
                aria-label='convert from currency'>
                    <option value=''>SELECT</option>
                    {/* MAP ALL AVAILABLE CURRENCIES WITH SELECT AS THE PLACEHOLDER */}
                </select>
                <small><Asterisk color='#C22419' fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      <div className="p-2">
        <label className='converterLabel'>CONVERT TO:</label>
        <div>
            <select
                 className='input'
                 id='converterTo'
                required
                // name=''
                //    value={}
                // onChange={}
                //ARIA ATTRIBUTES:
                aria-label='Convert to currency'
                aria-required='true'
            >
               <option value=''>SELECT</option>
                    {/* MAP ALL AVAILABLE CURRENCIES WITH SELECT AS THE PLACEHOLDER */}
                </select>
                <small><Asterisk color='#C22419' fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
    </Stack>
        </div>
        <Stack gap={3}>
      <div className="p-2">
        <Button
                            variant='light'
                            id='submitConvertBtn'
                            type='submit'
                            disabled={loading}
                            // ARIA ATTRIBUTES:
                            role='button'
                            aria-label={loading ? 'CONVERTING...' : 'CONVERT'}
                            aria-disabled={loading}
                        >
                            {loading ? 'CONVERTING...' : 'CONVERT'}
                        </Button>
      </div>
      <div className="p-2">
        <Button
                            variant='danger'
                            id='clearFormBtn'
                            type='button'
                            // onClick={handleClear}
                            // ARIA ATTRIBUTES:
                            aria-label='Clear currency converter form'
                            aria-disabled={loading}
                        >
                            CLEAR FORM
                        </Button>
      </div>
      <div className="p-2" id='converterResultBlock'>
        {/* Only display the Result after form submission */}
      </div>
        {/* ========ERROR MESSAGE==================== */}
        {error && (
            <p className='infoText' style={{ color: '#C22419' }} role='alert' aria-live='assertive'>{error}</p>
        )}
    </Stack>
    </form>
  )
}
