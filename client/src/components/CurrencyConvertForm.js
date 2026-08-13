import React from 'react'
import '../css/componentCss/FormSetup.css'
import '../css/componentCss/CurrencyConverter.css'
import Stack from 'react-bootstrap/Stack';
import { Asterisk } from 'lucide-react';

export default function CurrencyConvertForm() {
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
    </form>
  )
}
