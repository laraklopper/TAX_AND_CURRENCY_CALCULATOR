import React, { useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Dashboard.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import Button from 'react-bootstrap/Button';
import Header from '../components/Header'
import Footer from '../components/Footer'
import ChangeTaxYearForm from '../components/ChangeTaxYearForm';
import TaxDataDisplay from '../components/TaxDataDisplay';


export default function Dashboard({currentUser, logout}) {
  const [showChangeTaxYear, setShowChangeTaxYear] =useState(false)

  const toggleChangeTaxYear = () => setShowChangeTaxYear((prev) => !prev)
  return (
    <div id='pageContainer' role='main'>
      <Header currentUser={currentUser} pageHeader={'DASHBOARD'}/>
      <section id='dashBoardSec1'>
          <div id='dashboard-panal'>
         <Row id='tax-year-head-row'>
        <Col id='taxYearHeadCol1'/>
        <Col xs={6} id='taxYearHeadCol'>
          <span id='tax-year-span'><h4 id='tax-year-head'>TAX YEAR:</h4><h4 id='current-tax-year'> 2025/2026</h4></span>
          {/* <span id='tax-year-span'><h4 id='tax-year-head'>TAX YEAR:</h4><h4 id='current-tax-year'> {currentTaxYear}</h4></span> */}
        </Col>
        <Col id='taxYearHeadCol2'/>
      </Row>
      <Row id='tax-year-data-row'>
        <Col id='tax-year-data-col'>
          {/* DISPLAY CURRENT TAX YEAR DATA FROM FORM */}
          <TaxDataDisplay/>
        </Col>
      </Row>
      
            </div>
      </section>
     {/* ONLY MAKE THE SECTION AVAILABLE TO ADMIN USERS */}
      {currentUser.admin &&(
        <section id='dashBoardSec2'>
      <Row id='change-tax-year-row'>
        <Col id='change-tax-year-col1'></Col>
        <Col xs={6} id='change-tax-year-toggle-col'>
           <div id='toggle-tax-year-div'>
           
            <Button 
              variant='warning' 
              id='toggle-tax-year-btn' 
              onClick={toggleChangeTaxYear}
              type='button'
              // ARIA ATTRIBUTES:
              aria-label={showChangeTaxYear ? 'Hide': 'Change Tax Year'}
              aria-controls='change-tax-year-panal'
              aria-pressed={showChangeTaxYear}
              aria-expanded={showChangeTaxYear}
              >
                {showChangeTaxYear ? 'Hide': 'Change Tax Year'}
              </Button>
      {/* TOGGLE CHANGE TAX YEAR FORM
      (only available to admin users)
       */}
          {showChangeTaxYear && (
            <div id='change-tax-year-panal'>
              <ChangeTaxYearForm/>
            </div>
          )}
          </div>
        </Col>
        <Col id='change-tax-year-col2'></Col>
      </Row>
      </section>
         )}
      <Footer logout={logout}/>
    </div>
  )
}
