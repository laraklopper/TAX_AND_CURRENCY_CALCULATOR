import React from 'react'
import '../css/pagesCss/TaxCalculators.css'
import '../css/pagesCss/PageSetup.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Header from '../components/Header'
import Footer from '../components/Footer'
export default function TaxPage({currentUser, logout}) {
  return (
    <div id='pageContainer'>
        <Header pageHeader={'TAX'} currentUser={currentUser}/>
        <section>
            
        </section>
          <section id='disclaimerSection'>
          <Row id='disclaimerRow'>
            <Col id='disclaimerCol'></Col>
            </Row>
            </section>
        <Footer logout={logout}/>
    </div>
  )
}
