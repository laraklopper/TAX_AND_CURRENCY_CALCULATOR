//TaxPage.js
//IMPORT REQUIRED MODULES AND PACKAGES
import React from 'react'
// IMPORT CSS STYLESHEETS
import '../css/pagesCss/TaxCalculators.css'
import '../css/pagesCss/TaxDataInfo.css'
import '../css/pagesCss/PageSetup.css'
// IMPORT BOOTSTRAP COMPONENTS
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
//IMPORT CUSTOM COMPONENTS
import Header from '../components/Header'
import Footer from '../components/Footer'
import Disclaimer from '../components/Disclaimer';
import TaxDataDisplay from '../components/TaxDataDisplay';
import { NotebookText  } from 'lucide-react';
//=======MAIN TaxPage Component==========
export default function TaxPage(//Export default TaxPage.js component
  {//PROPS PASSED FROM PARENT COMPONENT(App.js)
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
         {/*===============EVENT/ANIMATION============================ */}
        <Row id='event-row' role='presentation'>
          <Col id='event-col'>
            <div className='event-bar'>
            <div className='event-track'>
            <NotebookText  className='event-slide' size={32} aria-hidden='true' focusable='false' />
            </div>
            </div>
          </Col>
        </Row>
        {/* SECTION 1 */}
        <section id='taxDataSec1'>
            <Row id='taxDataRow'>
              <Col id='taxDataCol'>
                <div id='taxDataPanal'>
                  <TaxDataDisplay/>
                </div>
              </Col>
            </Row>
        </section>
        {/* DISCLAIMER SECTION */}
          <section id='disclaimerSection'>
          <Row id='disclaimerRow'>
            <Col id='disclaimerCol'>
              <Disclaimer loggedIn={loggedIn}/>
            </Col>
            </Row>
            </section>
            {/* ==========FOOTER========= */}
        <Footer logout={logout}/>
    </div>
  )
}
