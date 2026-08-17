import React from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Users.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function TaxData({currentUser, logout}) {
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} pageHeader={'ADMIN'}/>
        <section id='admin-section1'>
          {/* EDIT TAX DATA FORM */}
          <Row id='toggle-tax-update-row'>
        <Col/>
        <Col xs={6} id='toggle-tax-formCol'>
          <div className='toggle-div'>
            <Button variant='warning'>
              UPDATE TAX DATA
            </Button>
          </div>
        </Col>
        <Col/>
      </Row>

        </section>
      <Footer logout={logout}/>
    </div>
  )
}
