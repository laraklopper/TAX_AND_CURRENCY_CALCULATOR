import React, { useCallback, useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/CurrencyConvert.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Header from '../components/Header'
import Footer from '../components/Footer'
import CurrencyConvertForm from '../components/CurrencyConvertForm';
import CurrencyList from '../components/CurrencyList';
import { Scale } from 'lucide-react';

// Default values used when the form is first loaded or reset
const EMPTY_FORM = {
    amount: '',
    from: '',
    to: ''
};

export default function CurrencyConverter({currentUser, logout}) {
   // ================STATE VARIABLES===================
    const [form, setForm] = useState(EMPTY_FORM); // Stores the user's form inputs
    const [result, setResult] = useState(null);// Stores the conversion returned by the API
    const [loading, setLoading] = useState(false);// Indicates whether an API request is currently running
    const [error, setError] = useState('');// Stores any error messages shown to the user
    const [showCurrencies, setShowCurrencies] = useState(false)

    const toggleCurrencyList = () =>{
      setShowCurrencies((prev) => !prev)
    }


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
        const response = await fetch(`http://localhost:3001/api/convert?amount=${encodeURIComponent(form.amount)}&from=${encodeURIComponent(form.from)}&to=${encodeURIComponent(form.to)}`,{
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
          <div className='toggle-div'>
            <Button 
              variant='light' 
              id='toggle-currencies-listbtn' 
              type='button'
              onClick={toggleCurrencyList}
              >
              {showCurrencies ? 'Hide currencies list':'Show available currencies'}
            </Button>
          </div>
        </Col>
        <Col id='toggle-currencies-col2'/>
      </Row>
      {showCurrencies && (
        <div id='currencies-display-panal'>
<Row id='currencies-list-row'>
      
        <Col md={12} id='currencies-list-col'>
          <div id='currency-list-display'>
            {/* CURRENCY LIST COMPONENT */}
            <CurrencyList />
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
