import React, { useState } from 'react'
import '../css/componentCss/EditUserForms.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { Asterisk , Eye, EyeOff} from 'lucide-react';

export default function EditPasswordForm({setError}) {
    const [showPswdMsg, setShowPswdMsg] = useState(false)
    const [showCurrentPswd, setShowCurrentPswd] = useState(false)
    const [showNewPswd, setShowNewPswd] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
  return (
    <form id='edit-password-form' method='PATCH' aria-labelledby='formHeading'>
        <div id='formHeading'>
            <h3 id='formHeading'>EDIT PASSWORD</h3>
        </div>
        <div id='edit-password-details'>
            <Stack gap={3}>
      <div className="p-2">
        <label className='edit-pswd-label'>CURRENT PASSWORD:</label>
        <div className='input-div'>
            <input
                className='input'
                placeholder='CURRENT PASSWORD'
                type='password'
                autoComplete='current-password'
                required
                name='currentPassword'
                value={currentPassword}
                onFocus={() => setShowPswdMsg(true)}
                onBlur={() => setShowPswdMsg(false)}
                onChange={(e) => setCurrentPassword(e.target.value)}
                // ARIA ATTRIBUTES:
            />
            <small><Asterisk color='#C22419' fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      <div className="p-2">
        <Button 
            variant='warning'
            id='showCurrentPswdBtn'
            type='button'
            onClick={() => setShowCurrentPswd((prev) => !prev)}
            // ARIA ATTRIBUTES:
            aria-pressed={showCurrentPswd}
            aria-expanded={showCurrentPswd}
            aria-label={showCurrentPswd ? 'Hide Current Password': 'Show Current Password'}
        >
            {showCurrentPswd ? (
                <>
                    Hide Password
                    <EyeOff fontWeight={700} fontSize={16} aria-hidden='true' style={{marginLeft: 6}} focusable='false'/>
                </>
            ):(
                <>
                    Show Password
                    <Eye fontWeight={700} fontSize={16} aria-hidden='true' style={{marginLeft: 6}} focusable='false'/>
                </>
            )}
        </Button>
      </div>
      {/* Error Message (aria)*/}
      {/* <div className="p-2"></div> */}
    </Stack>
     <Stack gap={3}>
      <div className="p-2">
        <label className='edit-pswd-label'>NEW PASSWORD:</label>
        <div className='input-div'>
            <input
            type={showNewPswd ? 'text' : 'password'}
                className='input'
                required
                id='newPasswordInput'
                name='newPassword'
                value={newPassword}
                onFocus={() => setShowPswdMsg(true)}
                onBlur={()=> setShowPswdMsg(false)}
                onChange={(e) => setNewPassword((e.target.value))}
            />
            <small><Asterisk color='#C22419' fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
        </div>
      </div>
      <div className="p-2">
        <Button
        variant='warning'
        id='showNewPswdBtn'
        onClick={() => setShowNewPswd((prev) => !prev)}
        type='button'
         // ARIA ATTRIBUTES:
        aria-pressed={showNewPswd}
        aria-expanded={showNewPswd}
        aria-label={showNewPswd ? 'Hide New Password' : 'Show New Password'}
        >
        {showNewPswd ? (
            <>
                Hide Password
                <EyeOff aria-hidden='true' focusable='false' style={{marginLeft: 6}} fontWeight={700}/>
            </>
         ):(
            <>
                Show Password
                <Eye aria-hidden="true" focusable='false' style={{ marginLeft: 6 }} fontWeight={700} />
            </>
        )}
        </Button>
      </div>
      {/* <div className="p-2"></div> */}
      {showPswdMsg &&(
        <div className="p-2">
            <p className='msgText'>WE WILL NEVER SHARE YOUR PASSWORD</p>
        
      </div>)}
    </Stack>

        </div>
        <div>
            <div>
                <Button variant='light'>EDIT PASSWORD</Button>
            </div>
            <div>
                <Button variant='danger' id='clearFormBtn'>
                    CLEAR FORM
                </Button>

            </div>
        </div>
    </form>
  )
}
