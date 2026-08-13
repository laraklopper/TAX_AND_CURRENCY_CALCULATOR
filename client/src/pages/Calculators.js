import React from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Calculators.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Calculators({currentUser, logout}) {
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} pageHeader={'CALCULATORS'}/>
      <section id='calculatorSec1'>
      <Row id='toggleCalculatorRow'>
        <Col>1 of 3</Col>
        <Col xs={5}>
          <div id='calc-toggle-div'>

          </div>
        </Col>
        <Col>3 of 3</Col>
      </Row>
        <Row id='calculatorRow'>
         <Col xs={3} md={2}>
        
        </Col>
        <Col xs={12} md={8}>
          xs=12 md=8
        </Col>
        <Col xs={3} md={2}>
        
        </Col>
      </Row>
      </section>
      <Footer logout={logout}/>
    </div>
  )
}
