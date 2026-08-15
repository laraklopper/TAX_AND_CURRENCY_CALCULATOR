import React from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Profile.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Profile({currentUser, logout}) {
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} pageHeader={'PROFILE'}/>
      <section id='profile-section1'>
      <div>
       
        <Row>
        <Col xs={6}>
           <Stack gap={3}>
      <div className="p-2">
        {/* Full Name */}
      </div>
      <div className="p-2">
        {/* Date of Birth */}
      </div>
    </Stack>
        </Col>
        <Col xs={6}>
           <Stack gap={3}>
      <div className="p-2">
        {/* Email */}
      </div>
      <div className="p-2">
        {/* Is admin */}
      </div>
    </Stack>
        </Col>
      </Row>
      {/* EDIT USER AND EDIT PASSWORD FORMS */}
       <Row>
          <Col>
            <Stack direction="horizontal" gap={3}>
      <div className="p-2"></div>
      <div className="p-2 ms-auto">
        {/* TOGGLE EDIT USER BUTTON */}
        <Button>EDIT DETAILS</Button>
      </div>
      <div className="vr" />
      <div className="p-2">
        {/* TOGGLE EDIT PASSWORD BUTTON */}
        <Button>EDIT PASSWORD</Button>
      </div>
    </Stack>
          </Col>
        </Row>
      </div>
      {/* EDIT PROFILE FORM */}
      {/* <div>
      </div> */}
      </section>
      <Footer logout={logout}/>
    </div>
  )
}
