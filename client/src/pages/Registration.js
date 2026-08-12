import React, { useCallback, useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/LoggedOut.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
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
          preferences: newUserData.preferences,
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
          <Col></Col>
        </Row>
      </footer>
    </div>
  )
}
