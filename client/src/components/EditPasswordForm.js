import React, { useCallback, useState } from 'react'
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
    const [loading, setLoading] = useState(false)

    const isStrongPassword = useCallback((pwd) => {
        //Regex pattern to check for at least 8 characters and one special character
        return /^(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/ 
            .test(
                String(pwd || '')// Ensure pwd is a string before testing
            );
    },[])

    const resetForm = useCallback(() => {
        const confirmReset = window.confirm(
            "Are you sure you want to clear the form?"
        )
        if (!confirmReset) return;// If user cancels, exit the function
        setCurrentPassword('');// Clear the current password field
        setNewPassword('')// Clear the new password field
        setError?.(null)// Clear any existing error messages
    },[setError])
    //==================================
    const editPassword = useCallback(async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (!currentPassword || !newPassword) {
                const msg = 'Both current and new passwords are required.';
                setError?.(msg)
                alert(msg)
                return
            }
            else if(newPassword === currentPassword){
               const msg = 'New password must be different from the current password.';// Error message
                setError?.(msg);// Set the error state to display the error in the UI
                alert(msg);
                return;// Exit the function early
            }
            else if (!isStrongPassword(newPassword)) {
                const msg = //Message for weak password
                    'New password must be at least 8 characters long and include at least one special character.';
                setError?.(msg);// Set the error state to display the error in the UI
                alert(msg);// Alert user of error
                return;// Exit the function early
            }

            const token = localStorage.getItem('token');

            //Conditional rendering to check if token exists
            if (!token) {
                const msg = 'User is not authenticated. Please log in again.';// Error message for missing token
                setError?.(msg);// Set the error state to display the error in the UI
                alert(msg);// Alert user of error
                return;// Exit the function early
            }

            const response = await fetch('http://localhost:3001/users/editPassword', {
                method: 'PATCH',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',// Specify the Content-Type in the request payload
                    'Authorization': `Bearer ${token}`,// Attach JWT token for authorization
                },
                body: JSON.stringify({// Convert the password data to a JSON string
                    currentPassword,
                    newPassword
                })
            });

            const data = await response.json().catch(() => ({}));// Safely parse the JSON response (avoid crash if server returns non-JSON)
            /* Conditional rendering to check if the response
               is not successful (status code is not in the range 200-299)*/
            if (!response.ok) {
                const errorMessage = data.message || 'Failed to change password.';//Default error message
                setError?.(errorMessage);// Set the error state to display the error in the UI
                alert(errorMessage);// Alert user of error
                return;// Exit the function early
            }

            // Clear form fields directly — avoids the window.confirm in resetForm
            setCurrentPassword('');
            setNewPassword('');
            setError?.(null);//Clear any previous error messages
            console.log('[SUCCESS: EditPasswordForm.js] Password successfully changed');// Log success message to console for debugging
            setLoading(false);// Set loading to false after successful response
            alert('Password changed successfully.');// Notify the user of success
        } catch (error) {
          const msg = error?.message || 'An error occurred while changing the password.';// Default error message
            setError?.(msg);// Set the error state to display the error in the UI
            console.error('[ERROR: EditPasswordForm.js, editPassword]', msg);// Log the error message in the console for debugging
            alert('Error changing password');// Alert user of error
        }finally{
            setLoading(false)//Set Loading state to false
        }

    },[currentPassword, newPassword, setError, isStrongPassword])
    //===========================================
  return (
    <form id='edit-password-form' method='PATCH' aria-labelledby='formHeading' onSubmit={editPassword}>
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
                <Button variant='light' type='submit' disabled={loading}>EDIT PASSWORD</Button>
            </div>
            <div>
                <Button variant='danger' id='clearFormBtn' type='button' onClick={resetForm}>
                    CLEAR FORM
                </Button>

            </div>
        </div>
    </form>
  )
}
