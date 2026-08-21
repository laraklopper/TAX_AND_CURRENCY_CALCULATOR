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

// ===========HELPER FUNCTIONS===========
// Shown in place of any detail the user has not supplied (address line2 and
// province are the only optional fields on the user schema)
const NOT_PROVIDED = 'NOT PROVIDED'

// Fall back to a placeholder when a detail is missing or blank
const orPlaceholder = (value) =>
  (typeof value === 'string' && value.trim()) || NOT_PROVIDED

// Format an ISO date string as e.g. 01 March 2025
const toLongDate = (value) => {
  if (!value) return NOT_PROVIDED
  const date = new Date(value)
  if (isNaN(date.getTime())) return NOT_PROVIDED
  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

export default function Profile({currentUser, logout, setError}) {
  const [showEditUser, setShowEditUser] = useState(false)
  const [showEditPswd, setShowEditPswd] = useState(false)
  const [editUserData, setEditUserData] = useState({
    fullName: {
      firstName: '',
      lastName: '',
    },
    email: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      province: '',
    }
  })

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

  const editUser = useCallback(async () => {
    try {
      
    } catch (error) {
      
    }
  },[])
  //=======================================
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} pageHeader={'PROFILE'}/>
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
                <p className='details-value'>{toLongDate(dateOfBirth)}</p>
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
      
        {showEditUser && (
          <div id='edit-user-panal'>
            <Row id='edit-user-row'>
        <Col>
          <EditUserForm
            editUserData={editUserData}
            setEditUserData={setEditUserData}
            currentUser={currentUser}
            editUser={editUser}
          />
        </Col>
      </Row>


          </div>
        )}
        {showEditPswd &&(
          <div id='edit-password-panal'>
 <Row id='edit-password-row'>
        <Col id='edit-password-col1'></Col>
        <Col xs={6} id='edit-password-col'>
          <div id='edit-password-block'>
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
      <Footer logout={logout}/>
    </div>
  )
}
