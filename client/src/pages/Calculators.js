import React, { useCallback, useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Calculators.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Header from '../components/Header'
import Footer from '../components/Footer'
import NumberCalculator from '../components/NumberCalculator';
import TaxCalculator from '../components/TaxCalculator';
import InterestCalc from '../components/InterestCalc';

export default function Calculators({currentUser, logout}) {
  const [showTaxCalc, setShowTaxCalc] = useState(false)
  const [showIntCalc, setShowIntCalc] = useState(false)
  const [showCalc, setShowCalc] = useState(false)

  //========================================
  const toggleTaxCalc = useCallback(() => {
    setShowTaxCalc(prev => !prev)
    setShowCalc(false)
    setShowIntCalc(false)
  },[])
   const toggleInterestCalculator = useCallback(() => {
    setShowIntCalc(prev => !prev)
    setShowCalc(false)
    setShowTaxCalc(false)
   },[])
   const toggleCalculator = useCallback(() => {
    setShowCalc(prev => !prev)
    setShowIntCalc(false)
    setShowTaxCalc(false)
   },[])
  // ============================================
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} pageHeader={'CALCULATORS'}/>
      <section id='calculatorSec1'>
      <Row id='toggleCalculatorRow'>
        <Col id='toggleCalcCol1'/>
        <Col xs={5} id='toggleCalcCol'>
             <Stack gap={3} id='toggleCalculatorStack'>
              <div className="p-2" id='toggle-calc1-block'>
                <Button variant='light' onClick={toggleTaxCalc} id='toggleTaxCalcBtn' >TAX CALCULATOR</Button>
              </div>
              <div className="p-2" id='toggle-calc2-block'>
                <Button variant='light' onClick={toggleInterestCalculator} id='toggleIntCalcBtn'>INTEREST CALCULATOR</Button>
              </div>
              <div className="p-2" id='toggle-calc3-block'>
                <Button variant='light' onClick={toggleCalculator} id='toggleCalcBtn'>CALCULATOR</Button>
              </div>
            </Stack>
        </Col>
        <Col id='toggleCalcCol2'/>
      </Row>
        <Row id='calculatorRow'>
         <Col id='calculatorCol1'/>
        <Col xs={6} id='calculatorCol'>
          <div id='calculators-div'>
            {/* TAX CALCULATOR */}
            {showTaxCalc && (
              <div id='tax-calculator-panal'>
                <TaxCalculator/>
              </div>
            )}
            {/* INTEREST CALCULATOR */}
            {showIntCalc &&(
              <div id='int-calculator-panal'>
                <InterestCalc/>
              </div>
            )}
            {/* BASIC CALCULATOR */}
            {showCalc && (
              <div id='calculator-panal'>
                <NumberCalculator/>
              </div>
            )}

          </div>
        </Col>
        <Col id='calculatorCol2'/>
      </Row>
      {/* Row 2:Calculator Information/Messages */}
            <Row id='info-msg-row'>
                <Col xs={0} md id='info-msg-col1'/>
                <Col xs={12} md={6} id='info-msg-col'>
                    <div id='info-msg-div'>
                        <span className='info-msg-span'>
                            {/* Display default (SOUTH AFRICAN)15% tax rate */}
                            <h6 className='calculator-info-text'>INTEREST PERIOD CALCULATED IN MONTHS</h6>
                            <h6 className='calculator-info-text'>DEFAULT TAX RATE IS SET TO SOUTH AFRICAN 15% TAX RATE</h6>
                        </span>
                    </div>
                </Col>
                <Col xs={0} md id='info-msg-col1'/>
            </Row>

      </section>
      <Footer logout={logout}/>
    </div>
  )
}
