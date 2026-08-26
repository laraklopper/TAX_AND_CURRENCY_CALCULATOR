//EditPasswordForm.js
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useCallback, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentCss/EditUserForms.css'
import '../css/componentCss/FormSetup.css';
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// IMPORT ICONS FROM LUCIDE-REACT
import { Asterisk , Eye, EyeOff} from 'lucide-react';
// IMPORT UTILITY FUNCTIONS
import { isStrongPassword } from '../utils/userFunc';

//EditPasswordForm function component
export default function EditPasswordForm(//Export default EditPasswordForm.js function component
    {//PROPS PASSED FROM PARENT COMPONENT(Profile.js)
        setError
    }
    ) {
    //===========STATE VARIABLES=============

    const [currentPassword, setCurrentPassword] = useState('')// Stores the user's current password entered into the form
    const [newPassword, setNewPassword] = useState('')// Stores the new password that the user wants to change to
    const [showPswdMsg, setShowPswdMsg] = useState(false)// Toggles the "we will never share your password" reassurance message while a password field has focus
    const [showCurrentPswd, setShowCurrentPswd] = useState(false)// Toggles the current password field between plain text and masked input
    const [showNewPswd, setShowNewPswd] = useState(false)// Toggles the new password field between plain text and masked input
    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)// Toggles the confirm password field between plain text and masked input
    const [confirmPassword, setConfirmPassword] = useState('')// Stores the re-typed new password used to confirm there was no typing mistake
    // Tracks whether the password update request is in progress.
    const [loading, setLoading] = useState(false)// Used to disable buttons and display a loading message while saving.
    // Inline feedback shown inside the form: {type: 'error' | 'success', text: string}
    const [status, setStatus] = useState(null)

    /* Report a validation/request failure in one place: inline message,
       parent error state and alert all stay in sync */
    const failWith = useCallback((msg) => {
        setStatus({ type: 'error', text: msg });// Show the message inside the form
        setError?.(msg);// Set the error state to display the error in the UI
        alert(msg);// Alert user of error
    },[setError])

    //==========EVENT LISTENERS================
    //Function to reset editPassword form
    const resetForm = useCallback(() => {
        const confirmReset = window.confirm(
            "Are you sure you want to clear the form?"
        )
        if (!confirmReset) return;// If user cancels, exit the function
        setCurrentPassword('');// Clear the current password field
        setNewPassword('')// Clear the new password field
        setConfirmPassword('')// Clear the confirm password field
        setStatus(null)// Clear any inline feedback
        setError?.(null)// Clear any existing error messages
    },[setError])
    //===============REQUESTS/CALLBACK===================
    // Function to editPassword
    const editPassword = useCallback(async (e) => {
        e.preventDefault()// Prevent the browser's default form submission/page reload
        setLoading(true)// Set loading state to true while the request is in progress
        setStatus(null)// Clear feedback from the previous attempt
        try {
            //=====CLIENT-SIDE VALIDATION (runs before the request is sent)=====
            // Conditional rendering to check that no field was left empty
            if (!currentPassword || !newPassword || !confirmPassword) {
                failWith('Current password, new password and confirmation are required.');// Error message for missing fields
                return// Exit the function early
            }
            // Conditional rendering to check that the new password is different from the current password
            else if(newPassword === currentPassword){
                // Error message
                failWith('New password must be different from the current password.');
                return;// Exit the function early
            }
            else if (newPassword !== confirmPassword) {
                // The new password and its confirmation must match before sending
                failWith('New password and confirmation do not match.');
                return;// Exit the function early
            }
            else if (!isStrongPassword(newPassword)) {
                //Message for weak password
                failWith('New password must be at least 8 characters long and include at least one special character.');
                return;// Exit the function early
            }

            const token = localStorage.getItem('token');// Retrieve JWT token from local storage

            //Conditional rendering to check if token exists
            if (!token) {
                // Error message for missing token
                failWith('User is not authenticated. Please log in again.');
                return;// Exit the function early
            }

            //Send a PATCH request to '/users/editPassword' endpoint
            const response = await fetch('http://localhost:3001/users/editPassword', {
                method: 'PATCH',//HTTP request method
                mode: 'cors',// Enable CORS for Cross-Origin Resource Sharing
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
                failWith(data.message || 'Failed to change password.');//Default error message
                return;// Exit the function early
            }

            // Clear form fields directly — avoids the window.confirm in resetForm
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError?.(null);//Clear any previous error messages
            const successMessage = data.message || 'Password changed successfully.';
            setStatus({ type: 'success', text: successMessage });// Show the success message inside the form
            console.log('[SUCCESS: EditPasswordForm.js] Password successfully changed');// Log success message to console for debugging
            alert(successMessage);// Notify the user of success
        } catch (error) {
            const msg = error?.message || 'An error occurred while changing the password.';// Default error message
            setStatus({ type: 'error', text: msg });// Show the message inside the form
            setError?.(msg);// Set the error state to display the error in the UI
            console.error('[ERROR: EditPasswordForm.js, editPassword]', msg);// Log the error message in the console for debugging
            alert('Error changing password');// Alert user of error
        }finally{
            setLoading(false)//Set Loading state to false
        }
    },[currentPassword, newPassword, confirmPassword, setError, failWith])

    //==================JSX RENDERING=========================
    return (
        <form
            id='edit-password-form'
            // Submit runs the editPassword callback instead of a native form post
            onSubmit={editPassword}
            method='PATCH'
            // ARIA ATTRIBUTES
            aria-labelledby='formHeading'
            // Tells assistive tech the form is busy while the request is in flight
            aria-busy={loading} >
            {/* -------FORM HEADING--------------- */}
            <div id='formHeadingBlock'>
                <h3 id='formHeading'>EDIT PASSWORD</h3>
            </div>
            {/* =======FORM DETAILS INPUT=================== */}
            <div id='edit-password-details'>
                {/* STACK 1: CURRENT PASSWORD, SHOW CURRENT PASSWORD BUTTON */}
                <Stack gap={3} id='edit-password-stack1'>
                    <div className="p-2" id='edit-password-block1'>
                        {/* CURRENT PASSWORD */}
                        <label className='edit-pswd-label' htmlFor='currentPasswordInput'>CURRENT PASSWORD:</label>
                        <div className='input-div'>
                            <input
                                className='input'
                                placeholder='CURRENT PASSWORD'
                                type={showCurrentPswd ? 'text' : 'password'}
                                autoComplete='current-password'
                                required
                                id='currentPasswordInput'
                                name='currentPassword'
                                value={currentPassword}
                                // EVENTS
                                onFocus={() => setShowPswdMsg(true)}// Show the password reassurance message
                                onBlur={() => setShowPswdMsg(false)}// Hide the reassurance message once the field loses focus
                                onChange={(e) => setCurrentPassword(e.target.value)}// Keep the currentPassword state in sync with the input
                                // ARIA ATTRIBUTES:
                                aria-required='true'
                                // Flags the field as invalid whenever the form is reporting an error
                                aria-invalid={status?.type === 'error'}
                            />
                            {/* Required field indicator */}
                            <small><Asterisk color='#C22419' fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
                        </div>
                    </div>
                    <div className="p-2" id='show-edit-password-block1'>
                        {/* Show current password button */}
                        <Button
                            variant='warning'
                            id='showCurrentPasswordBtn'
                            // type='button' keeps this toggle from submitting the form
                            type='button'
                            onClick={() => setShowCurrentPswd((prev) => !prev)}// Flip the masked/plain text state
                            // ARIA ATTRIBUTES:
                            aria-pressed={showCurrentPswd}
                            aria-controls='currentPasswordInput'
                            aria-label={showCurrentPswd ? 'Hide Current Password': 'Show Current Password'}
                        >
                            {/* Conditional rendering of the button label and icon based on the toggle state */}
                            {showCurrentPswd ? (
                                <>
                                    Hide Password
                                    <EyeOff
                                        fontWeight={700}
                                        fontSize={16}
                                        // ARIA ATTRIBUTES
                                        aria-hidden='true'
                                        focusable='false'
                                    />
                                </>
                            ):(
                                <>
                                    Show Password
                                    <Eye
                                        fontWeight={700}
                                        fontSize={16}
                                        // ARIA ATTRIBUTES
                                        aria-hidden='true'
                                        focusable='false'
                                    />
                                </>
                            )}
                        </Button>
                    </div>
                </Stack>
                {/* STACK 3: NEW PASSWORD, SHOW NEW PASSWORD,  */}
                <Stack gap={3} id='edit-password-stack2'>
                    <div className="p-2" id='edit-password-block2'>
                        {/* NEW PASSWORD */}
                        <label className='edit-pswd-label' htmlFor='newPasswordInput'>NEW PASSWORD:</label>
                        <div className='input-div'>
                            <input
                                type={showNewPswd ? 'text' : 'password'}
                                className='input'
                                required
                                placeholder='NEW PASSWORD'
                                id='newPasswordInput'
                                name='newPassword'
                                autoComplete='new-password'
                                value={newPassword}
                                // EVENTS
                                onFocus={() => setShowPswdMsg(true)}// Show the password reassurance message
                                onBlur={()=> setShowPswdMsg(false)}// Hide the reassurance message once the field loses focus
                                onChange={(e) => setNewPassword((e.target.value))}// Keep the newPassword state in sync with the input
                                // ARIA ATTRIBUTES:
                                aria-required='true'
                                // Links the input to the password requirements text below it
                                aria-describedby='newPasswordHelp'
                                // Only flag as invalid once something has been typed and it fails the strength check
                                aria-invalid={Boolean(newPassword) && !isStrongPassword(newPassword)}
                            />
                            {/* Required field indicator */}
                            <small><Asterisk color='#C22419' fontWeight={700} size={16} aria-hidden='true' focusable='false' /></small>
                        </div>
                        {/* Password Requirements */}
                        <small id='newPasswordHelp' className='msgText'>
                            At least 8 characters and one special character.
                        </small>
                    </div>
                    <div className="p-2" id='show-edit-password-block2'>
                        {/* Show New Password Btn */}
                        <Button
                            variant='warning'
                            id='showNewPasswordBtn'
                            onClick={() => setShowNewPswd((prev) => !prev)}// Flip the masked/plain text state
                            // type='button' keeps this toggle from submitting the form
                            type='button'
                            // ARIA ATTRIBUTES:
                            aria-pressed={showNewPswd}
                            aria-controls='newPasswordInput'
                            aria-label={showNewPswd ? 'Hide New Password' : 'Show New Password'}
                        >
                            {/* Conditional rendering of the button label and icon based on the toggle state */}
                            {showNewPswd ? (
                                <>
                                    Hide Password
                                    <EyeOff
                                        size={16}
                                        fontWeight={700}
                                        // ARIA ATTRIBUTES:
                                        aria-hidden='true'
                                        focusable='false'
                                    />
                                </>
                            ):(
                                <>
                                    Show Password
                                    <Eye
                                        size={16}
                                        fontWeight={700}
                                        // ARIA ATTRIBUTES:
                                        aria-hidden="true"
                                        focusable='false'
                                    />
                                </>
                            )}
                        </Button>
                    </div>
                    {/* Message: only rendered while one of the password fields has focus */}
                    {showPswdMsg && (
                        <div className="p-2" aria-live='polite'>
                            <p className='msgText'>WE WILL NEVER SHARE YOUR PASSWORD</p>
                        </div>
                    )}
                </Stack>
            </div>
            {/* STACK 3 : CONFIRM PASSWORD, EDIT PASSWORD BUTTON, CLEARFORM BUTTON */}
            <Stack gap={3} id='edit-password-stack3'>
                <div className='p-2' id='confirm-password-block'>
                    {/* CONFIRM NEW PASSWORD */}
                    <label className='edit-pswd-label' htmlFor='confirmPasswordInput'>CONFIRM PASSWORD:</label>
                    <div id='confirmpswd-input-div'>
                        <input
                            className='input'
                            placeholder='CONFIRM PASSWORD'
                            required
                            type={showPasswordConfirm ? 'text' : 'password'}
                            id='confirmPasswordInput'
                            name='confirmPassword'
                            autoComplete='new-password'
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}// Keep the confirmPassword state in sync with the input
                            // ARIA ATTRIBUTES:
                            aria-required='true'
                            // Only flag as invalid once something has been typed and it does not match the new password
                            aria-invalid={Boolean(confirmPassword) && confirmPassword !== newPassword}
                        />
                        {/* Required field indicator */}
                        <small><Asterisk color='#C22419' fontWeight={700} size={14} aria-hidden='true' focusable='false' /></small>
                        {/* Show confirm password button (icon only, sits inside the input div) */}
                        <Button
                            variant='warning'
                            id='showConfirmPswdBtn'
                            size='sm'
                            onClick={() => setShowPasswordConfirm((prev) => !prev)}// Flip the masked/plain text state
                            // type='button' keeps this toggle from submitting the form
                            type='button'
                            // ARIA ATTRIBUTES:
                            aria-pressed={showPasswordConfirm}
                            aria-controls='confirmPasswordInput'
                            aria-label={showPasswordConfirm ? 'Hide  Password' : 'Show Password'}
                        >
                            {/* Conditional rendering of the icon based on the toggle state */}
                            {showPasswordConfirm ? (
                                <>
                                    <EyeOff
                                        fontWeight={700}
                                        size={16}
                                        // ARIA ATTRIBUTES
                                        aria-hidden='true'
                                        focusable='false'
                                    />
                                </>
                            ):(
                                <>
                                    <Eye
                                        fontWeight={700}
                                        size={16}
                                        // ARIA ATTRIBUTES:
                                        aria-hidden="true"
                                        focusable='false'
                                    />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
                {/* Inline request/validation feedback, announced to screen readers */}
                {status && (
                    <div className='p-2' id='edit-password-status'>
                        <p
                            className='msgText'
                            role={status.type === 'error' ? 'alert' : 'status'}
                            aria-live={status.type === 'error' ? 'assertive' : 'polite'}
                            style={{ color: status.type === 'error' ? '#C22419' : '#1B6E2F' }}
                        >
                            {status.text}
                        </p>
                    </div>
                )}
                <div className="p-2" id='edit-passwordbtn-block1'>
                    {/* SUBMIT/Edit password Button */}
                    <Button
                        variant='light'
                        type='submit'
                        disabled={loading}// Prevent duplicate submissions while the request is in progress
                        id='edit-password-btn'
                        // ARIA ATTRIBUTES:
                        aria-disabled={loading}
                        aria-label={loading ? 'SAVING...' : 'EDIT PASSWORD'}
                    >{loading ? 'SAVING...' : 'EDIT PASSWORD'}</Button>
                </div>
                <div className="p-2" id='edit-passwordbtn-block2'>
                    {/* CLEAR FORM Button */}
                    <Button
                        variant='danger'
                        id='clearFormBtn'
                        type='button'
                        onClick={resetForm}// Ask for confirmation, then clear every field
                        disabled={loading}// Disabled while the request is in progress
                        // ARIA ATTRIBUTES:
                        aria-disabled={loading}
                        aria-label='clear form'
                    >
                        CLEAR FORM
                    </Button>
                </div>
            </Stack>
            <div>
            </div>
        </form>
    )
}
