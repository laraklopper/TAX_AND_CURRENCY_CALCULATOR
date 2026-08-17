import React, { useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Dashboard.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Header from '../components/Header'
import Footer from '../components/Footer'


export default function Dashboard({currentUser, logout}) {
  const [key, setKey] = useState('home');
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
                <Row id='tax-year-head-row'>
        <Col id='taxYearHeadCol1'>1 of 3</Col>
        <Col xs={6} id='taxYearHeadCol'>
          <span><h4>TAX YEAR 2025/2026 Tax Year</h4></span>
        </Col>
        <Col id='taxYearHeadCol2'>3 of 3</Col>
      </Row>

            </Tab>
          </Tabs>

        </div>
      </section>
      <Footer logout={logout}/>
    </div>
  )
}
