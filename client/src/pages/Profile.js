import React, { useState } from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Profile.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Profile({currentUser, logout}) {
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
        {/* Full Name */}
      </div>
      <div className="p-2">
        {/* Date of Birth */}
      </div>
    </Stack>
        </Col>
        <Col xs={6}>
           <Stack gap={3}>
      <div className="p-2">
        {/* Email */}
      </div>
      <div className="p-2">
        {/* Is admin */}
      </div>
    </Stack>
        </Col>
      </Row>
      {/* EDIT USER AND EDIT PASSWORD FORMS */}
       <Row id='edit-user-row'>
          <Col>
            <Stack direction="horizontal" gap={3} id='edit-user-stack'>
      <div className="p-2"></div>
      <div className="p-2 ms-auto">
        {/* TOGGLE EDIT USER BUTTON */}
        <Button variant='light' id='toggleEditUserBtn' onClick={toggleEditUserForm}>EDIT DETAILS</Button>
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
      <div>
        {showEditUser && (
          <div>

          </div>
        )}
        {showEditPswd &&(
          <div>
            
          </div>
        )}
      </div>
      </section>
      <Footer logout={logout}/>
    </div>
  )
}
