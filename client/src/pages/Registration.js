import React, { useCallback, useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/LoggedOut.css'
import '../css/componentCss/Footer.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';

import MainHeader from '../components/MainHeader'
import RegistrationForm from '../components/RegistrationForm';
import { useNavigate } from 'react-router-dom';
export default function Registration({setError}) {
  const [newUserData, setNewUserData] = useState({
    fullName: {
      firstName: '',
      lastName: '',
    },
    email: '',
    dateOfBirth: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      province: '',
    },
    admin: false,
    password: '',
  })

  const navigate = useNavigate();

  const addUser = useCallback(async () => {
    try {
      setError?.(null);
      const response = await fetch(`http://localhost:3001/auth/register`,{
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: newUserData.fullName,
          email: newUserData.email,
          dateOfBirth: newUserData.dateOfBirth,
          address: newUserData.address,
          admin: newUserData.admin,
          password: newUserData.password
        })
      })
  
      const data = await response.json().catch(() => ({}))

      if (response.ok) {
        setError?.(null)
        alert('New user successfully registered')
        navigate('/')//Navigate back to Login Page after successful registration
      } else {
        const message = data.message || 'Registration failed.';
        setError?.(message);
        console.error(`Registration failed: ${message}`);
      }
    } catch (error) {
      alert('Registration failed. Please try again.');
      setError?.(`Registration failed: ${error.message}`);
      console.error(`Registration failed: ${error.message}`);
    }
  },[navigate, newUserData, setError])
  //=================JSX RENDERING=======================
  return (
    <div id='pageContainer' role='main'>
      <MainHeader mainHeading='REGISTRATION'/>
      <section id='regisSection1'>
        <Row id='regisRow'>
        <Col id='regisCol'>
          <div id='regis-panal'>
            <RegistrationForm
              newUserData={newUserData}
              setNewUserData={setNewUserData}
              addUser={addUser}
            />
          </div>
        </Col>
      </Row>
      </section>
      <footer className='pageFooter'>
        <Row id='footerRow1'>
          <Col id='footer-col1'>
            <Stack direction="horizontal" gap={3} id='page-footer-stack'>
      <div className="p-2"></div>
      <div className="p-2 ms-auto"></div>
      <div className="p-2"></div>
    </Stack>
          </Col>
        </Row>
         {/* Row 3: CopyRight Information */}
      <Row id='copyRightRow'>
        <Col xs={0} md id='copyRightCol1'/>
        <Col xs={12} md={4} id='copyRightCol'>
          <div id='copyright-div' >
            <p id='copyrightText' aria-label='copy right details' aria-live='polite' >© 2026 Tax Calculator App. All rights reserved.</p>
          </div>
        </Col>
        <Col xs={0} md id='copyRightCol2'/>
      </Row>
      </footer>
    </div>
  )
}
