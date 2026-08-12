import React, { useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/LoggedOut.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import MainHeader from '../components/MainHeader'
import RegistrationForm from '../components/RegistrationForm';
export default function Registration() {
  const [newUserData, setNewUserData] = useState({
    fullName: {
      firstName: '',
      lastName: '',
    },
    email: '',
    dateOfBirth: '',
    admin: false,
    password: '',
  })

  return (
    <div id='pageContainer' role='main'>
      <MainHeader mainHeading='REGISTRATION'/>
      <section id='regisSection1'>
        <Row id='regisRow'>
        <Col id='regisCol'>
          <div id='regis-panal'>
            <RegistrationForm/>
          </div>
        </Col>
      </Row>
      </section>
    </div>
  )
}
