// ForgotPassword.js
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useCallback, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/pagesCss/ForgotPassword.css'
import '../css/pagesCss/PageSetup.css'
import '../css/componentCss/Header.css'
import '../css/componentCss/FormSetup.css'
// IMPORT BOOTSTRAP COMPONENTS
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
//IMPORT COMPONENTS FROM REACT-ROUTER-DOM
import { Link } from 'react-router-dom'
// IMPORT CUSTOM COMPONENTS
import PageFooter from '../components/PageFooter';
import ResetPswdHeader from '../components/ResetPswdHeader'

// ============MAIN FORGOT PASSWORD COMPONENT============
export default function ForgotPassword() {//Export default ForgotPassword.js component
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [successMsg, setSuccessMsg] = useState('');
    const [error, setError] = useState(null)

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        setError('')
        setSuccessMsg('')
        setLoading(true)
        try {
            const response = await fetch('http://localhost:3001/auth/forgotPassword',{
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email.trim().toLowerCase() })// Clean email before sending
            })

            const data = await response.json().catch(() =>({}))

            if (response.ok) {
                setSuccessMsg(data.message || 'If that email is registered, a reset link has been sent')
                setEmail('')
            } else {
                setError(data.message || 'Something went wrong. Please try again')
            }
        } catch (error) {
            setError('Network error. Please try again')
        }finally{
            setLoading(false)
        }
        
    },[email])
    //============JSX RENDERING==========
  return (
    <div id='pageContainer' role='main' aria-labelledby='pageTitle'>
    <p id='pageTitle' className='visually-hidden'>FORGOT PASSWORD PAGE</p>
    {/* =========HEADER========= */}
    {/* Render the ResetPswdHeader.js function component 
    with 'FORGOT PASSWORD' as the resetPswdHeading */}
        <ResetPswdHeader resetPswdHeading='FORGOT PASSWORD'/>
        {/* =====================
        SECTION 1: FORGOT PASSWORD FORM + LINK TO LOGIN PAGE
        =============== */}
        <section id='forgot-password-section'>
        <Row id='forgot-password-row'>
            <Col xs={0} md id='forgot-password-col1' />
                    <Col xs={12} md={6} id='forgot-password-col'>
<div id='reset-password-panal'>
                <form onSubmit={handleSubmit} id='forgot-password-form' method='POST' aria-busy={loading} aria-labelledby='formTitle'>
                    <p className='visually-hidden' id='formTitle'>FORGOT PASSWORD FORM</p>
                    <div id='forgot-password-input'>
                         <Stack gap={3} id='forgot-pswd-stack1'>
                            <div className="p-2">
                                 <h6 id='forgotPswdHeading' aria-live='polite'>
                                    Enter your email address and will send<br/>
                                    you a link to reset your password.
                                </h6>
                            </div>
                            {/* -----SUCCESS MESSAGE------- */}
                            {successMsg && (
                                <div className="p-2">
                                    <p id='resetSuccessMsg'>{successMsg}</p>
                                </div>
                            )}
                            {/* ----ERROR MESSAGE----- */}
                            {error &&(
                                <div className="p-2">
                                    <p id='resetErrorMsg'>{error}</p>
                                </div>
                            )}
                            {/* Email input only shows before success */}
                            {!successMsg && (
                                <div className="p-2" id='newPswdInputBlock'>
                                {/* Hidden Label for accessibility */}
                                    <label 
                                        className='reset-pswd-label'
                                        htmlFor='forgot-pswd-email'
                                        hidden
                                    >EMAIL ADDRESS:</label>
                                    <input
                                        className='input'
                                        id='forgot-pswd-email'
                                        type='email'
                                        required
                                        placeholder='EMAIL ADDRESS'
                                        autoComplete='email'
                                        disabled={loading}
                                        name='email'
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        // ARIA ATTRIBUTES:
                                        aria-required='true'
                                        aria-label='Email address'
                                        aria-disabled={loading}
                                    />
                                </div>
                            )}
                        </Stack>
                        <Stack gap={3} id='forgot-pswd-stack2'>
                            {!successMsg && (
                                <div className="p-2" id='send-linkbtn-block'>
                                    <Button
                                        type='submit'
                                        variant='warning'
                                        id='sendResetPswdBtn'
                                        disabled={loading}
                                        // ARIA ATTRIBUTES:
                                        role='button'
                                        aria-label={loading ? 'SENDING...': 'SEND RESET LINK'}
                                        aria-disabled={loading}
                                        aria-busy={loading}
                                    >   
                                    {loading ? 'SENDING...': 'SEND RESET LINK'}
                                    </Button>    
                                </div>
                            )}
                            <div className="p-2" id='backToLoginBlock'>
                                <Link 
                                    id='loginLink' 
                                    to='/' 
                                    aria-label={successMsg ? 'GO TO LOGIN': 'BACK TO LOGIN'}
                                    >
                                    {successMsg ? 'GO TO LOGIN': 'BACK TO LOGIN'}
                                </Link>
                            </div>
                        </Stack>
                    </div>
                </form>
            </div>
            </Col>
            <Col xs={0} md id='forgot-password-col2' />
        </Row>
        </section>
        {/* ----FOOTER----------- */}
        <PageFooter/>
    </div>
  )
}
