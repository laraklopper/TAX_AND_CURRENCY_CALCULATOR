// Calculators.js
import React, { useCallback, useEffect, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Calculators.css'
// BOOTSTRAP COMPONENTS
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
// IMPORT CUSTOM COMPONENTS
import Header from '../components/Header'
import Footer from '../components/Footer'
import NumberCalculator from '../components/NumberCalculator';
import InterestCalculatorForm from '../components/InterestCalculatorForm';
import TaxCalculatorForm from '../components/TaxCalculatorForm';
// IMPORT ICONS FROM LUCIDE REACT
import { Calculator } from 'lucide-react';
// IMPORT DATA
import { taxSeedData } from '../dataArrays/taxSeedData';
import VatCalculator from '../components/VatCalculatorForm';
import ProvisionalTaxCalculator from '../components/ProvisionalTaxCalculatorForm';

// Base URL of the API the calculators post to
const API_BASE_URL = 'http://localhost:3001';

// ======MAIN CALCULATORS COMPONENT====================
export default function Calculators({currentUser, logout}) {
  // ==========STATE VARIABLES================
  const [showTaxCalc, setShowTaxCalc] = useState(false)
  const [showIntCalc, setShowIntCalc] = useState(false)
  const [showCalc, setShowCalc] = useState(false)
  const [showVatCalc, setShowVatCalc] = useState(false)
  const [showProvTaxCalc, setShowProvTaxCalc] = useState(false)
  /* Tax years offered by the tax calculator's dropdown. Starts as the seeded
  year and is replaced by whatever GET /tax/config returns. */
  const [taxYears, setTaxYears] = useState([taxSeedData.taxYear])

  //================EVENT LISTENERS========================
  // Function to toggle tax calculator
  const toggleTaxCalc = useCallback(() => {
    setShowTaxCalc(prev => !prev)
    setShowCalc(false)
    setShowIntCalc(false)
    setShowVatCalc(false)
    setShowProvTaxCalc(false)
  },[])
  // Function to toggle interest calculator
   const toggleInterestCalculator = useCallback(() => {
    setShowIntCalc(prev => !prev)
    setShowCalc(false)
    setShowVatCalc(false)
    setShowTaxCalc(false)
    setShowProvTaxCalc(false)
   },[])
   //  Function to toggle Vat calculator
   const toggleVatCalculator = useCallback(() => {
    setShowVatCalc(prev => !prev)
    setShowIntCalc(false)
    setShowCalc(false)
    setShowTaxCalc(false)
    setShowProvTaxCalc(false)
   },[])

  //  Function to toggle Provisional tax calculator
  const toggleProvTaxCalculator = useCallback(() => {
    setShowProvTaxCalc(prev => !prev)
    setShowCalc(false)
    setShowVatCalc(false)
    setShowTaxCalc(false)
  },[])
  //  Function to toggle general/number calculator
   const toggleCalculator = useCallback(() => {
    setShowCalc(prev => !prev)
    setShowIntCalc(false)
    setShowVatCalc(false)
    setShowTaxCalc(false)
    setShowProvTaxCalc(false)
   },[])

  /* Shared POST helper for the calculator endpoints. Attaches the JWT, sends
  the payload as JSON and throws the API's own message on failure, so each form
  can show the real reason a request was rejected. */
  const postToApi = useCallback(async (endpoint, payload, fallbackMessage) => {
    const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',//HTTP request method
      mode: 'cors',//Enable Cross-Origin Resource Sharing 
      headers: {
        'Content-Type': 'application/json',// Specify that we're sending JSON data in the request body
        'Authorization': `Bearer ${token}`// Attach the token in the Authorization header
      },
      body: JSON.stringify(payload)// Send the new payload in the request body as JSON
    })

    const data = await response.json();//Parse the response as json

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
    const data = await postToApi('/interest/calculate', payload, 'Could not calculate interest. Please try again.');
    return data.result;// The form renders the summary and breakdown from this
  },[postToApi])

  /* Saves an interest calculation to the logged in user's history. Only the
  inputs are sent: the backend recalculates the totals before storing them, so
  a saved record can never disagree with the maths. */
  const saveInterest = useCallback(async (payload) => {
    await postToApi('/interest/save', payload, 'Could not save the calculation. Please try again.');
    /* Nothing to refresh here: the saved calculations live on the CALCULATIONS
    page, whose list fetches its own history when it is shown. */
  },[postToApi])

  /* Sends the tax calculator's inputs to the backend, which resolves the tax
  year's brackets, rebates and thresholds and works out the tax payable. */
  const calculateTax = useCallback(async (payload) => {
    const data = await postToApi('/tax/calculate', payload, 'Could not calculate tax. Please try again.');
    return data.result;// The form renders the summary and bracket breakdown from this
  },[postToApi])

  // Saves a tax calculation to the logged in user's history
  const saveTax = useCallback(async (payload) => {
    await postToApi('/tax/save', payload, 'Could not save the calculation. Please try again.');
    // Read back on the CALCULATIONS page, which loads its own history
  },[postToApi])

  /* Sends the VAT calculator's inputs to the backend, which applies the
  SARS standard rate (or 0% for zero-rated items) and works out the VAT
  portion, net and gross amounts. */
  const calculateVat = useCallback(async (payload) => {
    const data = await postToApi('/vat/calculate', payload, 'Could not calculate VAT. Please try again.');
    return data.result;// The form renders the VAT breakdown from this
  },[postToApi])

  // Saves a VAT calculation to the logged in user's history
  const saveVat = useCallback(async (payload) => {
    await postToApi('/vat/save', payload, 'Could not save the calculation. Please try again.');
    // Read back on the CALCULATIONS page, as above
  },[postToApi])

  /* Sends the provisional tax calculator's inputs to the backend, which works
  the tax on the estimate out from the SAME tax year brackets and rebates as the
  income tax calculator, applies the portion for the selected IRP6 period and
  deducts what has already been withheld or paid. */
  const calculateProvisionalTax = useCallback(async (payload) => {
    const data = await postToApi('/provisional/calculate', payload, 'Could not calculate provisional tax. Please try again.');
    return data.result;// The form renders the IRP6 working from this
  },[postToApi])

  // Saves a provisional tax calculation to the logged in user's history
  const saveProvisionalTax = useCallback(async (payload) => {
    await postToApi('/provisional/save', payload, 'Could not save the calculation. Please try again.');
    // Read back on the CALCULATIONS page, as above
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
        const response = await fetch(`${API_BASE_URL}/tax/config`, {
          method: 'GET',//HTTP request method
          mode: 'cors',//Enable cors 
          headers: { 'Authorization': `Bearer ${token}` }// Attach the token in the Authorization header
        })
        const data = await response.json();//Parse the data as json

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
              {/* Toggle Vat Calculator Button */}
                <Button
                variant='light'
                onClick={toggleVatCalculator}
                id='toggleVatCalcBtn'
                type='button'
                aria-label={showVatCalc ? 'HIDE CALCULATOR': 'SHOW VAT CALCULATOR'}
                aria-controls='vat-calculator-panal'
                aria-pressed={showVatCalc}
                aria-expanded={showVatCalc}
                >
                {showVatCalc ? 'HIDE CALCULATOR': 'SHOW VAT CALCULATOR'}
                </Button>
              </div>
              <div className="p-2" id='toggle-calc4-block'>
              {/* Toggle provisional tax Calculator btn */}
              <Button
              id='toggleProvTaxCalcBtn'
              variant='light'
              type='button'
              onClick={toggleProvTaxCalculator}
              // ARIA ATTRIBUTES:
              aria-label={showProvTaxCalc ? 'HIDE CALCULATOR':'SHOW PROVISIONAL TAX CALCULATOR'}
              aria-controls='prov-tax-calculator-panal'
              aria-pressed={showProvTaxCalc}
              aria-expanded={showProvTaxCalc}
              >
                {showProvTaxCalc ? 'HIDE CALCULATOR':'SHOW PROVISIONAL TAX CALCULATOR'}
              </Button>

              </div>
              <div className="p-2" id='toggle-calc5-block'>
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
            {/* TOGGLE VAT CALCULATOR */}
            {showVatCalc && (
              <div id='vat-calculator-panal'>
                <Row id='vatCalculator-row'>
                  <Col id='vat-calculator-col1'/>
                  <Col xs={12} md={8} id='vat-calculator-col'>
                    <div id='vat-calculator-block'>
                      <VatCalculator
                        onCalculate={calculateVat}
                        onSave={saveVat}
                        isAuthenticated={!!currentUser}
                      />
                    </div>
                  </Col>
                   <Col id='vat-calculator-col1'/>
                </Row>
              </div>
            )}
            {/* TOGGLE PROVISIONAL TAX CALCULATOR */}
            {showProvTaxCalc && (
              <div id='prov-tax-calculator-panal'>
                <Row id='prov-tax-calc-row'>
                  <Col id='provtax-calc-col1'/>
                  <Col xs={12} md={8} id='provtax-calc-col'>
                    <div id='prov-tax-calculator-block'>
                      <ProvisionalTaxCalculator
                        /* The same tax years as the income tax calculator:
                        provisional tax is worked out from the same brackets */
                        taxYears={taxYears}
                        onCalculate={calculateProvisionalTax}
                        onSave={saveProvisionalTax}
                        isAuthenticated={!!currentUser}
                      />
                    </div>
                  </Col>
                  <Col id='provtax-calc-col2'/>
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
                          /* Supplies the fullName the form saves a
                          calculation under */
                          currentUser={currentUser}
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
            <Col id='info-msg-col1'/>
            <Col md={8} xs={12} id='info-msg-col'>
              <Card id='calculators-info-card'>
      <Card.Body id='calculations-info-card-text'>
       
        <Card.Subtitle id='calculations-info'>
         <p>All financial (tax and interest) calculations are calculated in terms of South African tax and interest rates</p> 
        </Card.Subtitle>
        <Card.Text id='info-msg-div'>
            <ul id='calculator-data-list'>
              <li><h6 className='calculator-info-text'>INTEREST PERIOD CAN BE CALCULATED IN YEARS (ANNUAL) OR MONTHS (MONTHLY)</h6></li>
              <li> <h6 className='calculator-info-text'>DEFAULT TAX RATE IS SET TO SOUTH AFRICAN 15% TAX RATE</h6></li>
            </ul>
       
        </Card.Text>
        <Card.Link id='tax-card-link' target='blank'
            href='https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/' 
            >https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/</Card.Link>
      </Card.Body>
    </Card>
            </Col>
            <Col id='info-msg-col2'/>

          </Row>
        </div>
        </section>
        {/* Saved calculations are listed on the CALCULATIONS page */}
        {/* ======FOOTER============= */}
      <Footer logout={logout}/>
    </div>
  )
}