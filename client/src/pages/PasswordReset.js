// ResetPassword.js
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useCallback, useState } from 'react'
import '../css/pagesCss/ForgotPassword.css'
import '../css/pagesCss/PageSetup.css'
import '../css/componentCss/FormSetup.css'
import '../css/componentCss/Header.css'
// IMPORT BOOTSTRAP COMPONENTS
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Stack from 'react-bootstrap/Stack'
import Button from 'react-bootstrap/Button'
import { useParams, Link } from 'react-router-dom'
import PageFooter from '../components/PageFooter'

//ResetPassword Function component
export default function PasswordReset() {
    const {token} = useParams()
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordMsg, setPasswordMsg] = useState(false)// Controls whether the password information message is shown
    const [loading, setLoading] = useState(false)// Tracks whether the reset request is currently running
    const [successMsg, setSuccessMsg] = useState('')// Stores success message returned by the backend
    const [error, setError] = useState('')// Stores any error message

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault()
        setError('')
        setSuccessMsg('')

        if (password !== confirmPassword) {
            setError('passwords do not match')
            return
        }

        setLoading(true)
        try {
            const response = await fetch(`http://localhost:3001/auth/resetPassword/${token}`,{
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    password
                })
            })

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                setSuccessMsg(data.message || 'Password reset successfully. You can now log in.')
                setPassword('')
                setConfirmPassword('')
            }else{
                setError(data.message || 'Something went wrong. Please try again.')
            }
        } catch (error) {
            setError('Network error. Please try again.')
        }finally{
            setLoading(false)
        }
    },[token, password, confirmPassword])

    //==================================
  return (
    <div aria-labelledby='pageTitle'>
        {/* -------Screen Reader heading------------ */}
            <p className='visually-hidden' id='pageTitle'>RESET PASSWORD PAGE</p>
             {/* HEADER */}
        <header id='forgotPswdHeader' role='banner'>
            <Row id='mainHeaderCol1' md={12}>
                    <Col id='forgotPswdHeadCol1'/>
            </Row>
             <Row id='headerRow2'>
        <Col/>
        <Col xs={5} id='app-heading-col'>
            <span className='headerSpan'>
                <h1 id='appHeading'>TAX, CURRENCY & INTEREST CALCULATOR</h1>
                <h2 id='page-heading'>RESET PASSWORD</h2>
            </span>
        </Col>
        <Col/>
      </Row>
      <Row id='forgotPswdHeadRow3'>
            <Col id='forgotPswdHeadCol3'/>
        </Row>
        </header>
        <section>
            <Col xs={0} md id='forgot-password-col1' />
            <Col xs={12} md={6} id='forgot-password-col'>
                <div id='reset-password-panal'>
                    <form id='reset-password-form' onSubmit={handleSubmit} aria-labelledby='formTitle'>
                    {/* ---------Screen Reader Heading--------- */}
                        <p className='visually-hidden' id='formTitle'>RESET PASSWORD FORM</p>
                        <div id='reset-password-details'>
                            <Stack gap={3} id='reset-pswd-stack1'>
                                <div className="p-2">
                                     <p id='forgotPswdHeading'>
                                        Enter your new password below.
                                    </p>
                                </div>
                                {successMsg &&(
                                    <div className="p-2">
                                        <p id='resetSuccessMsg'>{successMsg}</p>
                                    </div>
                                )}
                                 {/* ========ERROR MESSAGE========== */}
                                {error && (
                                    <div className='p-2' role='alert' aria-live='assertive'>
                                        <p id='resetErrorMsg'>{error}</p>
                                    </div>
                                )}
                                {!successMsg && (
                                    <>
                                        <div className="p-2" id='newPswdInputBlock'>
                                            <label
                                                className='resetPswdLabel'
                                                htmlFor='newPswdInput'
                                                hidden
                                                >
                                                NEW PASSWORD
                                            </label>
                                            <input
                                                className='input'
                                                id='newPswdInput'
                                                type='password'
                                                required
                                                placeholder='NEW PASSWORD'
                                                autoComplete='new-password'
                                                value={password}
                                                disabled={loading}
                                                onFocus={() => setPasswordMsg(true)}
                                                onBlur={() => setPasswordMsg(false)}
                                                onChange={(e) => setPassword(e.target.value)}
                                                // ARIA ATTRIBUTES
                                                aria-required='true'
                                                aria-label='New Password'
                                                aria-disabled={loading}
                                            />
                                        </div>
                                        <div className="p-2" id='confirmPswdInputBlock'>
                                            <label
                                            className='resetPswdLabel'
                                            htmlFor='confirmPswdInput'
                                            hidden
                                            >CONFIRM PASSWORD</label>
                                            <input
                                                className='input'
                                                id='confirmPswdInput'
                                                type='password'
                                                required
                                                placeholder='CONFIRM PASSWORD'
                                                autoComplete='new-password'
                                                value={confirmPassword}
                                                disabled={loading}
                                                onFocus={() => setPasswordMsg(true)}
                                                onBlur={() => setPasswordMsg(false)}
                                                onChange={(e) => confirmPassword(e.target.value)}
                                                // ARIA ATTRIBUTES:
                                                aria-label='Confirm New Password'
                                                aria-required='true'
                                                aria-disabled={loading}
                                            />
                                        </div>
                                        {passwordMsg && (
                                            <div>
                                                <p className='infoMsg'>WE WILL NEVER SHARE YOUR PASSORD</p>
                                            </div>
                                        )}
                                        <div className='p-2' id='resetPswdBtnBlock'>
                                            <Button
                                            variant='warning'
                                            type='submit'
                                            id='sendResetPswdBtn'
                                            disabled={loading}
                                            // ARIA ATTRIBUTES:
                                            aria-label={loading ? 'RESETTING...' : 'RESET PASSWORD'}
                                            aria-disabled={loading}
                                            aria-busy={loading}
                                            >
                                             {loading ? 'RESETTING...' : 'RESET PASSWORD'}
                                            </Button>
                                        </div>
                                    </>
                                )}
                                <div className='p-2' id='backToLoginBlock'>
                                    <Link
                                        id='loginLink'
                                        to='/'
                                        aria-label={successMsg ? 'GO TO LOGIN' : 'BACK TO LOGIN'}
                                    >
                                        {successMsg ? 'GO TO LOGIN' : 'BACK TO LOGIN'}
                                    </Link>

                                </div>
                            </Stack>
                        </div>
                    </form>
                </div>
            </Col>
            <Col xs={0} md id='forgot-password-col2' />

        </section>
        <PageFooter/>
    </div>
  )
}
