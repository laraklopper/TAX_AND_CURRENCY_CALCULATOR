// TaxData.js
import React, { useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Users.css'
// IMPORT BOOTSTRAP COMPONENTS
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
// IMPORT CUSTOM COMPONENTS
import Header from '../components/Header'
import Footer from '../components/Footer'
import AddTaxDataForm from '../components/AddTaxDataForm';
import { HandCoins } from 'lucide-react';

export default function TaxData(
  {//PROPS PASSED FROM PARENT COMPONENT (App.js)
    currentUser, 
    logout
  }
  ) {
  // ===========STATE VARIABLES===========
   const [showTaxForm, setShowTaxForm] = useState(false)

  // =========EVENT LISTENERS===================
   const toggleTaxDataForm = () => setShowTaxForm((prev) => !prev)

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
                <AddTaxDataForm/>    
              </Col>
            </Row>
          </div>
        )}
        </section>
      <Footer logout={logout}/>
    </div>
  )
}
