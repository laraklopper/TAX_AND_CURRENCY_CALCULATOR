// Calculators.js
import React, { useCallback, useState } from 'react'
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

// ======MAIN CALCULATORS COMPONENT====================
export default function Calculators({currentUser, logout}) {
  const [showTaxCalc, setShowTaxCalc] = useState(false)
  const [showIntCalc, setShowIntCalc] = useState(false)
  const [showCalc, setShowCalc] = useState(false)

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

  /* Sends the interest calculator's inputs to the backend, which is the source
  of truth for the maths. The payload carries `periodUnit` ('years' or 'months')
  so the same annual rate can be worked out over annual or monthly periods.
  Throws on failure so the form can show the API's message. */
  const calculateInterest = useCallback(async (payload) => {
    const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
    const response = await fetch('http://localhost:3001/api/interest/calculate', {
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
      console.error('[ERROR: Calculators.js, calculateInterest]', data.message || 'Calculation failed.');//Log an error message in the console for debugging purposes
      throw new Error(data.message || 'Could not calculate interest. Please try again.');
    }

    return data.result;// The form renders the summary and breakdown from this
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
                  <TaxCalculatorForm/>
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
        </section>
        {/* ======FOOTER============= */}
      <Footer logout={logout}/>
    </div>
  )
}
