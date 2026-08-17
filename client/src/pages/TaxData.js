import React, { useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Users.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Header from '../components/Header'
import Footer from '../components/Footer'
import AddTaxDataForm from '../components/AddTaxDataForm';

export default function TaxData({currentUser, logout}) {
   const [showTaxForm, setShowTaxForm] = useState(false)

   const toggleTaxDataForm = () => setShowTaxForm((prev) => !prev)

  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} pageHeader={'ADMIN'}/>
        <section id='admin-section1'>
          {/* ADD/EDIT TAX DATA FORM */}
          <Row id='toggle-tax-update-row'>
        <Col/>
        <Col xs={6} id='toggle-tax-formCol'>
          <div className='toggle-div'>
            <Button variant='warning' onClick={toggleTaxDataForm}>
              ADD/UPDATE TAX DATA
            </Button>
          </div>
        </Col>
        <Col/>
      </Row>
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
