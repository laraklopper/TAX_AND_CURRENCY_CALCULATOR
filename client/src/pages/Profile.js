// Profile.js
import React, { useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Profile.css'
import '../css/componentCss/DetailsPanal.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Header from '../components/Header'
import Footer from '../components/Footer'
import EditPasswordForm from '../components/EditPasswordForm';
import EditUserForm from '../components/EditUserForm';
import { User } from 'lucide-react';
import { useCallback } from 'react';
// IMPORT UTILITY FUNCTIONS
import {
  buildEditUserPayload,
  emptyEditUserData,
  orPlaceholder,
  toUserDate
} from '../utils/userFunc';

export default function Profile({currentUser, setCurrentUser, logout, setError}) {
  const [showEditUser, setShowEditUser] = useState(false)
  const [showEditPswd, setShowEditPswd] = useState(false)
  const [editUserData, setEditUserData] = useState(emptyEditUserData)
  // Inline feedback shown inside the edit user form: {type: 'error' | 'success', text: string}
  const [editUserStatus, setEditUserStatus] = useState(null)
  const [editUserLoading, setEditUserLoading] = useState(false)

  /*Destructure the current user's details, defaulting to an empty object so the
  page still renders while the user details are being fetched*/
  const { fullName, email, dateOfBirth, address, admin } = currentUser || {}

  const toggleEditUserForm = () => {
    setShowEditUser(prev => (!prev))
    setShowEditPswd(false)
  }
  const toggleEditPswdForm = () => {
    setShowEditPswd(prev => (!prev))
    setShowEditUser(false)
  }

  // ======REQUESTS/CALLBACKS===========

  /* Report a validation/request failure in one place: inline message and
     parent error state stay in sync */
  const failWith = useCallback((msg) => {
    setEditUserStatus({ type: 'error', text: msg });// Show the message inside the form
    setError?.(msg);// Set the error state to display the error in the UI
  },[setError])

  // PATCH /users/editUser: send only the details the user filled in
  const editUser = useCallback(async () => {
    setEditUserLoading(true)//Set the loading state while the request is in flight
    setEditUserStatus(null)// Clear feedback from the previous attempt
    try {
      /* Build the payload from the filled-in fields only. A blank field is
      left out of the request so the stored value is kept as is */
      const payload = buildEditUserPayload(editUserData)

      // Conditional rendering to check that at least one detail was supplied
      if (Object.keys(payload).length === 0) {
        failWith('Fill in at least one detail to update your profile.');
        return;// Exit the function early
      }

      const token = localStorage.getItem('token');// Retrieve the JWT token from localStorage

      //Conditional rendering to check if token exists
      if (!token) {
        failWith('User is not authenticated. Please log in again.');
        return;// Exit the function early
      }

      const response = await fetch('http://localhost:3001/users/editUser', {
        method: 'PATCH',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',// Specify the Content-Type in the request payload
          'Authorization': `Bearer ${token}`,// Attach JWT token for authorization
        },
        body: JSON.stringify(payload)// Convert the updated details to a JSON string
      });

      const data = await response.json().catch(() => ({}));// Safely parse the JSON response (avoid crash if server returns non-JSON)
      /* Conditional rendering to check if the response
         is not successful (status code is not in the range 200-299)*/
      if (!response.ok) {
        failWith(data.message || 'Failed to update profile.');//Default error message
        return;// Exit the function early
      }

      // Refresh the details on screen with the user returned by the server
      if (data.user) setCurrentUser?.(data.user)
      setEditUserData(emptyEditUserData())// Clear the form fields
      setError?.(null)//Clear any previous error messages
      const successMessage = data.message || 'Profile updated successfully.';
      setEditUserStatus({ type: 'success', text: successMessage });// Show the success message inside the form
      console.log('[SUCCESS: Profile.js, editUser] Profile successfully updated');// Log success message to console for debugging
    } catch (error) {
      const msg = error?.message || 'An error occurred while updating the profile.';// Default error message
      setEditUserStatus({ type: 'error', text: msg });// Show the message inside the form
      setError?.(msg);// Set the error state to display the error in the UI
      console.error('[ERROR: Profile.js, editUser]', msg);// Log the error message in the console for debugging
    } finally {
      setEditUserLoading(false)//Set Loading state to false
    }
  },[editUserData, setCurrentUser, setError, failWith])
  //=======================================
  return (
    <div id='pageContainer' role='main'>
    {/* =========HEADER========= */}
    {/* Render the Header.js function component 
    with 'PROFILE' as the pageHeader */}
      <Header currentUser={currentUser} pageHeader={'PROFILE'}/>
      {/* =====EVENT/ANIMATION======== */}
       <Row id='event-row'>
        <Col id='event-col'>
          <div className='event-bar'>
            <div className='event-track'>
              <User className='event-slide' size={32} aria-hidden='true' focusable='false'/>
            </div>
          </div>
        </Col>
      </Row>
      {/* --------------
      SECTION 1: USER DETAILS AND EDIT USER FORM
      -------------------- */}
      <section id='profile-section1'>
      <div id='user-profile-div'>
      <Row id='profile-heading-row'>
        <Col id='profile-head-col'/>
        <Col xs={5} id='profile-head-col'>
        <h3 id='profile-heading'>{fullName?.firstName} {fullName?.lastName} PROFILE</h3>
        </Col>
        <Col id='profile-head-col'/>
      </Row>
        <Row id='user-profileRow'>
        <Col xs={6}>
          <Stack gap={3}>
            {/* FULL NAME */}
            <div className="p-2">
              <div className='details-group'>
                <span><p className='nested-details-label'>FULL NAME:</p></span>
                <div className='nested-details-group'>
                  <span className='nested-details-span'>
                    <p className='details-label'>FIRST NAME:</p>
                    <p className='details-value'>{orPlaceholder(fullName?.firstName)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>LAST NAME:</p>
                    <p className='details-value'>{orPlaceholder(fullName?.lastName)}</p>
                  </span>
                </div>
              </div>
            </div>
            {/* DATE OF BIRTH */}
            <div className="p-2">
              <div className='details-group'>
                <span><p className='details-label'>DATE OF BIRTH:</p></span>
                <p className='details-value'>{toUserDate(dateOfBirth)}</p>
              </div>
            </div>
            {/* IS ADMIN: state whether or not the user is an Admin user */}
            <div className="p-2">
              <div className='details-group'>
                <span><p className='details-label'>IS ADMIN:</p></span>
                <p className='details-value'>{admin ? 'YES' : 'NO'}</p>
              </div>
            </div>
          </Stack>
        </Col>
        <Col xs={6}>
          <Stack gap={3}>
            {/* EMAIL */}
            <div className="p-2">
              <div className='details-group'>
                <span><p className='details-label'>EMAIL:</p></span>
                <p className='details-value email-value'>{orPlaceholder(email)}</p>
              </div>
            </div>
            {/* ADDRESS */}
            <div className="p-2">
              <div className='details-group'>
                <span><p className='nested-details-label'>ADDRESS:</p></span>
                <div className='nested-details-group'>
                  <span className='nested-details-span'>
                    <p className='details-label'>STREET:</p>
                    <p className='details-value'>{orPlaceholder(address?.line1)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>LINE 2:</p>
                    <p className='details-value'>{orPlaceholder(address?.line2)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>CITY/TOWN:</p>
                    <p className='details-value'>{orPlaceholder(address?.city)}</p>
                  </span>
                  <span className='nested-details-span'>
                    <p className='details-label'>PROVINCE:</p>
                    <p className='details-value'>{orPlaceholder(address?.province)}</p>
                  </span>
                </div>
              </div>
            </div>
          </Stack>
        </Col>
      </Row>
      {/* EDIT USER AND EDIT PASSWORD FORMS */}
       <Row id='toggle-edit-user-row'>
          <Col id='toggle-edit-user-col'>
            <Stack direction="horizontal" gap={3} id='edit-user-stack'>
      <div className="p-2"></div>
      <div className="p-2 ms-auto">
        {/* TOGGLE EDIT USER BUTTON */}
        <Button 
        variant='light' 
        id='toggleEditUserBtn' 
        onClick={toggleEditUserForm}
        type='button'
        // ARIA ATTRIBUTES:
        aria-label={showEditUser ? 'Exit' : 'Edit User details'}
        aria-pressed={showEditUser}
        aria-expanded={showEditUser}
        aria-controls='edit-user-panal'
        >
          {showEditUser ? 'Exit' : 'Edit User details'}
        </Button>
      </div>
      <div className="vr" style={{width: '2px', color: '#404040', opacity: '.75'}}/>
      <div className="p-2">
        {/* TOGGLE EDIT PASSWORD BUTTON */}
        <Button 
        id='toggleEditPswdBtn' 
        variant='light' 
        onClick={toggleEditPswdForm}
        type='button'
        aria-label={showEditPswd ? 'Exit': 'Edit Password'}
        aria-pressed={showEditPswd}
        aria-expanded={showEditPswd}
        aria-controls='edit-user-panal'
        >
        {showEditPswd ? 'Exit': 'Edit Password'}
        </Button>
      </div>
    </Stack>
          </Col>
        </Row>
      </div>
      {/* EDIT PROFILE and EDIT PASSWORD FORM */}
                  {/* TOGGLE THE EDIT PROFILE FORM */}
        {showEditUser && (
          <div id='edit-user-panal'>
            <Row id='edit-user-row'>
        <Col id='edit-user-col'>
        {/* Render the EditUserForm.js component */}
          <EditUserForm
            editUserData={editUserData}
            setEditUserData={setEditUserData}
            currentUser={currentUser}
            editUser={editUser}
            status={editUserStatus}
            loading={editUserLoading}
          />
        </Col>
      </Row>
          </div>
        )}
        {/* TOGGLE THE EDIT PASSWORD FORM */}
        {showEditPswd &&(
          <div id='edit-password-panal'>
 <Row id='edit-password-row'>
        <Col id='edit-password-col1'></Col>
        <Col xs={6} id='edit-password-col'>
          <div id='edit-password-block'>
          {/* Render the EditPasswordForm.js component */}
            <EditPasswordForm
              setError={setError}
            />
          </div>
        </Col>
        <Col id='edit-password-col2'></Col>
      </Row>
          </div>
        )}     
      </section>
      {/* ======FOOTER=========== */}
      {/* Render the Footer.js component */}
      <Footer logout={logout}/>
    </div>
  )
}
