import React, { useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Dashboard.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Button from 'react-bootstrap/Button';
import Header from '../components/Header'
import Footer from '../components/Footer'


export default function Dashboard({currentUser, logout}) {
  const [key, setKey] = useState('home');
  const [showChangeTaxYear, setShowChangeTaxYear] =useState(false)

  const toggleChangeTaxYear = () => setShowChangeTaxYear((prev) => !prev)
  return (
    <div id='pageContainer' role='main'>
      <Header currentUser={currentUser} pageHeader={'DASHBOARD'}/>
      <section id='dashBoardSec1'>
        <div id='dashboard-panal'>
          <Tabs
            id="dashboard-tab"
            activeKey={key}
            onSelect={(k) => setKey(k)}
            
          >
            <Tab eventKey="home" title="Home">
              Tab content for Home
            </Tab>
            <Tab eventKey="profile" title="Profile">
              Tab content for Profile
            </Tab>
            <Tab eventKey="taxRef" title="TAX YEAR REFERENCE">
            <div>
         <Row id='tax-year-head-row'>
        <Col id='taxYearHeadCol1'/>
        <Col xs={6} id='taxYearHeadCol'>
          <span id='tax-year-span'><h4 id='tax-year-head'>TAX YEAR:</h4><h4 id='current-tax-year'> 2025/2026</h4></span>
        </Col>
        <Col id='taxYearHeadCol2'>
         
          
        </Col>
      </Row>
      <Row>
        <Col>
          {/* DISPLAY CURRENT TAX YEAR DATA FROM FORM */}
        </Col>
      </Row>
<Row id='change-tax-year-row'>
        <Col id='change-tax-year-col1'></Col>
        <Col xs={6} id='change-tax-year-toggle'>
           <div id='toggle-tax-year-div'>
            <Button variant='warning' id='toggle-tax-year-btn' onClick={toggleChangeTaxYear}>CHANGE TAX YEAR</Button>
          {showChangeTaxYear && (
            <div id='change-tax-year-panal'>
              <form id='change-tax-year-form'>
                <div>
                  <Stack gap={3}>
                  <div className="p-2" id='edit-year-block'>
                    <label className='edit-taxyear-label'>TAX YEAR</label>
                    <input
                      id='edit-taxyear-input'
                    />
                  </div>
                  <div className="p-2">
                    <Button
                    variant='warning'
                    >CHANGE YEAR</Button>
                  </div>
                 
              </Stack>
                </div>


              </form>
            </div>
          )}
          </div>
          
        </Col>
        <Col></Col>
      </Row>
            </div>
       

            </Tab>
          </Tabs>

        </div>
      </section>
      <Footer logout={logout}/>
    </div>
  )
}
