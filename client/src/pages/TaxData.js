// TaxData.js
import React, { useCallback, useEffect, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/TaxData.css'
// IMPORT BOOTSTRAP COMPONENTS
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
// IMPORT CUSTOM COMPONENTS
import Header from '../components/Header'
import Footer from '../components/Footer'
import AddTaxDataForm from '../components/AddTaxDataForm';
import TaxDataDisplay from '../components/TaxDataDisplay';
// IMPORT ICONS FROM LUCIDE-REACT
import { HandCoins } from 'lucide-react';

// Base URL of the API this page saves the tax year configuration to
const API_BASE_URL = 'http://localhost:3001';

//============MAIN TAXDATA COMPONENT=============
export default function TaxData(//Export default TaxData.js component
  {//PROPS PASSED FROM PARENT COMPONENT (App.js)
    currentUser, 
    logout
  }
  ) {
  // ===========STATE VARIABLES===========
   const [showTaxForm, setShowTaxForm] = useState(false)
   /* The tax year configuration the form is working on. `null` puts the form in
   "add" mode, where the tax year label can be typed in; an existing
   TaxYearConfig object puts it in "update" mode, where the year is locked and
   only its brackets, rebates and thresholds can be changed. */
   const [taxConfigToEdit, setTaxConfigToEdit] = useState(null)
   /* The active tax year as the API has it, shown by the read-only display
   below the form. Left null until GET /tax/config answers, which lets
   TaxDataDisplay fall back to its own seeded figures in the meantime. */
   const [activeConfig, setActiveConfig] = useState(null)

  // =========EVENT LISTENERS===================
   const toggleTaxDataForm = () => setShowTaxForm((prev) => !prev)

  /* Loads the active tax year configuration so the display shows what is
  actually stored rather than the seeded figures. A failure is logged and left
  at that: the display has its own fallback, so a page that cannot reach the
  API still renders. */
   const loadTaxYearConfig = useCallback(async () => {
    const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
    try {
      const response = await fetch(`${API_BASE_URL}/tax/config`, {
        method: 'GET',//HTTP request method
        mode: 'cors',//Enable Cross-Origin Resource Sharing
        headers: { 'Authorization': `Bearer ${token}` }// Attach the token in the Authorization header
      })

      const data = await response.json();//Parse the response as json

      //Conditional rendering to check the request succeeded
      if (!response.ok) {
        console.error('[ERROR: TaxData.js, loadTaxYearConfig]', data.message || 'Could not load the tax year configuration.');//Log an error message in the console for debugging purposes
        return null;
      }

      console.log('[SUCCESS: TaxData.js, loadTaxYearConfig] Loaded tax year', data.config?.taxYear);
      return data.config ?? null;
    } catch (error) {
      console.error('[ERROR: TaxData.js, loadTaxYearConfig]', error.message);//Log an error message in the console for debugging purposes
      return null;
    }
   },[])

  /* Saves the payload the form assembles (a whole TaxYearConfig: taxYear,
  startDate, endDate, isActive, brackets, rebates and thresholds). The form
  awaits this and shows its own success or error banner, so this throws the
  API's own message rather than handling it here. */
   const saveTaxYearConfig = useCallback(async (payload) => {
    const token = localStorage.getItem('token');//Retrieve Jwt Token From LocalStorage
    const response = await fetch(`${API_BASE_URL}/tax/config`, {
      method: 'POST',//HTTP request method
      mode: 'cors',//Enable Cross-Origin Resource Sharing
      headers: {
        'Content-Type': 'application/json',// Specify that we're sending JSON data in the request body
        'Authorization': `Bearer ${token}`// Attach the token in the Authorization header
      },
      body: JSON.stringify(payload)// Send the tax year configuration in the request body as JSON
    })

    const data = await response.json();//Parse the response as json

    //Conditional rendering to check the request succeeded
    if (!response.ok) {
      console.error('[ERROR: TaxData.js, saveTaxYearConfig]', data.message || 'Could not save the tax year configuration.');//Log an error message in the console for debugging purposes
      throw new Error(data.message || 'Could not save the tax year configuration.');
    }

    /* Keep the form on the year that was just saved, so a follow up save
    updates it instead of trying to create it a second time. */
    if (data.config) setTaxConfigToEdit(data.config);

    // Refresh the display so a save is visible straight away
    setActiveConfig(await loadTaxYearConfig());

    return data;
   },[loadTaxYearConfig])

  /* Loads the stored configuration once on mount, before the admin opens the
  form, so the display is showing the real figures they are about to change. */
   useEffect(() => {
    let ignore = false;// Guards against setting state after the page unmounts

    loadTaxYearConfig().then((config) => {
      if (!ignore && config) setActiveConfig(config);
    })

    return () => { ignore = true }
   },[loadTaxYearConfig])

   //===============JSX RENDERING=================
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} pageHeader={'ADMIN'}/>
      <Row id='event-row'>
        <Col id='event-col'>
          <div className='event-bar'>
            <div className='event-track'>
              <HandCoins className='event-slide' size={32}/>
            </div>
          </div>
        </Col>
      </Row>
        <section id='admin-section1'>
          {/* Section 1 row 1 */}
          <Row id='toggle-tax-update-row'>
        <Col/>
        <Col xs={6} id='toggle-tax-formCol'>
          <div className='toggle-div'>
            <Button 
              variant='warning' 
              onClick={toggleTaxDataForm} 
              id='toggleTaxChangeBtn'
              type='button'
              // ARIA ATTRIBUTES:
              aria-label={showTaxForm ? 'HIDE TAX FORM': 'ADD/UPDATE TAX DATA'}
              aria-controls='change-tax-data-panal'
              aria-pressed={showTaxForm}
              aria-expanded={showTaxForm}
              >
              {showTaxForm ? 'HIDE TAX FORM': 'ADD/UPDATE TAX DATA'}
            </Button>
          </div>
        </Col>
        <Col/>
      </Row>
      {/*TOGGLE ADD/EDIT TAX DATA FORM */}
      {showTaxForm && (
          <div id='change-tax-data-panal'>
             <Row id='add-tax-data-row'>
              <Col id='add-tax-data-col'> 
                {/* PROPS PASSED TO THE CHILD COMPONENT (AddTaxDataForm.js):
                initialData - the TaxYearConfig to edit, or null to add a new year
                onSubmit - async fn the form awaits with the assembled payload */}
                <AddTaxDataForm
                  initialData={taxConfigToEdit}
                  onSubmit={saveTaxYearConfig}
                />
              </Col>
            </Row>
          </div>
        )}
        {/* CURRENT TAX YEAR DATA */}
        <Row id='tax-data-display-row'>
          <Col id='tax-data-display-col'>
            {/* taxData is left undefined until the API answers, so the
            display falls back to its own seeded figures */}
            <TaxDataDisplay taxData={activeConfig ?? undefined}/>
          </Col>
        </Row>
        </section>
      <Footer logout={logout}/>
    </div>
  )
}
