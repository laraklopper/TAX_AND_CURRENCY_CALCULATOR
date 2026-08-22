// Calculators.js
import React, { useCallback, useEffect, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Calculators.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Header from '../components/Header'
import Footer from '../components/Footer'
import NumberCalculator from '../components/NumberCalculator';
import InterestCalculatorForm from '../components/InterestCalculatorForm';
import TaxCalculatorForm from '../components/TaxCalculatorForm';
import { Calculator } from 'lucide-react';
import { taxSeedData } from '../dataArrays/taxSeedData';

// Base URL of the API the calculators post to
const API_BASE_URL = 'http://localhost:3001';

// ======MAIN CALCULATORS COMPONENT====================
export default function Calculators({currentUser, logout}) {
  const [showTaxCalc, setShowTaxCalc] = useState(false)
  const [showIntCalc, setShowIntCalc] = useState(false)
  const [showCalc, setShowCalc] = useState(false)
  const [showTaxCalculations, setShowTaxCalculations] = useState(false)
  const [showInterestCalculations, setShowInterestCalculations] = useState(false)
  /* Tax years offered by the tax calculator's dropdown. Starts as the seeded
  year and is replaced by whatever GET /api/tax/config returns. */
  const [taxYears, setTaxYears] = useState([taxSeedData.taxYear])

  //================EVENT LISTENERS========================
  const toggleTaxCalc = useCallback(() => {
    setShowTaxCalc(prev => !prev)
    setShowCalc(false)
    setShowIntCalc(false)
  },[])
   const toggleInterestCalculator = useCallback(() => {
    setShowIntCalc(prev => !prev)
    setShowCalc(false)
    setShowTaxCalc(false)
   },[])
   const toggleCalculator = useCallback(() => {
    setShowCalc(prev => !prev)
    setShowIntCalc(false)
    setShowTaxCalc(false)
   },[])

   const toggleTaxCalculations = useCallback(() => {
    setShowTaxCalculations(prev => !prev)
    setShowInterestCalculations(false)
   },[])

   const toggleInterestCalculations = useCallback(() => {
    setShowInterestCalculations(prev => !prev)
    setShowTaxCalculations(false)
   },[])
  /* Shared POST helper for the calculator endpoints. Attaches the JWT, sends
  the payload as JSON and throws the API's own message on failure, so each form
  can show the real reason a request was rejected. */
  const postToApi = useCallback(async (endpoint, payload, fallbackMessage) => {
    const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`// Attach the token in the Authorization header
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json();

    //Conditional rendering to check the request succeeded
    if (!response.ok) {
      console.error(`[ERROR: Calculators.js, ${endpoint}]`, data.message || fallbackMessage);//Log an error message in the console for debugging purposes
      throw new Error(data.message || fallbackMessage);
    }

    return data;
  },[])

  /* Sends the interest calculator's inputs to the backend, which is the source
  of truth for the maths. The payload carries `periodUnit` ('years' or 'months')
  so the same annual rate can be worked out over annual or monthly periods. */
  const calculateInterest = useCallback(async (payload) => {
    const data = await postToApi('/api/interest/calculate', payload, 'Could not calculate interest. Please try again.');
    return data.result;// The form renders the summary and breakdown from this
  },[postToApi])

  /* Saves an interest calculation to the logged in user's history. Only the
  inputs are sent: the backend recalculates the totals before storing them, so
  a saved record can never disagree with the maths. */
  const saveInterest = useCallback(async (payload) => {
    await postToApi('/api/interest/save', payload, 'Could not save the calculation. Please try again.');
  },[postToApi])

  /* Sends the tax calculator's inputs to the backend, which resolves the tax
  year's brackets, rebates and thresholds and works out the tax payable. */
  const calculateTax = useCallback(async (payload) => {
    const data = await postToApi('/api/tax/calculate', payload, 'Could not calculate tax. Please try again.');
    return data.result;// The form renders the summary and bracket breakdown from this
  },[postToApi])

  // Saves a tax calculation to the logged in user's history
  const saveTax = useCallback(async (payload) => {
    await postToApi('/api/tax/save', payload, 'Could not save the calculation. Please try again.');
  },[postToApi])

  /* Loads the tax years the calculator can work with. Runs once on mount so
  the tax year dropdown is populated before the user opens the form. The
  seeded year is used as a fallback if the request fails, so the calculator
  stays usable while the API is unreachable. */
  useEffect(() => {
    let ignore = false;// Guards against setting state after the page unmounts

    const loadTaxYears = async () => {
      const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
      try {
        const response = await fetch(`${API_BASE_URL}/api/tax/config`, {
          method: 'GET',
          mode: 'cors',
          headers: { 'Authorization': `Bearer ${token}` }// Attach the token in the Authorization header
        })
        const data = await response.json();

        //Conditional rendering to check the request succeeded
        if (!response.ok) {
          console.error('[ERROR: Calculators.js, loadTaxYears]', data.message || 'Could not load tax years.');//Log an error message in the console for debugging purposes
          return;
        }

        if (!ignore && data.taxYears?.length) setTaxYears(data.taxYears);
      } catch (error) {
        console.error('[ERROR: Calculators.js, loadTaxYears]', error.message);//Log an error message in the console for debugging purposes
      }
    }

    loadTaxYears();
    return () => { ignore = true }
  },[])
  // ============================================
  return (
    <div id='pageContainer' role='main'>
    {/* HEADER */}
      <Header currentUser={currentUser} pageHeader={'CALCULATORS'}/>
      {/* =======EVENT/ANIMATION============ */}
      <Row id='event-row'>
        <Col id='event-col'>
          <div className='event-bar'>
            <div className='event-track'>
              <Calculator className='event-slide' fill='#c0c0c0' size={32} aria-hidden='true' focusable='false'/>
            </div>
          </div>
        </Col>
      </Row>
      {/* SECTION 1 */}
      <section id='calculatorSec1'>
        <div id='calculators-tab-panal'>
          <Row id='toggleCalculatorRow'>
        <Col id='toggleCalcCol1'/>
        <Col xs={5} id='toggleCalcCol'>
             <Stack id='toggleCalculatorStack'>
              <div className="p-2" id='toggle-calc1-block'>
              {/* Toggle Tax Calculator Btn */}
                <Button 
                variant='light' 
                onClick={toggleTaxCalc} 
                id='toggleTaxCalcBtn' 
                type='button'
                // ARIA ATTRIBUTES:
                aria-label={showTaxCalc ? 'HIDE TAX CALCULATOR': 'SHOW TAX CALCULATOR'}
                aria-pressed={showTaxCalc}
                aria-expanded={showTaxCalc}
                aria-controls='tax-calculator-panal'
                >
                {showTaxCalc ? 'HIDE TAX CALCULATOR': 'SHOW TAX CALCULATOR'}
              </Button>
              </div>
              <div className="p-2" id='toggle-calc2-block'>
              {/* Toggle Interest Calculator Btn */}
                <Button 
                variant='light' 
                onClick={toggleInterestCalculator} 
                id='toggleIntCalcBtn'
                type='button'
                // ARIA ATTRIBUTES:
                aria-label={showIntCalc ? 'HIDE CALCULATOR':'SHOW INTEREST CALCULATOR'}
                aria-pressed={showIntCalc}
                aria-expanded={showIntCalc}
                aria-controls='int-calculator-panal'
                >{showIntCalc ? 'HIDE CALCULATOR':'SHOW INTEREST CALCULATOR'}</Button>
              </div>
              <div className="p-2" id='toggle-calc3-block'>
              {/* Toggle Calculator Btn */}
                <Button 
                    variant='light' 
                    onClick={toggleCalculator} 
                    id='toggleCalcBtn'
                    type='button'
                    // ARIA ATTRIBUTES:
                    aria-label={showCalc ? 'HIDE CALCULATOR': 'SHOW CALCULATOR'}
                    aria-pressed={showCalc}
                    aria-expanded={showCalc}
                    aria-controls='calculator-panal'
                  >
                    {showCalc ? 'HIDE CALCULATOR': 'SHOW CALCULATOR'}
                  </Button>
              </div>
            </Stack>
        </Col>
        <Col id='toggleCalcCol2'/>
      </Row>
       {/* CALCULATORS */}
          <div id='calculators-div'>
            {/*TOGGLE TAX CALCULATOR */}
            {showTaxCalc && (
              <div id='tax-calculator-panal'>
              <Row id='calculator1-Row'>
                <Col id='tax-calculator-col1'/>
                <Col xs={12} md={8} id='tax-calculator-col'>
                <div id='tax-calculator-block'>
                  <TaxCalculatorForm
                    taxYears={taxYears}
                    onCalculate={calculateTax}
                    onSave={saveTax}
                    isAuthenticated={!!currentUser}
                  />
                </div> 
                </Col>
                <Col id='tax-calculator-col2'/>
              </Row>
              </div>
            )}
            {/* TOGGLE INTEREST CALCULATOR */}
            {showIntCalc &&(
              <div id='int-calculator-panal'>
                <Row id='calculator2-Row'>
                <Col id='interest-calculator-col1'/>
                  <Col xs={12} md={8} id='interest-calculator-col'>
                    <div id='interest-calculator-form-panal'>
                        <InterestCalculatorForm
                          onCalculate={calculateInterest}
                          onSave={saveInterest}
                          isAuthenticated={!!currentUser}
                        />
                    </div>
                  </Col>
                  <Col id='interest-calculator-col2'/>
                </Row>
              </div>
            )}
            {/* TOGGLE GENERAL/BASIC CALCULATOR */}
            {showCalc && (
              <div id='calculator-panal'>
                  <Row id='calculator3-Row'>
                    <Col id='calculator-col1'/>
                    <Col xs={5} id='calculator-col'>
                      <div id='basic-calculator-block'>
                        <NumberCalculator/>
                      </div>
                    </Col>
                    <Col id='calculator-col2'/>
                  </Row>
              </div>
            )}
          </div>
          {/* Row 2:Calculator Information/Messages */}
            <Row id='info-msg-row'>
                <Col xs={0} md id='info-msg-col1'/>
                <Col xs={12} md={6} id='info-msg-col'>
                    <div id='info-msg-div'>
                        <span className='info-msg-span'>
                            {/* Display default (SOUTH AFRICAN)15% tax rate */}
                            <h6 className='calculator-info-text'>INTEREST PERIOD CAN BE CALCULATED IN YEARS (ANNUAL) OR MONTHS (MONTHLY)</h6>
                            <h6 className='calculator-info-text'>DEFAULT TAX RATE IS SET TO SOUTH AFRICAN 15% TAX RATE</h6>
                        </span>
                    </div>
                </Col>
                <Col xs={0} md id='info-msg-col1'/>
            </Row>
        </div>
 
       
        </section>
       <section>
<div id='calculations-tab-panal'>
          <Row id='toggle-calculation-list-row'>
            <Col id='toggle-calculationst-col'>
               <Button 
                variant="light" id='showTax-calculationsBtn' onClick={toggleTaxCalculations}>
        {showTaxCalculations ? 'Hide Calculations': 'SHOW TAX CALCULATIONS'}
      </Button>
      <Button variant="light" id='showInterest-calculationsBtn' onClick={toggleInterestCalculations}>
        {showInterestCalculations ? 'Hide Calculations': 'SHOW INTEREST CALCULATIONS'}
      </Button>
            </Col>
          </Row>
          {showTaxCalculations && (
            <div id='tax-calculations-panal'>
              <Row id='tax-calculations-row'>
                <Col id='tax-calculations-col'>
                  TAX CALCULATIONS
                </Col>
              </Row>
            </div>
          )}
          {showInterestCalculations && (
            <div id='interest-calculations-panal'>
              <Row id='int-calculations-row'>
                <Col id='int-calculations-col'>
                  INTEREST CALCULATIONS
                </Col>
              </Row>

            </div>
          )}
        </div>
       </section>
        {/* ======FOOTER============= */}
      <Footer logout={logout}/>
    </div>
  )
}
