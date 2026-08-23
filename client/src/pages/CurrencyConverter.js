import React, { useCallback, useEffect, useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/CurrencyConvert.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Stack from 'react-bootstrap/Stack';
import Header from '../components/Header'
import Footer from '../components/Footer'
import CurrencyConvertForm from '../components/CurrencyConvertForm';
import CurrencyList from '../components/CurrencyList';
import { Scale } from 'lucide-react';
// IMPORT DATA
import { currencyCountries } from '../dataArrays/currencyCountries';
import CurrencyCalculations from '../components/CurrencyCalculations';

// Base URL of the API the converter talks to
const API_BASE_URL = 'http://localhost:3001';

// Default values used when the form is first loaded or reset
const EMPTY_FORM = {
    amount: '',
    from: '',
    to: ''
};

/* Currencies offered until GET /api/currencies answers, and kept if it never
does. The local country data covers the same codes, so an unreachable API leaves
the converter working off a curated list rather than an empty dropdown. */
const FALLBACK_CURRENCIES = currencyCountries.map(({ code, name }) => ({ code, name, symbol: '' }));

export default function CurrencyConverter({currentUser, logout, error, setError, loggedIn}) {
   // ================STATE VARIABLES===================
   const [conversions, setConversions] = useState([])//State to store saved conversions
   /* How many saved conversions the user has in total. GET /api/history only
   returns the newest 100, so this is what tells the calculations list it is
   showing a truncated view rather than the whole history. */
   const [conversionsTotal, setConversionsTotal] = useState(0)
    const [form, setForm] = useState(EMPTY_FORM); // Stores the user's form inputs
    const [result, setResult] = useState(null);// Stores the conversion returned by the API
    const [loading, setLoading] = useState(false);// Indicates whether an API request is currently running
    // const [error, setError] = useState('');// Stores any error messages shown to the user
    const [showCurrencies, setShowCurrencies] = useState(false)
    const [showCurrCalculations, setShowCurrCalculations] = useState(false)
    /* Currencies the converter can work with. Starts as the local fallback and
    is replaced by whatever GET /api/currencies reports Frankfurter supports. */
    const [currencyOptions, setCurrencyOptions] = useState(FALLBACK_CURRENCIES)

    /* Loads the currencies Frankfurter supports, so the dropdowns and the
    currency table are built from the provider's own list instead of a hardcoded
    array that has to be kept in step by hand. Runs once on mount, before the
    user opens the form. A failure is logged and the fallback list is kept, so
    the converter stays usable while the API is unreachable. */
    useEffect(() => {
      let ignore = false;// Guards against setting state after the page unmounts

      const loadCurrencies = async () => {
        const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
        try {
          const response = await fetch(`${API_BASE_URL}/api/currencies`, {
            method: 'GET',//HTTP request method
            mode: 'cors',//Enable Cross-Origin Resource Sharing
            headers: { 'Authorization': `Bearer ${token}` }// Attach the token in the Authorization header
          })

          const data = await response.json();//Parse the response as json

          //Conditional rendering to check the request succeeded
          if (!response.ok) {
            console.error('[ERROR: CurrencyConverter.js, loadCurrencies]', data.message || 'Could not load currencies.');//Log an error message in the console for debugging purposes
            return;
          }

          if (!ignore && data.currencies?.length) setCurrencyOptions(data.currencies);
        } catch (error) {
          console.error('[ERROR: CurrencyConverter.js, loadCurrencies]', error.message);//Log an error message in the console for debugging purposes
        }
      }

      loadCurrencies();
      return () => { ignore = true }
    },[])

    const toggleCurrencyList = useCallback(() =>{
      setShowCurrencies((prev) => !prev)
      setShowCurrCalculations(false)
    },[])

    const toggleCalculationsList = useCallback(() => {
      setShowCurrCalculations(prev => !prev)
      setShowCurrencies(false)
    },[])

    //========REQUESTS/CALLBACK=======
    // -------GET--------------------
    // Function to convert currency converter
    const submitConvert = useCallback(async () => {//Define async function to convert currency
      setError('')
      setResult(null)
      if (!form.amount || !form.from || !form.to) {
          setError('Please fill in all fields.');
          return;
      }
      setLoading(true)
      const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
      // if (!token) return;// Return if no token is found
      try {
        const response = await fetch(`${API_BASE_URL}/api/convert?amount=${encodeURIComponent(form.amount)}&from=${encodeURIComponent(form.from)}&to=${encodeURIComponent(form.to)}`,{
          method: 'GET',
          mode: 'cors',
          headers: {
            'Authorization': `Bearer ${token}`// Attach the token in the Authorization header
          }
        })

        const data = await response.json();

        if (!response.ok) {
           console.error(data.message || 'Conversion failed.');//Log an error message in the console for debugging purposes
            setError(data.message || 'Conversion failed.');// Set the error state to display the error in the UI
            return;
        }

        setResult(data);
      } catch (error) {
        console.error('Failed to convert. Please try again.');//Log an error message in the console for debugging purposes
            setError('Failed to convert. Please try again.');//Set the Error state to display a message in the UI
      }finally{
        setLoading(false)
      }

    },[setError,setLoading, form.to, form.from, form.amount])

    /* Loads the logged in user's saved conversions for the calculations list.
    GET /api/history answers `{ success, total, limit, conversions }` — the same
    shape as the tax and interest histories — so the array is read off
    `conversions` rather than from the body itself, and `total` is kept so the
    list can say when it is showing a truncated view of a longer history. */
    // Function to fetch currency conversions list
    const fetchConversions = useCallback(async () => {
      try {
       const token = localStorage.getItem('token')
       const response =  await fetch(`${API_BASE_URL}/api/history`,{
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
       } )
       const data = await response.json().catch(() =>({}))

       //Conditional rendering to check the request succeeded
       if (!response.ok) {
        const message = data.message || 'Could not load your saved conversions.';
        console.error('[ERROR: CurrencyConverter.js, fetchConversions]', message);//Log an error message in the console for debugging purposes
        setError(message);// Set the error state to display the error in the UI
        return;// Exit the function early, keeping whatever list is already on screen
       }

       const fetchedConversions = Array.isArray(data.conversions) ? data.conversions : [];
       setConversions(fetchedConversions)
       setConversionsTotal(typeof data.total === 'number' ? data.total : fetchedConversions.length)
       setError('');//Clear any previous error messages
       console.log(`[SUCCESS: CurrencyConverter.js, fetchConversions] Fetched ${fetchedConversions.length} of ${data.total ?? fetchedConversions.length} conversions`);
      } catch (error) {
        console.error(`Error fetching conversion data`, error.message);
        setError(`Error fetching conversion data, ${error.message}`)
      }
    },[setError])
    // ------------POST---------------------
    /* Saves the conversion currently on screen to the logged in user's history.
    Only the inputs are sent (amount, from, to): the backend fetches its own
    rate and stores that, so a saved record can never disagree with the rate the
    provider quoted. The figures come from `result` rather than `form`, so what
    is saved is what the user is looking at, not whatever has since been typed
    into the inputs.
    Errors are thrown rather than written to `error`, because the form owns the
    save button's own status message; `error` belongs to the conversion itself. */
    // Function to save a user conversion
    const saveConversion = useCallback(async (conversion) => {
      const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
      const response = await fetch(`${API_BASE_URL}/api/save`,{
        method: 'POST',//HTTP request method
        mode: 'cors',//Enable Cross-Origin Resource Sharing
        headers: {
          'Content-Type': 'application/json',// Specify that we're sending JSON data in the request body
          'Authorization': `Bearer ${token}`,// Attach the token in the Authorization header
        },
        body: JSON.stringify({// Send the conversion's inputs in the request body as JSON
          amount: conversion.amount,
          from: conversion.from,
          to: conversion.to,
        })
      })

      const data = await response.json();//Parse the response as json

      //Conditional rendering to check the request succeeded
      if (!response.ok) {
        const message = data.message || 'Could not save the conversion. Please try again.';
        console.error('[ERROR: CurrencyConverter.js, saveConversion]', message);//Log an error message in the console for debugging purposes
        throw new Error(message);
      }

      /* Refresh the calculations list so a save is visible straight away. The
      list fetches on mount, so this only matters while it is already open — but
      without it the panel would sit there missing the conversion just saved. */
      fetchConversions();

      return data;
        },[fetchConversions])

        // --------------DELETE----------------------
        /* Removes one of the user's saved conversions and drops it from the list
        on screen. The record is deleted through DELETE /api/history/:id, which
        matches the id against the user on the token, so a conversion belonging
        to someone else is refused server-side.

        Errors are thrown rather than written to `error`, matching
        `saveConversion`: the calculations list owns the delete button's own
        status message, and reports the failure beside the button the user
        pressed instead of at the top of the page. */
        // Function to delete a currency conversion calculation
        const deleteConversion = useCallback(async (conversionId) => {
            const token = localStorage.getItem('token')//Retrieve Jwt Token From LocalStorage
            const response = await fetch(`${API_BASE_URL}/api/history/${conversionId}`, {
              method: 'DELETE',//HTTP request method
              mode: 'cors',//Enable Cross-Origin Resource Sharing
              headers:{
                'Content-Type': 'application/json',// Specify that we're sending JSON data in the request body
                'Authorization': `Bearer ${token}`// Attach the token in the Authorization header
              }
            })

            const data = await response.json().catch(() => ({}));// Safely parse the JSON response (avoid crash if server returns non-JSON)

            //Conditional rendering to check the request succeeded
            if (!response.ok) {
              const message = data.message || 'Failed to remove the conversion calculation.';
              console.error('[ERROR: CurrencyConverter.js, deleteConversion]', message);//Log an error message in the console for debugging purposes
              throw new Error(message);// Throw an error if the DELETE request is unsuccessful
            }

            // Drop the deleted conversion from the list on screen
            setConversions((prev) =>
                prev.filter((conversion) => String(conversion._id) !== String(conversionId)))
            setConversionsTotal((prev) => Math.max(0, prev - 1))

            console.log('[SUCCESS: CurrencyConverter.js, deleteConversion] Removed conversion', conversionId);//Log a success message in the console for debugging purposes
            return data;
        },[])
    //================================
  return (
    <div id='pageContainer' role='main'>
      <Header currentUser={currentUser} pageHeader={'CURRENCY CONVERTER'}/>
      <Row id='event-row'>
        <Col id='event-col'>
          <div className='event-bar'>
            <div className='event-track'>
              <Scale className='event-slide' size={32}/>
            </div>
          </div>
        </Col>
      </Row>
      {/* ===============
      SECTION 1: CURRENCY CONVERTER FORM
      ============ */}
      <section id='currency-converter-sec1'>
        <Row id='currency-converter-row'>
        <Col id='currency-convert-col1'/>
        <Col xs={6} id='currency-convert-col'>
          <div id='currency-converter-panal'>
{/*Currency Converter form  */}
<CurrencyConvertForm
submitConvert={submitConvert}
  saveConversion={saveConversion}
  EMPTY_FORM={EMPTY_FORM}
  currencyOptions={currencyOptions}
  form={form}
  setForm={setForm}
  error={error}
  setError={setError}
  result={result}
  setResult={setResult}
  loading={loading}
  setLoading={setLoading}
/>
          </div>
        </Col>
        <Col id='currency-convert-col2'/>
      </Row>
      </section>
      {/* ================
      SECTION 2: CURRENCIES LIST + CONVERSION CALCULATIONS LIST
      =============== */}
      <section id='currency-converter-sec2'>
            <Row id='toggle-currencies-row'>
        <Col id='toggle-currencies-col1'/>
        <Col xs={5} id='toggle-currencies-col'>
        <Stack gap={3} id='toggle-currencies-stack'>
      <div className="p-2" id='curreny-block1'>
          <Button
          onClick={toggleCalculationsList}
          variant='light'
          id='toggleCurrCalc-listBtn'
          type='button'
          // ARIA ATTRIBUTES:
          >
            {showCurrCalculations ? 'Hide Calculations': 'Show Currency Calculations'}
          </Button>
      </div>
      <div className="p-2" id='curreny-block2'>
          <Button 
              variant='light' 
              id='toggle-currencies-listbtn' 
              type='button'
              onClick={toggleCurrencyList}
              >
              {showCurrencies ? 'Hide currencies list':'Show available currencies'}
            </Button>
      </div>
    </Stack>
        </Col>
        <Col id='toggle-currencies-col2'/>
      </Row>
      {showCurrCalculations && (
        <div id='currency-calculations-panal'>
          <Row id='currency-calculations-row'>
            <Col id='currency-calculations-col'>
              <div id='currency-calculations-display'>
                {/* CURRENCY CONVERSION CALCULATIONS COMPONENT */}
                <CurrencyCalculations
                loggedIn={loggedIn}
                fetchConversions={fetchConversions}
                conversions={conversions}
                conversionsTotal={conversionsTotal}
                deleteConversion={deleteConversion}
                setError={setError}
                />
              </div>
            </Col>
          </Row>
        </div>
      )}
      {showCurrencies && (
        <div id='currencies-display-panal'>
<Row id='currencies-list-row'>
      
        <Col md={12} id='currencies-list-col'>
          <div id='currency-list-display'>
            {/* CURRENCY LIST COMPONENT */}
            <CurrencyList currencyOptions={currencyOptions} />
          </div>
          
        </Col>
        
      </Row>
        </div>
      )}
      

      </section>
      <Footer logout={logout}/>
    </div>
  )
}
