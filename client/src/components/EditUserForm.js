// EditUserForm.js
import React, { useCallback, useState } from 'react'
import '../css/componentCss/EditUserForms.css'
import '../css/componentCss/FormSetup.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import { provinces } from '../dataArrays/locations';
import { MapPin } from 'lucide-react';
// IMPORT UTILITY FUNCTIONS
import { applyFieldChange, emptyEditUserData } from '../utils/userFunc';

export default function EditUserForm(
  {//PROPS PASSED FROM PARENT COMPONENT(Profile.js)
    editUserData,
    setEditUserData,
    currentUser,
    editUser,
    status,// Inline request feedback: {type: 'error' | 'success', text: string}
    loading// True while the PATCH request is in flight
  }) {
    // ========STATE VARIABLES=====================
  const [showEmailMsg, setShowEmailMsg] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    editUser?.()
  }

  const handleInputChange = (event) => {
    const {name, value} = event.target;
    /* Write the value to the matching field, nested (fullName.firstName,
    address.city) or top-level (email) */
    setEditUserData(applyFieldChange(name, value))
  }
  const clearEditUserForm = useCallback(() => {
    const confirmReset = window.confirm(
      'Are you sure you want to clear the form'
    )

    if (!confirmReset) return;

    /* Blank every field: the stored details stay untouched because only
    filled-in fields are sent with the request */
    setEditUserData(emptyEditUserData())
  }, [setEditUserData])
  //===============JSX RENDERING===================
  return (
    <form id='edit-user-form' onSubmit={handleSubmit} aria-labelledby='formHeading' aria-busy={loading}>
    <div id='formHeadingBlock'>
        <h3 id='formHeading'>EDIT USER PROFILE</h3>
    </div>
    {/* INPUT DETAILS */}
    <div id='edit-user-input-details' aria-describedby='newUserDetails'>
    <p className='visually-hidden' id='newUserDetails'>INPUT TO EDIT USER DETAILS</p>
    {/* GROUP 1:  FullName, Email*/}
      <div id='edit-user-group1' aria-describedby='editUserGroup1Label'>
      <p className='visually-hidden' id='editUserGroup1Label'>EDIT USER FULLNAME OR EMAIL</p>
      {/* STACK 1 : FullName*/}
       <Stack direction="horizontal" gap={3} id='edit-user-stack1'>
      <div className="p-2" id='edit-user-block1'> 
      {/* FULL NAME: firstName, lastName */}
      <label className='edit-user-label'>FULL NAME:</label></div>
      <div className="p-2" id='edit-fullName-input-block' >
        <div className='input-group'>
        {/* First Name */}
        <div className='input-div'>
        <label className='edit-user-label' htmlFor='editFirstName'>FIRST NAME:</label>
        <input
          className='input'
          type='text'
          id='editFirstName'
          placeholder={currentUser?.fullName?.firstName || 'FIRST NAME'}//Display currentUser firstName if provided
          name='fullName.firstName'
          value={editUserData.fullName.firstName}
          onChange={handleInputChange}
          // ARIA ATTRIBUTES:
          aria-required='false'
        />
        </div>
        {/* Last Name */}
        <div className='input-div'>
        <label className='edit-user-label' htmlFor='editUserLastName'>LAST NAME:</label>
        <input
          className='input'
          type='text'
          id='editUserLastName'
          placeholder={currentUser?.fullName?.lastName || 'LAST NAME'}//Display currentUser lastName if provided
          name='fullName.lastName'
          value={editUserData.fullName.lastName}
          onChange={handleInputChange}
          // ARIA ATTRIBUTES:
          aria-required='false'
        />
        </div>
      </div>
      </div>
      <div className="p-2"></div>
    </Stack>
    {/* STACK 2 : Email*/}
 <Stack direction="horizontal" gap={3} id='edit-user-stack2'>
 {/* EMAIL */}
      <div className="p-2" id='edit-user-email-block'>
        <label className='edit-user-label' htmlFor='editUserEmail'>EMAIL</label>
        <input
          className='input'
          type='email'
          id='editUserEmail'
          placeholder={currentUser?.email || 'EMAIL'}//Current User email or email if notFound or provided
          name='email'
          value={editUserData.email}
          // EVENTS:
          onFocus={() => setShowEmailMsg(true)}
          onBlur={() => setShowEmailMsg(false)}
          onChange={handleInputChange}
          // ARIA ATTRIBUTES:
          aria-required='false'
        />
      </div>
      {/* EMAIL MESSAGE */}
      <div className="p-2 ms-auto"></div>
      {showEmailMsg && (
        <div className="p-2">
        <p className='msgText' aria-live='polite'>WE WILL NEVER SHARE YOUR EMAIL</p>
      </div>
      )}
    </Stack>
      </div>
      {/* GROUP 2: ADDRESS */}
      <div id='edit-user-group2' aria-labelledby='address-heading'>
        <Stack gap={3} id='edit-user-stack3'>
        <div className="p-2" id='address-head-block'>
          <span id='address-head-span'><h5 id='address-heading'>ADDRESS</h5><MapPin/></span>
        </div>
      <div className="p-2" id='address-block2'>
      {/* ADDRESS LINE 1 */}
        <div className='input-div'>
          <label className='edit-user-label' htmlFor='newStreetAddress'>STREET:</label>
          <textarea
            type='text'
            id='newStreetAddress'
            rows={2}
            className='text-input'
            placeholder={currentUser?.address?.line1 || 'STREET'}//CurrentUser address line 1 if provided or STREET ADDRESS if not provided
            name='address.line1'
            value={editUserData.address.line1}
            onChange={handleInputChange}
            // ARIA ATTRIBUTES:
            aria-required='false'
          />
        </div>
        {/* ADDRESS LINE 2: ADDITIONAL ADDRESS DETAILS */}
        <div className='input-div'>
          <label className='edit-user-label' htmlFor='editUserAddressline2'>LINE 2:</label>
          <textarea
            className='text-input'
            id='editUserAddressline2'
            rows={2}
            placeholder={currentUser?.address?.line2 || 'ADDITIONAL ADDRESS DETAILS'}//CurrentUser address line2 if provided or ADDITIONAL ADDRESS DETAILS if not provided
            name='address.line2'
            value={editUserData.address.line2}
            onChange={handleInputChange}
            // ARIA ATTRIBUTES:
            aria-label='New additional address details'
            aria-required='false'
          />
        </div>
      </div>
      <div className="p-2" id='address-block3'>
      {/* CITY/TOWN */}
        <div className='input-div'>
          <label className='edit-user-label' htmlFor='editUserCity'>CITY/TOWN:</label>
          <input
            className='input'
            id='editUserCity'
            type='text'
            placeholder={currentUser?.address?.city || 'CITY/TOWN'}//CurrentUser address city if provided or CITY/TOWN if not provided
            name='address.city'
            value={editUserData.address.city}
            onChange={handleInputChange}
            // ARIA ATTRIBUTES:
            aria-label='newCity or Town Input'
            aria-required='false'
          />
        </div>
        {/* PROVINCE */}
        <div className='input-div'>
          <label className='edit-user-label' htmlFor='editUserProvince'>PROVINCE:</label>
          <select
            className='input'
            id='editUserProvince'
            name='address.province'
            value={editUserData.address.province}
            onChange={handleInputChange}
            // ARIA ATTRIBUTES:
            aria-required='false'
          >
          {/* SET CURRENT PROVINCE AS PLACEHOLDER OR SELECT IF NOT PROVIDED */}
             <option value=''>{currentUser?.address?.province || 'SELECT'}</option>
                {provinces.map(p => (
                    <option key={p} value={p}>{p}</option>
                ))}
          </select>
        </div>
      </div>
    </Stack>
      </div>
    </div>
    {/* =====END OF INPUT======== */}
    {/* GROUP 3: CLEAR FORM BUTTON + SUBMIT/EDIT USER BUTTON */}
    <div id='edit-user-group3'>
    {/* Inline request/validation feedback, announced to screen readers */}
    {status && (
      <div className='p-2' id='edit-user-status'>
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
    {/* STACK 4 */}
      <Stack direction="horizontal" gap={3} id='edit-user-stack4'>
      <div className="p-2"></div>
      <div className="p-2 ms-auto">
        <Button
        variant='danger'
        id='clearFormBtn'
        type='button'
        onClick={clearEditUserForm}
        disabled={loading}
        // ARIA ATTRIBUTES:
        aria-disabled={loading}
        aria-label='clear form'
        >CLEAR</Button>
      </div>
      <div className="p-2">
        <Button
        variant='light'
        id='edit-userBtn'
        type='submit'
        disabled={loading}
        // ARIA ATTRIBUTES:
        aria-disabled={loading}
        aria-label={loading ? 'SAVING...' : 'EDIT USER'}
        >
        {loading ? 'SAVING...' : 'EDIT USER'}
        </Button>
      </div>
    </Stack>
    </div>
    </form>
  )
}
