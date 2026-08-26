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
import ProvisionalTaxCalculations from '../components/ProvisionalTaxCalculations';
import VatCalculations from '../components/VatCalculations';
import InterestCalculations from '../components/InterestCalculations';

// Base URL of the API the calculations lists read from
const API_BASE_URL = 'http://localhost:3001';

/* The four lists this page can show, in the order their buttons appear. Each
entry is what the toggle button needs to describe itself, so a fifth calculator
is a row here rather than another piece of state and another button block.

`key` is what `visibleList` holds; `controls` is the id of the panal the button
opens, which is also what its aria-controls points at. */
const CALCULATION_LISTS = [
    {
        key: 'tax',
        buttonId: 'showTax-calculationsBtn',
        controls: 'tax-calculations-panal',
        label: 'SHOW TAX CALCULATIONS',
    },
    {
        key: 'provisional',
        buttonId: 'showProvTax-calculationsBtn',
        controls: 'prov-tax-calculations-panal',
        label: 'SHOW PROVISIONAL TAX CALCULATIONS',
    },
    {
        key: 'vat',
        buttonId: 'showVatCalculationsBtn',
        controls: 'vat-calculations-panal',
        label: 'SHOW VAT CALCULATIONS',
    },
    {
        key: 'interest',
        buttonId: 'showInterest-calculationsBtn',
        controls: 'interest-calculations-panal',
        label: 'SHOW INTEREST CALCULATIONS',
    },
]

