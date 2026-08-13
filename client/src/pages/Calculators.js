import React, { useCallback, useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Calculators.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Header from '../components/Header'
import Footer from '../components/Footer'

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
         <Col xs={3} md={2}>
        
        </Col>
        <Col xs={12} md={8} id='calculatorCol'>
          <div id='calculators-div'>
            {/* TAX CALCULATOR */}
            {showTaxCalc && (
              <div id='tax-calculator-panal'>


              </div>
            )}
            {/* INTEREST CALCULATOR */}
            {showIntCalc &&(
              <div id='int-calculator-panal'></div>
            )}
            {/* BASIC CALCULATOR */}
            {showCalc && (
              <div id='calculator-panal'></div>
            )}

          </div>
        </Col>
        <Col xs={3} md={2}>
        
        </Col>
      </Row>
      </section>
      <Footer logout={logout}/>
    </div>
  )
}
