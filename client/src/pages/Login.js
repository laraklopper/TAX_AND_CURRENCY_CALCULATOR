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

  /* Clear any half-finished session. Called whenever a login attempt does not
  end in a usable token, so a stale token from an earlier session is never left
  behind for the authenticated requests in App.js to pick up. */
  const clearStoredSession = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('loggedIn');
    setLoggedIn(false);
  }, [setLoggedIn])

  const submitLogin = useCallback(async () => {
    /* The server looks the user up by the normalised email, so send and store
    the same normalised value rather than whatever casing was typed. */
    const email = String(userData.email || '').trim().toLowerCase();
    const password = String(userData.password || '');

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
          email,
          password
        })
      });

      const data = await response.json().catch(() => ({}));

      // A failed login leaves nothing stored and reports the server's reason
      if (!response.ok) {
        clearStoredSession();
        setError(data.message || 'Login failed. Please try again.');
        return;
      }

      /* A 200 without a token is not a usable login: storing an absent token
      writes the string "undefined", which passes the token checks in App.js and
      is then sent as `Bearer undefined` on every authenticated request. */
      if (typeof data.token !== 'string' || !data.token) {
        clearStoredSession();
        setError('Login failed: no authentication token was returned.');
        console.error('[ERROR: Login.js]: Login response did not include a token');
        return;
      }

      localStorage.setItem('email', email)
      localStorage.setItem('loggedIn', 'true')// localStorage only holds strings
      localStorage.setItem('token', data.token);/* Store the authentication token received
      from the server in the localStorage under the key 'token'*/
      /* Only trust a user object; App.js re-fetches the current user from
      /users/me once loggedIn flips, so an absent one is not fatal. */
      if (data.user && typeof data.user === 'object') {
        setCurrentUser(data.user);// Server returns the full user object under `user`
      }
      setLoggedIn(true);//Set the setLoggedIn State to true
      setError(null);//Clear any previous error messages
      // Drop the password from state now it has been sent
      setUserData((prev) => ({ ...prev, password: '' }))
    } catch (error) {
      clearStoredSession();
      setError('An error occurred during login. Please try again.');
      console.error('[ERROR: Login.js]: Login error:', error);
    }
  },[userData.email, userData.password, setUserData, setError, setLoggedIn, setCurrentUser, clearStoredSession])
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
