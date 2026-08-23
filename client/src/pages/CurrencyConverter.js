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

export default function CurrencyConverter({currentUser, logout}) {
   // ================STATE VARIABLES===================
    const [form, setForm] = useState(EMPTY_FORM); // Stores the user's form inputs
    const [result, setResult] = useState(null);// Stores the conversion returned by the API
    const [loading, setLoading] = useState(false);// Indicates whether an API request is currently running
    const [error, setError] = useState('');// Stores any error messages shown to the user
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

    //===============
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

    },[setLoading, form.to, form.from, form.amount])

    const saveConversion = useCallback(async () => {
      setLoading(true)
            try {
                const token = localStorage.getItem('token')
                const response = await fetch('http://localhost:3001/api/saveConversion',{
                  method: 'POST',
                  mode: 'cors',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer %{token}`,
                  }, body: JSON.stringify({

                  })
                  
                  const data = await response.json()

                  if (response.ok) {
                    setError?.(null)
                    alert('conversion calculation successfully saved')
                  }else{
                    const message = data.message || 'Registration failed.';
        setError?.(message);
        console.error(`error saving conversion data: ${message}`);
                  }
                })
              }
            } catch (error) {
                setError(`Error saving convertion data, ${error.message}`)
                console.error(`Error saving convertion data, ${error.message}`);
                
            }finally{
              setLoading(false)
            }
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
      <section id='currency-converter-sec1'>
        
        <Row id='currency-converter-row'>
        <Col id='currency-convert-col1'/>
        <Col xs={6} id='currency-convert-col'>
          <div id='currency-converter-panal'>
{/*Currency Converter form  */}
<CurrencyConvertForm
submitConvert={submitConvert}
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
              CURRENCY CALCULATIONS
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
