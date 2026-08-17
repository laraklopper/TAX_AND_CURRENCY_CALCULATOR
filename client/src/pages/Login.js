import React, { useCallback } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/LoggedOut.css'
import '../css/componentCss/Footer.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
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
        setCurrentUser(data.user);// Server returns the full user object under `user`
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
