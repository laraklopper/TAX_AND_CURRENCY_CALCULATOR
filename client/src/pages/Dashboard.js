import React, { useState, useCallback } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Dashboard.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import Header from '../components/Header'
import Footer from '../components/Footer'
import AdminRegisForm from '../components/AdminRegisForm';
import { calculateAge } from '../utils/timeFunctions';
import { ADMIN_MIN_ACCOUNT_AGE_MS, ADMIN_MIN_AGE } from '../utils/userFunc';

import { Percent } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard({currentUser, setCurrentUser, setError, logout}) {
    const dismissKey = `adminFormDismissed_${currentUser?._id}`
    const [adminFormDismissed, setAdminFormDismissed] = useState(
      () => localStorage.getItem(dismissKey) === 'true'
    )
  const { fullName} = currentUser || {}

    /* Function to display/render AdminRegisForm.js if user is not an admin user
    and matches the age requirement of 21 years and has been a user for 3 months 
    (1 day during development) */
    const showAdminForm = Boolean(
      currentUser &&
      !currentUser.admin &&
      !adminFormDismissed &&
      currentUser.dateOfBirth &&
      calculateAge(currentUser.dateOfBirth) >= ADMIN_MIN_AGE &&
      currentUser.createdAt && 
      Date.now() - new Date(currentUser.createdAt).getTime() >= ADMIN_MIN_ACCOUNT_AGE_MS
    )

  // Hide the form and remember the choice so it is not displayed again
  const exitAdminForm = useCallback(() => {
    localStorage.setItem(dismissKey, 'true')
    setAdminFormDismissed(true)
  },[dismissKey])
  return (
    <div id='pageContainer' role='main'>
      <Header currentUser={currentUser} pageHeader={'DASHBOARD'}/>
      <Row id='event-row' role='presentation'>
        <Col id='event-col'>
          <div className='event-bar'>
            <div className='event-track'>
              <Percent className='event-slide' size={32} aria-hidden='true' focusable='false'/>
            </div>
          </div>
        </Col>
      </Row>
      <section id='dashBoardSec1'>
          <div id='dashboard-panal'>
            <Row id='dashboardRow1'>
              <Col id='dashBoardCol1'>
               
              <Stack direction="horizontal" gap={3}>
      <div className='p-2'>
        <span>
        <label>SIGNED IN AS:</label>
        <p>{fullName?.firstName} {fullName?.lastName}</p>
        <p></p>
      </span>
      </div>
      <div className="p-2 ms-auto"></div>
      <div className="vr" />
      <div className="p-2">
      {/* state whether the user is signed in as Admin or user */}
      <span>
        <label>SIGNED IN AS</label>
        <p>{/*ADMIN/USER*/}</p>

      </span>
      </div>
    </Stack>
   <Stack direction="horizontal" gap={3}>
      <div className="p-2">
        <span className='paraSpan'>
        <p className='dashboardPara'>  
        Calculate South African personal income tax (SARS rates) Convert between currencies using live exchange rates
            Calculate simple/compound interest on savings or loans.
        </p>

        </span>
        
      </div>
      <div className="p-2" id='pageLinksBlock'>
      <div className='pageLinkDiv'>
          {/* Link to Tax Data '/taxData' page */}
          <Link></Link>
        </div>
        <div className='pageLinkDiv'> 
        {/* Link to TaxCalculators '/taxCalculators' Page */}
        <Link></Link>
        </div>
        <div className='pageLinkDiv'>
          {/* Link to Currency converter '/currencyConverter' page */}
          <Link></Link>
        </div>
      </div>
      <div className="p-2">
      
      {/* WEB LINK TO SARS PAGE  */}
          <span className='web-link-item'>
            <a  target='blank'
            href='https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/' 
            className='web-Link'>https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/</a>
          </span>
      </div>
    </Stack>

              </Col>
              
            </Row>
   
    
            </div>
      </section>
     {/* SECTION 2: TOGGLE ADMIN REGISTRATION FORM
      Only display form (and section) if user is not an admin user 
      and matches the age requirement of 21 years and has been a user 
      for 3 months (1 day during development) */}
      {showAdminForm && (
        <section id='dashBoardAdminSec'>
          <Row id='adminFormRow'>
            <Col id='adminFormCol1'/>
            <Col xs={12} md={10} id='adminFormCol'>
              <div id='adminFormPanal'>
                {/* Render the AdminRegisForm.js component */}
                <AdminRegisForm
                  setCurrentUser={setCurrentUser}
                  setError={setError}
                  exitAdminForm={exitAdminForm}
                />
              </div>
            </Col>
            <Col id='adminFormCol2'/>
          </Row>
        </section>
      )}
      <Footer logout={logout}/>
    </div>
  )
}
