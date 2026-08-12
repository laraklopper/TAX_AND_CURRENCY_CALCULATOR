import React, { useCallback } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/LoggedOut.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import MainHeader from '../components/MainHeader'
import LoginForm from '../components/LoginForm';

export default function Login({userData, setUserData, setError, loggedIn, setLoggedIn, setCurrentUser}) {

  const submitLogin = useCallback(async () => {
    try {
      setError(null);// Clear previous error before trying again
      //Send a POST request to the /auth/login endpoint
      const response = await fetch('http://localhost:3001/auth/login', {
        method: 'POST',//HTTP request method
        mode: 'cors',//Enable CORS for Cross Origin Resource Sharing
        headers: {
          'Content-Type': 'application/json' //Specify the Content-Type in the payload as JSON
        },
        body: JSON.stringify({// Convert payload to JSON string
          email: userData.email,
          password: userData.password
        })
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        localStorage.setItem('email', userData.email)
        localStorage.setItem('loggedIn', true)
        localStorage.setItem('token', data.token);/* Store the authentication token received
        from the server in the localStorage under the key 'token'*/
        setLoggedIn(true);//Set the setLoggedIn State to true
        setCurrentUser({ userId: data.userId, fullName: data.fullName, isAdmin: data.isAdmin });
        setError(null);//Clear any previous error messages

      } else {
        setError(data.message || 'Login failed. Please try again.');

      }
    } catch (error) {
      setError('An error occurred during login. Please try again.');
      setLoggedIn(false)
      console.error('[ERROR: Login.js]: Login error:', error);
    }
  },[setError, userData, setLoggedIn, setCurrentUser])
  return (
    <div id='pageContainer' role='main'>
      <MainHeader mainHeading='LOGIN'/>
      <section id='login-section1'>
        <Row id='loginRow'>
        <Col id='login-col1'/>
        <Col xs={6} id='login-col'>
          <div id='login-panal'>
            <LoginForm
              userData={userData}
              setUserData={setUserData}
              submitLogin={submitLogin}
            />
          </div>
        </Col>
        <Col id='login-col2'/>
      </Row>
      </section>
    </div>
  )
}
