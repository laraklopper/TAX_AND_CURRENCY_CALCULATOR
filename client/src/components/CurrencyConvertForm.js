// CurrencyConvertForm.js
import React, { useState } from 'react'
import '../css/componentCss/FormSetup.css'
import '../css/componentCss/CurrencyConverter.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Asterisk } from 'lucide-react';
// IMPORT UTILITY FUNCTIONS
import { currencyOptionLabel, toConvertedAmount, toQuotedRate } from '../utils/currencyFunc';

/* `currencyOptions` is the list of { code, name, symbol } the page loaded from
GET /api/currencies, which reports what Frankfurter supports. The dropdowns are
built from it rather than from a local array, so the codes on offer are always
codes the converter can actually price. */
export default function CurrencyConvertForm(
    {
        submitConvert,
        saveConversion,
        EMPTY_CONVERT_FORM,
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

        // ==========================================
        /* Status of the save request for the conversion currently on screen:
        null | 'saving' | 'saved' | 'error'. Kept here rather than on the page
        because it describes this button, not the conversion itself. */
        const [saveStatus, setSaveStatus] = useState(null);
        // Message from a failed save, so the user sees why it was rejected
        const [saveError, setSaveError] = useState('');

      //===========EVENT LISTENERS===============
    /* Clears the save button back to its unsaved state. Called whenever the
    result on screen is replaced, so a 'Saved' label can never be left over from
    a previous conversion. */
    const resetSaveStatus = () => {
        setSaveStatus(null);
        setSaveError('');
    };

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
        resetSaveStatus();// The old save status no longer describes anything on screen
    };
    //Function to clear the form
    const handleClear = () => {
        setForm(EMPTY_CONVERT_FORM);// Reset all form inputs (amount, from, and to) to their default values.
        setResult(null);// Remove the previous conversion result from the screen.

        setError('');// Clear any displayed error messages.
        resetSaveStatus();// Clear the save status along with the result it belonged to
    };

    // Function to submit currency converter form
    const handleConvert = (event) =>{
        event.preventDefault()
        resetSaveStatus()// A new conversion is about to replace the saved one
        submitConvert()
    }

    /* Function to save the displayed conversion to the user's history. The
    result is passed straight through, so the record is built from the figures
    on screen rather than from the inputs, which may have moved on. */
    const handleSave = async () => {
        if (!result || !saveConversion) return;// Nothing to save, or the page did not supply a handler
        setSaveStatus('saving');
        setSaveError('');
        try {
            await saveConversion({ amount: result.amount, from: result.from, to: result.to });
            setSaveStatus('saved');
        } catch (err) {
            setSaveStatus('error');
            setSaveError(err?.message || 'Could not save the conversion. Please try again.');
        }
    };

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
                        <option key={code} value={code}>{currencyOptionLabel(code, name)}</option>
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
                        <option key={code} value={code}>{currencyOptionLabel(code, name)}</option>
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
                {result.amount} {result.from} = {toConvertedAmount(result.result)} {result.to}
            </p>
            {/* The day Frankfurter published the rate, so the figure is dated */}
            {result.date && (
                <p className='infoText'>
                    1 {result.from} = {toQuotedRate(result.rate)} {result.to} (rate of {result.date})
                </p>
            )}
            {/* BUTTON TO SAVE CURRENCY CONVERTER CALCULATION.
            Only rendered once a conversion is on screen, and disabled while the
            request is running or after it has succeeded, so the same conversion
            cannot be written to the history twice. */}
            {saveConversion && (
                <>
            <Button
                id='saveConversionBtn'
                variant='success'
                type='button'
                onClick={handleSave}
                disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                // ARIA ATTRIBUTES:
                aria-label='Save this conversion to your history'
                aria-disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                >
                {saveStatus === 'saving'
                    ? 'SAVING...'
                    : saveStatus === 'saved'
                    ? 'SAVED TO HISTORY'
                    : 'SAVE CALCULATION'}
                </Button>
                {/* Only shown when the save itself failed; the conversion is unaffected */}
                {saveStatus === 'error' && (
                    <p className='infoText' style={{ color: '#C22419' }} role='alert'>{saveError}</p>
                )}
                </>
            )}
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
