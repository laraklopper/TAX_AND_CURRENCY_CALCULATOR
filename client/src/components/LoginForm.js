import React from 'react'
import '../css/componentCss/LoginForm.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
export default function LoginForm() {
  return (
    <form id='login-form' method='POST' aria-labelledby='formTitle'>
    <p className='visually-hidden' id='formTitle'>LOGIN FORM</p>
    <div>
        <h3 id='formHeading'>SIGN IN</h3>
    </div>
        <div id='login-details'>
            <Stack gap={3} id='loginStack1'>
                <div className="p-2">
                    <div>
                        <label className='login-label'>EMAIL</label>
                    </div>
                </div>
                <div className="p-2">Second item</div>
                <div className="p-2">Third item</div>
            </Stack>
            <Stack gap={3} id='loginStack2'>
                <div className="p-2">First item</div>
                <div className="p-2">Second item</div>
                <div className="p-2">Third item</div>
            </Stack>
        </div>
        <div>
            <Stack gap={3}>
                <div className="p-2">
                    {/* LOGIN BUTTON */}
                    <Button variant='light' type='submit' id='loginBtn'>LOGIN</Button>
                </div>
                <div className="p-2"></div>
                <div className="p-2">
                    {/* Forgot password link */}
                </div>
            </Stack>
        </div>
    </form>
  )
}
