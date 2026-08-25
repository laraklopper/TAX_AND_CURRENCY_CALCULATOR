//Registration.js
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useCallback, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/LoggedOut.css'
// IMPORT BOOTSTRAP COMPONENTS
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
// IMPORT CUSTOM COMPONENTS
import MainHeader from '../components/MainHeader'
import RegistrationForm from '../components/RegistrationForm';
import PageFooter from '../components/PageFooter';
// IMPORT REACT-ROUTER COMPONENTS/HOOKS
import { useNavigate } from 'react-router-dom';
// IMPORT UTILITY FUNCTIONS
import { emptyNewUserData } from '../utils/userFunc'

//============MAIN REGISTRATION COMPONENT=============
export default function Registration(//Export default Registration function component
  {//PROPS PASSED FROM PARENT COMPONENT (App.js)
    setError
  }) {
  // =========STATE VARIABLES=============
  const [newUserData, setNewUserData] = useState(emptyNewUserData)

  //======================NAVIGATION HOOK========================
  const navigate = useNavigate();// Hook to navigate between different Pages

  //======================CALLBACKS/REQUEST FUNCTIONS========================
  //Function to register a new user
  //send registration request to 'http://localhost:3001/auth/register'
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
      <PageFooter/>
    </div>
  )
}
