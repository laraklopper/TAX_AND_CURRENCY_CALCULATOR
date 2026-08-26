// Calculations.js
// The logged in user's saved calculations. The CALCULATORS page works the sums
// out and saves them; this page is where they are read back, one list at a time.
import React, { useCallback, useState } from 'react'
import '../css/pagesCss/Calculations.css'
import '../css/pagesCss/PageSetup.css'
// BOOTSTRAP COMPONENTS
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// IMPORT CUSTOM COMPONENTS
import Header from '../components/Header'
import Footer from '../components/Footer'
import TaxCalculations from '../components/TaxCalculations';
import InterestCalculations from '../components/InterestCalculations';

// Base URL of the API the calculations lists read from
const API_BASE_URL = 'http://localhost:3001';

export default function Calculations({currentUser, logout}) {
    // ==========STATE VARIABLES================
    const [showTaxCalculations, setShowTaxCalculations] =useState(false)
    const [showVatCalculations, setShowVatCalculations] = useState(false)
     const [showInterestCalculations, setShowInterestCalculations] = useState(false)
    /* The logged in user's saved calculations, shown by the two calculations
    lists. `total` is reported separately by each history endpoint, which returns
    only the newest 100 records, so it is what tells a list it is showing a
    truncated view. A list that will not load reports its own reason, because this
    page has no error banner of its own. */
    const [taxCalculations, setTaxCalculations] = useState([])
    const [taxCalculationsTotal, setTaxCalculationsTotal] = useState(0)
    const [taxCalculationsError, setTaxCalculationsError] = useState('')
    const [interestCalculations, setInterestCalculations] = useState([])
    const [interestCalculationsTotal, setInterestCalculationsTotal] = useState(0)
    const [interestCalculationsError, setInterestCalculationsError] = useState('')
    /* Being on this page means being logged in (App.js only routes here behind
    the login), but the histories are scoped to the token, so the lists wait for
    the current user to load before asking for them. */
    const loggedIn = Boolean(currentUser)

     //================EVENT LISTENERS========================
     // Function to toggle taxCalculations List
     const toggleTaxCalculations = useCallback(() => {
        setShowTaxCalculations(prev => !prev)
        setShowInterestCalculations(false)
        setShowVatCalculations(false)
     },[])

     //Function to toggle Interest calculations list
    const toggleInterestCalculations = useCallback(() => {
        setShowInterestCalculations(prev => !prev)
        setShowTaxCalculations(false)
        setShowVatCalculations(false)
    },[])

    //Function to toggle Interest calculations list
    const toggleVatCalculations = useCallback(() => {
    setShowVatCalculations(prev => !prev)
    setShowTaxCalculations(false)
    setShowInterestCalculations(false)
    },[])

    /* Shared GET helper for the two history endpoints. Both answer
    `{ success, total, limit, calculations }`, so this returns that whole body and
    throws the API's own message on failure, letting the caller report why a list
    could not be loaded. */
    const getFromApi = useCallback(async (endpoint, fallbackMessage) => {
      const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',//HTTP request method
        mode: 'cors',//Enable Cross-Origin Resource Sharing
        headers: {
          'Content-Type': 'application/json',// Specify the Content-Type in the request payload
          'Authorization': `Bearer ${token}`// Attach the token in the Authorization header
        }
      })

      const data = await response.json().catch(() => ({}));// Safely parse the JSON response (avoid crash if server returns non-JSON)

      //Conditional rendering to check the request succeeded
      if (!response.ok) {
        console.error(`[ERROR: Calculations.js, GET ${endpoint}]`, data.message || fallbackMessage);//Log an error message in the console for debugging purposes
        throw new Error(data.message || fallbackMessage);
      }

      return data;
    },[])

    /* Shared DELETE helper for the two history endpoints. Throws the API's own
    message on failure, so the calculations list can report the real reason beside
    the delete button the user pressed. */
    const deleteFromApi = useCallback(async (endpoint, fallbackMessage) => {
      const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',//HTTP request method
        mode: 'cors',//Enable Cross-Origin Resource Sharing
        headers: {
          'Content-Type': 'application/json',// Specify the Content-Type in the request payload
          'Authorization': `Bearer ${token}`// Attach the token in the Authorization header
        }
      })

      const data = await response.json().catch(() => ({}));// Safely parse the JSON response (avoid crash if server returns non-JSON)

      //Conditional rendering to check the request succeeded
      if (!response.ok) {
        console.error(`[ERROR: Calculations.js, DELETE ${endpoint}]`, data.message || fallbackMessage);//Log an error message in the console for debugging purposes
        throw new Error(data.message || fallbackMessage);
      }

      return data;
    },[])

    /* Loads the logged in user's saved tax calculations for the tax calculations
    list. GET /tax/history returns the newest 100 with the total alongside. */
    const fetchTaxCalculations = useCallback(async () => {
      try {
        const data = await getFromApi('/tax/history', 'Could not load your saved tax calculations.');
        const calculations = Array.isArray(data.calculations) ? data.calculations : [];
        setTaxCalculations(calculations)
        setTaxCalculationsTotal(typeof data.total === 'number' ? data.total : calculations.length)
        setTaxCalculationsError('')//Clear any previous error messages
        console.log(`[SUCCESS: Calculations.js, fetchTaxCalculations] Fetched ${calculations.length} of ${data.total ?? calculations.length} tax calculations`);
      } catch (error) {
        // Reported by the list itself: this page has no error banner of its own
        setTaxCalculationsError(error?.message || 'Could not load your saved tax calculations.')
      }
    },[getFromApi])

    // Removes one of the user's saved tax calculations and drops it from the list
    const deleteTaxCalculation = useCallback(async (calculationId) => {
      const data = await deleteFromApi(`/tax/history/${calculationId}`, 'Failed to remove the tax calculation.');

      // Drop the deleted calculation from the list on screen
      setTaxCalculations((prev) => prev.filter((calculation) => String(calculation._id) !== String(calculationId)))
      setTaxCalculationsTotal((prev) => Math.max(0, prev - 1))

      console.log('[SUCCESS: Calculations.js, deleteTaxCalculation] Removed tax calculation', calculationId);//Log a success message in the console for debugging purposes
      return data;
    },[deleteFromApi])

    /* Loads the logged in user's saved interest calculations for the interest
    calculations list, as above. */
    const fetchInterestCalculations = useCallback(async () => {
      try {
        const data = await getFromApi('/interest/history', 'Could not load your saved interest calculations.');
        const calculations = Array.isArray(data.calculations) ? data.calculations : [];
        setInterestCalculations(calculations)
        setInterestCalculationsTotal(typeof data.total === 'number' ? data.total : calculations.length)
        setInterestCalculationsError('')//Clear any previous error messages
        console.log(`[SUCCESS: Calculations.js, fetchInterestCalculations] Fetched ${calculations.length} of ${data.total ?? calculations.length} interest calculations`);
      } catch (error) {
        // Reported by the list itself: this page has no error banner of its own
        setInterestCalculationsError(error?.message || 'Could not load your saved interest calculations.')
      }
    },[getFromApi])

    // Removes one of the user's saved interest calculations, as above
    const deleteInterestCalculation = useCallback(async (calculationId) => {
      const data = await deleteFromApi(`/interest/history/${calculationId}`, 'Failed to remove the interest calculation.');

      // Drop the deleted calculation from the list on screen
      setInterestCalculations((prev) => prev.filter((calculation) => String(calculation._id) !== String(calculationId)))
      setInterestCalculationsTotal((prev) => Math.max(0, prev - 1))

      console.log('[SUCCESS: Calculations.js, deleteInterestCalculation] Removed interest calculation', calculationId);//Log a success message in the console for debugging purposes
      return data;
    },[deleteFromApi])

    //===============JSX RENDERING================
  return (
    <div id='pageContainer'>
        <Header pageHeader={'CALCULATIONS'} currentUser={currentUser}/>
        <section id='calculations-section1'>
            <div id='calculations-tab-panal'>
    <Row id='toggle-calculation-list-row'>
        <Col id='toggle-calculations-col1'/>
        <Col xs={6} id='toggle-calculations-col'>
            <Stack gap={3} id='toggleCalculations-stack'>
      <div className="p-2" id='show-calculations-block1'>
        <Button
        variant='light'
        id='showTax-calculationsBtn'
        type='button'
        onClick={toggleTaxCalculations}
        // ARIA ATTRIBUTES:
        aria-label={showTaxCalculations ? 'Hide Calculations': 'SHOW TAX CALCULATIONS'}
        aria-controls='tax-calculations-panal'
        aria-pressed={showTaxCalculations}
        aria-expanded={showTaxCalculations}
        >
           {showTaxCalculations ? 'Hide Calculations': 'SHOW TAX CALCULATIONS'}
        </Button>
      </div>
      <div className="p-2" id='show-calculations-block2'>
        <Button
        variant='light'
        type='button'
        id='showInterest-calculationsBtn'
        onClick={toggleInterestCalculations}
        // ARIA ATTRIBUTES:
        aria-label={showInterestCalculations ? 'Hide Calculations': 'SHOW INTEREST CALCULATIONS'}
        aria-controls='interest-calculations-panal'
        aria-pressed={showInterestCalculations}
        aria-expanded={showInterestCalculations}
        >
            {showInterestCalculations ? 'Hide Calculations': 'SHOW INTEREST CALCULATIONS'}
        </Button>

      </div>
      <div className="p-2" id='show-calculations-block3'>
          <Button
            variant='light'
            id='showVatCalculationsBtn'
            type='button'
            onClick={toggleVatCalculations}
          >
            {showVatCalculations ? 'Hide Calculations' : 'Show Vat Calculations'}
        </Button>
      </div>
    </Stack>
        </Col>
        <Col id='toggle-calculations-col2'/>
      </Row>
      {/* Tax Calculations */}
      {showTaxCalculations && (
        <div id='tax-calculations-panal'>
          <Row id='tax-calculations-row'>
            <Col id='tax-calculations-col'>
              {/* SAVED TAX CALCULATIONS COMPONENT */}
              <TaxCalculations
                loggedIn={loggedIn}
                fetchTaxCalculations={fetchTaxCalculations}
                taxCalculations={taxCalculations}
                taxCalculationsTotal={taxCalculationsTotal}
                deleteTaxCalculation={deleteTaxCalculation}
                loadError={taxCalculationsError}
              />
            </Col>
          </Row>
        </div>
      )}
      {/* Interest Calculations */}
      {showInterestCalculations && (
        <div id='interest-calculations-panal'>
          <Row id='int-calculations-row'>
            <Col id='int-calculations-col'>
              {/* SAVED INTEREST CALCULATIONS COMPONENT */}
              <InterestCalculations
                loggedIn={loggedIn}
                fetchInterestCalculations={fetchInterestCalculations}
                interestCalculations={interestCalculations}
                interestCalculationsTotal={interestCalculationsTotal}
                deleteInterestCalculation={deleteInterestCalculation}
                loadError={interestCalculationsError}
              />
            </Col>
          </Row>
        </div>
      )}
      {/* VAT Calculations */}

            </div>


        </section>
        <Footer
            logout={logout}
        />
    </div>
  )
}
