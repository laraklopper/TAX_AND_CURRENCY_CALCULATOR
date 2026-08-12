// LoginForm.js
import React, { useMemo, useState } from 'react'
import '../css/componentCss/LoginForm.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Eye, EyeOff, Bug } from 'lucide-react';

// LoginForm function component
export default function LoginForm(
    {
        userData, setUserData, submitLogin}) {
    const [showPassword, setShowPassword] = useState(false)
    const [passwordMsg, setPasswordMsg] = useState(false)
    const [showEmailMsg, setShowEmailMsg] = useState(false)
     const [touched, setTouched] = useState({// State to track if fields have been touched for validation purposes
        username: false,
        password: false
    })

    const emailEmpty = useMemo( // Memorises the validation result until userData.email changes
        () => !String (userData.email || '').trim(), // Returns true if email is empty, missing, or only contains spaces
        [userData.email]// Recalculate only when the email value changes
    )
     const passwordEmpty = useMemo(// Memorises the validation result until userData.password changes
        () => !String (userData.password || '').trim(),// Returns true if password is empty, missing, or only contains spaces
        [userData.password]// Recalculate only when the password value changes
    )
    // Only show validation errors AFTER field was touched
    const showEmailError = touched.username && emailEmpty;// Show email error only after field was touched
    const showPasswordError = touched.password && passwordEmpty;// Show password error only after field was touched

    //Function to handle Input change in the Login Form
    const handleLoginInput =(event) =>{
        const { name, value} = event.target;// Get the input field's name attribute and its current typed value.
        // Update the userData object stored in the parent component.
        setUserData((prev) => ({
            ...prev, // Keep the existing values in userData, such as the other input field.
            // Update only the field that the user is currently typing into.
            // [name] uses the input's name attribute as the object key.
            [name] : value,
        }))
    }

    // ========= IDs USED BY aria-labelledby / aria-describedby =========
    // Keeps ARIA references stable and readable
    const formTitleId = 'loginFormTitle';
    const emailHelpId = 'loginEmailHelp';
    const passwordHelpId = 'loginPasswordHelp';
    // error IDs (for aria-describedby)
    const emailErrorId = 'loginEmailError';
    const passwordErrorId = 'loginPasswordError';

     const handleLogin = (e) => {
        e.preventDefault();//Prevent default form submission
        submitLogin();// Call the submitLogin function passed as a prop from the parent component (Login.js)
    }

    return (
    <form 
        id='login-form' 
        method='POST'
         aria-labelledby={formTitleId} 
         onSubmit={handleLogin}>
    <p className='visually-hidden' id={formTitleId}>LOGIN FORM</p>
    <div id='formHeadingBlock'>
        <h3 id='formHeading'>SIGN IN</h3>
    </div>
        <div id='login-details'>
        {/* STACK 1: EMAIL */}
            <Stack gap={3} id='loginStack1'>
                <div className="p-2" id='login-email-block'>
                        <label className='login-label' htmlFor='login-email'>EMAIL</label>
                        <input
                            className='input'
                            id='login-email'
                            type='email'
                            placeholder='EMAIL'
                            autoComplete='email'
                            name='email'
                            value={userData.email}
                            onChange={handleLoginInput}
                            onFocus={() => setShowEmailMsg(true)}
                            onBlur={() => {
                                setShowEmailMsg(false)
                                setTouched((prev) => ({...prev, email: true}))
                            }}
                             // ARIA ATTRIBUTES:
                            aria-required="true"// Mark the field as required for assistive technologies
                            aria-label='Login Email input'// Provide a label for screen readers (also have a visible label for sighted users)
                            aria-invalid={emailEmpty ? 'true' : 'false'}// Mark invalid if empty (simple validation)
                            aria-describedby={[// Conditionally include help and error message IDs based on state
                                emailEmpty ? emailHelpId : null,
                                emailEmpty ? emailHelpId : null,
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            inputMode="text"// Helpful on mobile keyboards
                        />
                </div>
                {}
                {/* Email error message */}
                    {showEmailError && (
                        <div className="p-2" id={emailErrorId} aria-live='assertive'>
                            <p className='loginErrorMessage'><Bug size={20} fontWeight={900} aria-hidden='true' focusable='false'/>Username is required</p>
                        </div>
                    )}
                    {/* Email help message */}
                    {showEmailMsg && (
                        <div className="p-2" id={emailHelpId} aria-live='polite'>
                            <p className='loginHelpMessage'>Enter your email</p>
                        </div>
                    )}
            </Stack>
            {/* STACK 2: PASSWORD */}
            <Stack gap={3} id='loginStack2'>
                <div className="p-2" id='login-passwd-block'>
                    <label className='login-label'>PASSWORD:</label>
                        <input
                            type='password'
                            className='input'
                            id='login-password'
                            placeholder='PASSWORD'
                            autoComplete='current-password'
                            name='password'
                            value={userData.password}
                            // EVENT HANDLERS:
                            onChange={handleLoginInput}
                            onFocus={() => setPasswordMsg(true)}
                            onBlur={() => {
                                setPasswordMsg(false)
                                setTouched((prev) => ({...prev, password: true}))
                            }}
                             // ARIA ATTRIBUTES:
                            aria-label='password'// Provide a label for screen readers (also have a visible label for sighted users)
                            aria-required="true"
                            aria-invalid={passwordEmpty ? 'true' : 'false'}
                            aria-describedby={[// Conditionally include help and error message IDs based on state
                                passwordMsg ? passwordHelpId : null,// Include help ID if help message is shown
                                passwordEmpty ? passwordErrorId : null,// Include error ID if password is empty (invalid)
                            ]
                                .filter(Boolean)// Filter out null values
                                .join(' ')}
                            inputMode="text"// Helpful on mobile keyboards (password fields often still want text input mode for better keyboard options)
                        />
                </div>
                <div className="p-2" id='show-passwd-block'>
                    <Button 
                        variant='warning' 
                        id='showPasswrdBtn' 
                        type='button' 
                        onClick={() => setShowPassword(!showPassword)} 
                        // ARIA ATTRIBUTES
                        aria-label={showPassword ? 'Hide Password' : 'Show Password'}
                        aria-controls='loginPassword'
                        aria-describedby={passwordHelpId}
                        aria-pressed={showPassword}
                        aria-expanded={showPassword}
                        >
                         {showPassword ?
                                <>
                                    Hide Password
                                    <EyeOff
                                        size={20}
                                        fontWeight={700}
                                        // ARIA ATTRIBUTES:
                                        aria-label='Hide password'
                                        aria-hidden='true'
                                        focusable='false'/>
                                </> : <>
                                    Show Password
                                    <Eye
                                        size={20}
                                        fontWeight={700}
                                        // ARIA ATTRIBUTES:
                                        aria-label='Show password'
                                        aria-hidden='true'
                                        focusable='false'/>
                                </>
                            }
                    </Button>
                </div>
            {/* password error message */}
                    {showPasswordError && (
                        <div id={passwordErrorId} aria-live='assertive'>
                            <p className='loginErrorMessage'>
                                <Bug size={20} fontWeight={900} aria-hidden='true' focusable='false'/>Password is required</p>
                        </div>
                    )}
                    {/* password help message */}
                    {passwordMsg && (
                        <div className="p-2" id={passwordHelpId} aria-live='polite'>
                            <p className='loginHelpMessage'>We will never share your password</p>
                        </div>
                    )}

            </Stack>
        </div>
        <div id='login-btn-block'>
            {/* LOGIN BUTTON */}
            <Button variant='light' type='submit' id='loginBtn'>LOGIN</Button>
        </div>
    </form>
  )
}
