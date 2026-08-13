import React from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/CurrencyConvert.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Header from '../components/Header'
import Footer from '../components/Footer'
import CurrencyConvertForm from '../components/CurrencyConvertForm';

export default function CurrencyConverter({currentUser, logout}) {
  return (
    <div id='pageContainer' role='main'>
      <Header currentUser={currentUser} pageHeader={'CURRENCY CONVERTER'}/>
      <section id='currency-converter-sec1'>
        
        <Row>
        <Col/>
        <Col xs={6}>
          <div id='currency-converter-panal'>
{/*Currency Converter form  */}
<CurrencyConvertForm/>
          </div>
        </Col>
        <Col/>
      </Row>

      </section>
      <Footer logout={logout}/>
    </div>
  )
}
