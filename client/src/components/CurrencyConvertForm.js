// CurrencyConvertForm.js
import React from 'react'
import '../css/componentCss/FormSetup.css'
import '../css/componentCss/CurrencyConverter.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Asterisk } from 'lucide-react';

/* `currencyOptions` is the list of { code, name, symbol } the page loaded from
GET /api/currencies, which reports what Frankfurter supports. The dropdowns are
built from it rather than from a local array, so the codes on offer are always
codes the converter can actually price. */
export default function CurrencyConvertForm(
    {
        submitConvert,
        EMPTY_FORM, 
        currencyOptions = [], 
        loading, 
        setLoading, 
        error, 
        setError, 
        result, 
        setResult, 
        form, 
        setForm
    }) {
      //===========EVENT LISTENERS===============
    //Function to handle inputChanges in the form
    const handleChange = (e) => {
        const { name, value } = e.target;// Extract the name and current value of the input that triggered the event.
        /* Update only the field that changed while keeping
        the existing values for the other form fields.*/
        setForm(prev => ({
            ...prev,          // Copy the existing form values
            [name]: value     // Update the matching field dynamically
        }));
        /*Clear any previous conversion result because the user
        has changed the input values and a new conversion is needed. */
        setResult(null);
        setError('');// Remove any previous error message once the user begins editing.
    };
    //Function to clear the form
    const handleClear = () => {
        setForm(EMPTY_FORM);// Reset all form inputs (amount, from, and to) to their default values.
        setResult(null);// Remove the previous conversion result from the screen.

        setError('');// Clear any displayed error messages.
    };

    // Function to submit currency converter form
    const handleConvert = (event) =>{
        event.preventDefault()
        submitConvert()
    }

    //==============JSX RENDERING===================
    return (
    <form id='currency-converter-form' method='GET' aria-labelledby='formHeading' onSubmit={handleConvert} aria-busy={loading} >
        <div id='formHeadingBlock'>
            <h3 id='formHeading'>CURRENCY CONVERTER</h3>
        </div>
        {/* CONVERTER INPUT */}
        <div id='converter-details-input'>
        {/* STACK 1 */}
            <Stack gap={3} id='converterStack1'>
            {/* Converter amount */}
      <div className="p-2" id='converterAmountBlock'>
        <label className='converterLabel' htmlFor='converterAmount'>AMOUNT</label>
        <div className='input-div'>
            <input
                className='input'
                id='converterAmount'
                type='number'
                step='0.01'
                min='0.01'
                name='amount'
                value={form.amount}
                onChange={handleChange}
                placeholder='0.00'
                required
                //ARIA ATTRIBUTES:
                aria-label='Amount to convert'
                aria-required='true'
            />
            <small><Asterisk color='#C22419' fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      {/* Convert from currency */}
      <div className="p-2"  id='convertFromBlock'>
      <label className='converterLabel' htmlFor='converterFrom'>CONVERT FROM:</label>
        <div className='input-div'>
            <select
             className='select-currency'
                id='converterFrom'
                required
                name='from'
                value={form.from}
                onChange={handleChange}
                // ARIA ATTRIBUTES:
                aria-required= 'true'
                aria-label='convert from currency'>
                    <option value=''>SELECT</option>
                    {/* MAP ALL AVAILABLE CURRENCIES WITH SELECT AS THE PLACEHOLDER */}
                    {currencyOptions.map(({ code, name }) => (
                        <option key={code} value={code}>{name ? `${code} - ${name}` : code}</option>
                    ))}
                </select>
                <small><Asterisk color='#C22419' fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      <div className="p-2"  id='convertToBlock'>
        <label className='converterLabel' htmlFor='converterTo'>CONVERT TO:</label>
        <div className='input-div'>
            <select
                 className='select-currency'
                 id='converterTo'
                required
                name='to'
                value={form.to}
                onChange={handleChange}
                //ARIA ATTRIBUTES:
                aria-label='Convert to currency'
                aria-required='true'
            >
               <option value=''>SELECT</option>
                {/* MAP ALL AVAILABLE CURRENCIES WITH SELECT AS THE PLACEHOLDER */}
                    {currencyOptions.map(({ code, name }) => (
                        <option key={code} value={code}>{name ? `${code} - ${name}` : code}</option>
                    ))}
                </select>
                <small><Asterisk color='#C22419' fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
    </Stack>
        </div>
        {/* STACK 2 */}
        <Stack gap={3} id='converterStack2'>
      <div className="p-2" id='submit-converter-btn-block'>
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
      <div className="p-2" id='clearFormBtn-block'>
        <Button
                            variant='danger'
                            id='clearFormBtn'
                            type='button'
                            onClick={handleClear}
                            // ARIA ATTRIBUTES:
                            aria-label='Clear currency converter form'
                            aria-disabled={loading}
                        >
                            CLEAR FORM
                        </Button>
      </div>
      <div className="p-2" id='converterResultBlock' aria-live='polite'>
        {/* Only display the Result after form submission */}
        {result && (
            <>
            <p className='infoText'>
                {result.amount} {result.from} = {Number(result.result).toFixed(2)} {result.to}
            </p>
            {/* The day Frankfurter published the rate, so the figure is dated */}
            {result.date && (
                <p className='infoText'>
                    1 {result.from} = {Number(result.rate).toFixed(4)} {result.to} (rate of {result.date})
                </p>
            )}
            {/* BUTTON TO SAVE CURRENCY CONVERTER CALSCULATION */}
            <Button 
                id='saveConversionBtn' 
                variant='light'
                // type=''
                // onClick={}
                // ARIA ATTRIBUTES:
                >
                SAVE CALCULATION
                </Button>
            </>
        )}
      </div>
        {/* ========ERROR MESSAGE==================== */}
        {error && (
            <p className='infoText' style={{ color: '#C22419' }} role='alert' aria-live='assertive'>{error}</p>
        )}
    </Stack>
    </form>
  )
}