export default function Calculations({currentUser, logout}) {
    // ==========STATE VARIABLES================
    /* Which list is open, or null when none is. Held as ONE value rather than as
    a boolean per list: the lists are mutually exclusive, and a boolean each
    means every toggle has to remember to switch all the others off - a fifth
    calculator would be a fifth flag in four different functions, and the one
    that gets forgotten leaves two lists on screen at once. */
    const [visibleList, setVisibleList] = useState(null)
    /* The logged in user's saved calculations, shown by the four calculations
    lists. `total` is reported separately by each history endpoint, which returns
    only the newest 100 records, so it is what tells a list it is showing a
    truncated view. A list that will not load reports its own reason, because this
    page has no error banner of its own. */
    const [taxCalculations, setTaxCalculations] = useState([])
    const [taxCalculationsTotal, setTaxCalculationsTotal] = useState(0)
    const [taxCalculationsError, setTaxCalculationsError] = useState('')
    const [provTaxCalculations, setProvTaxCalculations] = useState([])
    const [provTaxCalculationsTotal, setProvTaxCalculationsTotal] = useState(0)
    const [provTaxCalculationsError, setProvTaxCalculationsError] = useState('')
    const [vatCalculations, setVatCalculations] = useState([])
    const [vatCalculationsTotal, setVatCalculationsTotal] = useState(0)
    const [vatCalculationsError, setVatCalculationsError] = useState('')
    const [interestCalculations, setInterestCalculations] = useState([])
    const [interestCalculationsTotal, setInterestCalculationsTotal] = useState(0)
    const [interestCalculationsError, setInterestCalculationsError] = useState('')
    /* Being on this page means being logged in (App.js only routes here behind
    the login), but the histories are scoped to the token, so the lists wait for
    the current user to load before asking for them. */
    const loggedIn = Boolean(currentUser)

     //================EVENT LISTENERS========================
     /* Opens the list that was asked for, or closes it if it is already open.
     One function for all four, so a list cannot be opened without the others
     being closed. */
     const toggleList = useCallback((key) => {
        setVisibleList(prev => (prev === key ? null : key))
     },[])

    /* Shared GET helper for the four history endpoints. All four answer
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

    /* Shared DELETE helper for the four history endpoints. Throws the API's own
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

    /* Loads the logged in user's saved provisional tax (IRP6) calculations for
    the provisional tax calculations list, as above. */
    const fetchProvTaxCalculations = useCallback(async () => {
      try {
        const data = await getFromApi('/provisional/history', 'Could not load your saved provisional tax calculations.');
        const calculations = Array.isArray(data.calculations) ? data.calculations : [];
        setProvTaxCalculations(calculations)
        setProvTaxCalculationsTotal(typeof data.total === 'number' ? data.total : calculations.length)
        setProvTaxCalculationsError('')//Clear any previous error messages
        console.log(`[SUCCESS: Calculations.js, fetchProvTaxCalculations] Fetched ${calculations.length} of ${data.total ?? calculations.length} provisional tax calculations`);
      } catch (error) {
        // Reported by the list itself: this page has no error banner of its own
        setProvTaxCalculationsError(error?.message || 'Could not load your saved provisional tax calculations.')
      }
    },[getFromApi])

    // Removes one of the user's saved provisional tax calculations, as above
    const deleteProvTaxCalculation = useCallback(async (calculationId) => {
      const data = await deleteFromApi(`/provisional/history/${calculationId}`, 'Failed to remove the provisional tax calculation.');

      // Drop the deleted calculation from the list on screen
      setProvTaxCalculations((prev) => prev.filter((calculation) => String(calculation._id) !== String(calculationId)))
      setProvTaxCalculationsTotal((prev) => Math.max(0, prev - 1))

      console.log('[SUCCESS: Calculations.js, deleteProvTaxCalculation] Removed provisional tax calculation', calculationId);//Log a success message in the console for debugging purposes
      return data;
    },[deleteFromApi])

    /* Loads the logged in user's saved VAT calculations for the VAT calculations
    list, as above. */
    const fetchVatCalculations = useCallback(async () => {
      try {
        const data = await getFromApi('/vat/history', 'Could not load your saved VAT calculations.');
        const calculations = Array.isArray(data.calculations) ? data.calculations : [];
        setVatCalculations(calculations)
        setVatCalculationsTotal(typeof data.total === 'number' ? data.total : calculations.length)
        setVatCalculationsError('')//Clear any previous error messages
        console.log(`[SUCCESS: Calculations.js, fetchVatCalculations] Fetched ${calculations.length} of ${data.total ?? calculations.length} VAT calculations`);
      } catch (error) {
        // Reported by the list itself: this page has no error banner of its own
        setVatCalculationsError(error?.message || 'Could not load your saved VAT calculations.')
      }
    },[getFromApi])

    // Removes one of the user's saved VAT calculations, as above
    const deleteVatCalculation = useCallback(async (calculationId) => {
      const data = await deleteFromApi(`/vat/history/${calculationId}`, 'Failed to remove the VAT calculation.');

      // Drop the deleted calculation from the list on screen
      setVatCalculations((prev) => prev.filter((calculation) => String(calculation._id) !== String(calculationId)))
      setVatCalculationsTotal((prev) => Math.max(0, prev - 1))

      console.log('[SUCCESS: Calculations.js, deleteVatCalculation] Removed VAT calculation', calculationId);//Log a success message in the console for debugging purposes
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
      {/* ONE TOGGLE BUTTON PER LIST: only one list is open at a time, so a
      button that is already showing its list closes it again */}
      {CALCULATION_LISTS.map((list) => {
        const isOpen = visibleList === list.key
        return (
          <div className="p-2" key={list.key}>
            <Button
            variant='light'
            id={list.buttonId}
            type='button'
            onClick={() => toggleList(list.key)}
            // ARIA ATTRIBUTES:
            aria-label={isOpen ? 'Hide Calculations' : list.label}
            aria-controls={list.controls}
            aria-pressed={isOpen}
            aria-expanded={isOpen}
            >
              {isOpen ? 'Hide Calculations' : list.label}
            </Button>
          </div>
        )
      })}
    </Stack>
        </Col>
        <Col id='toggle-calculations-col2'/>
      </Row>
      {/* Tax Calculations */}
      {visibleList === 'tax' && (
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
      {/* Provisional Tax (IRP6) Calculations */}
      {visibleList === 'provisional' && (
        <div id='prov-tax-calculations-panal'>
          <Row id='prov-tax-calculations-row'>
            <Col id='prov-tax-calculations-col'>
              {/* SAVED PROVISIONAL TAX CALCULATIONS COMPONENT */}
              <ProvisionalTaxCalculations
                loggedIn={loggedIn}
                fetchProvTaxCalculations={fetchProvTaxCalculations}
                provTaxCalculations={provTaxCalculations}
                provTaxCalculationsTotal={provTaxCalculationsTotal}
                deleteProvTaxCalculation={deleteProvTaxCalculation}
                loadError={provTaxCalculationsError}
              />
            </Col>
          </Row>
        </div>
      )}
      {/* VAT Calculations */}
      {visibleList === 'vat' && (
        <div id='vat-calculations-panal'>
          <Row id='vat-calculations-row'>
            <Col id='vat-calculations-col'>
              {/* SAVED VAT CALCULATIONS COMPONENT */}
              <VatCalculations
                loggedIn={loggedIn}
                fetchVatCalculations={fetchVatCalculations}
                vatCalculations={vatCalculations}
                vatCalculationsTotal={vatCalculationsTotal}
                deleteVatCalculation={deleteVatCalculation}
                loadError={vatCalculationsError}
              />
            </Col>
          </Row>
        </div>
      )}
      {/* Interest Calculations */}
      {visibleList === 'interest' && (
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
            </div>


        </section>
        <Footer
            logout={logout}
        />
    </div>
  )
}
