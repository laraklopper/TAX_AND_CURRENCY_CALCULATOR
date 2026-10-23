import React from 'react'
import '../css/pagesCss/TaxCalculators.css'
import '../css/pagesCss/TaxDataInfo.css'
import '../css/pagesCss/PageSetup.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Header from '../components/Header'
import Footer from '../components/Footer'
import Disclaimer from '../components/Disclaimer';
import TaxDataDisplay from '../components/TaxDataDisplay';

export default function TaxPage(
  {
    currentUser, 
    logout, 
    loggedIn
  }) {

    //==========JSX RENDERING=====================
  return (
    <div id='pageContainer' aria-labelledby='pageTitle' role='main'>
    {/* ----------Screen Reader Header------------ */}
    <p className='visually-hidden' id='pageTitle'>TAX INFORMATION PAGE</p>
    {/* ========HEADER=========== */}
    {/* Render the Header Component with 'TAX DATA' as the pageHeader */}
        <Header pageHeader={'TAX DATA'} currentUser={currentUser}/>
        <section id='taxDataSec1'>
            <Row id='taxDataRow'>
              <Col id='taxDataCol'>
                <div id='taxDataPanal'>
                  <TaxDataDisplay/>
                </div>
              </Col>
            </Row>
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
