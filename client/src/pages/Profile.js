import React, { useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Profile.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Header from '../components/Header'
import Footer from '../components/Footer'
import EditPasswordForm from '../components/EditPasswordForm';
import EditUserForm from '../components/EditUserForm';

export default function Profile({currentUser, logout, setError}) {
  const [showEditUser, setShowEditUser] = useState(false)
  const [showEditPswd, setShowEditPswd] = useState(false)

  const toggleEditUserForm = () => {
    setShowEditUser(prev => (!prev))
    setShowEditPswd(false)
  }
  const toggleEditPswdForm = () => {
    setShowEditPswd(prev => (!prev))
    setShowEditUser(false)
  }
  //=======================================
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} pageHeader={'PROFILE'}/>
      <section id='profile-section1'>
      <div id='user-profile-div'>
       
        <Row id='user-profileRow'>
        <Col xs={6}>
           <Stack gap={3}>
      <div className="p-2">
        <div>
          <span><p>FULL NAME</p></span>
        </div>
      </div>
      <div className="p-2">
      <div>
        <span><p>DATE OF BIRTH</p></span>
      </div>
        {/* Date of Birth */}
      </div>
    </Stack>
        </Col>
        <Col xs={6}>
           <Stack gap={3}>
      <div className="p-2">
        {/* Email */}
        <div>
          <span><p>EMAIL:</p></span>
        </div>
      </div>
      <div className="p-2">
        {/* Is admin */}
        <div>
        <span>
          <p>ADMIN:</p>
          {/* YES/NO */}
        </span>
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
        // aria-label=''
        aria-pressed={showEditUser}
        aria-expanded={showEditUser}
        aria-controls='edit-user-panal'
        >EDIT DETAILS</Button>
      </div>
      <div className="vr" style={{width: '2px', color: '#404040', opacity: '.75'}}/>
      <div className="p-2">
        {/* TOGGLE EDIT PASSWORD BUTTON */}
        <Button id='toggleEditPswdBtn' variant='light' onClick={toggleEditPswdForm}>EDIT PASSWORD</Button>
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
          <EditUserForm/>
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
