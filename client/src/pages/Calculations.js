import React, { useCallback, useState } from 'react'
import '../css/pagesCss/Calculations.css'
import '../css/pagesCss/PageSetup.css'
// BOOTSTRAP COMPONENTS
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Calculations({currentUser, logout}) {
    const [showTaxCalculations, setShowTaxCalculations] =useState(false)
    const [showVatCalculations, setShowVatCalculations] = useState(false)
     const [showInterestCalculations, setShowInterestCalculations] = useState(false)

     // Function to toggle taxCalculations List
     const toggleTaxCalculations = useCallback(() => {
        setShowTaxCalculations(prev => !prev)
        setShowInterestCalculations(false)
        setShowVatCalculations(false)
     },[])

     //Function to toggle Interest calculations list
    const toggleInterestCalculations = useCallback(() => {
        setShowInterestCalculations(prev => !prev)
        setShowTaxCalculations(false)
        setShowVatCalculations(false)
    },[])

    //Function to toggle Interest calculations list
    const toggleVatCalculations = useCallback(() => {
    setShowVatCalculations(prev => !prev)
    setShowTaxCalculations(false)
    setShowInterestCalculations(false)
    },[])

    //===============JSX RENDERING================
  return (
    <div id='pageContainer'>
        <Header pageHeader={'CALCULATIONS'} currentUser={currentUser}/>
        <section id='calculations-section1'>
            <div id='calculations-tab-panal'>
    <Row id='toggle-calculation-list-row'>
        <Col id='toggle-calculations-col1'/>
        <Col xs={6} id='toggle-calculations-col'>
            <Stack gap={3} id='toggleCalculations-stack'>
      <div className="p-2" id='show-calculations-block1'>
        <Button
        variant='light'
        id='showTax-calculationsBtn'
        onClick={toggleTaxCalculations}
        >
           {showTaxCalculations ? 'Hide Calculations': 'SHOW TAX CALCULATIONS'}
        </Button>
      </div>
      <div className="p-2" id='show-calculations-block2'>
        <Button
        variant='light'
        type='button'
        id='showInterest-calculationsBtn'
        onClick={toggleInterestCalculations}
        >
            {showInterestCalculations ? 'Hide Calculations': 'SHOW INTEREST CALCULATIONS'}
        </Button>
      
      </div>
      <div className="p-2" id='show-calculations-block3'>
          <Button
            variant='light'
            id='showVatCalculationsBtn'
            type='button'
            onClick={toggleVatCalculations}
          >
            {showVatCalculations ? 'Hide Calculations' : 'Show Vat Calculations'}
        </Button>
      </div>
    </Stack>
        </Col>
        <Col id='toggle-calculations-col2'/>
      </Row>
      {/* Tax Calculations */}
      {/* Interest Calculations */}
      {/* VAT Calculations */}

            </div>
        

        </section>
        <Footer
            logout={logout}
        />
    </div>
  )
}
