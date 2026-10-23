import React from 'react'
import '../css/pagesCss/TaxCalculators.css'
import '../css/pagesCss/PageSetup.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Header from '../components/Header'
import Footer from '../components/Footer'
import Disclaimer from '../components/Disclaimer';
export default function TaxPage({currentUser, logout, loggedIn}) {
  return (
    <div id='pageContainer'>
        <Header pageHeader={'TAX'} currentUser={currentUser}/>
        <section>
            
        </section>
          <section id='disclaimerSection'>
          <Row id='disclaimerRow'>
            <Col id='disclaimerCol'>
              <Disclaimer loggedIn={loggedIn}/>
            </Col>
            </Row>
            </section>
        <Footer logout={logout}/>
    </div>
  )
}
