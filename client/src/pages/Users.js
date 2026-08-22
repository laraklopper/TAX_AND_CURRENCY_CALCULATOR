// Users.js
//IMPORT REQUIRED MODULES AND PACKAGES
import React from 'react'
// IMPORT CSS STYLESHEETS
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Users.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
//IMPORT CUSTOM COMPONENTS
import Header from '../components/Header'
import Footer from '../components/Footer'
import UsersList from '../components/UsersList';
import { FileUser } from 'lucide-react';
// =======MAIN USERS PAGE COMPONENT===========
export default function Users(
  {//PROPS PASSED FROM PARENT COMPONENT (App.js)
    currentUser, 
    users, 
    setUsers, 
    logout, 
    setError
  }) {

    //============JSX RENDERING=============
  return (
    <div id='pageContainer'>
      <Header pageHeader='USERS' currentUser={currentUser}/>
      <Row id='event-row'>
        <Col id='event-col'>
          <div className='event-bar'>
            <div className='event-track'>
              <FileUser className='event-slide' size={32} aria-hidden='true' focusable='false' />
            </div>
          </div>
        </Col>
      </Row>
      <section id='users-section1'>
      <Row id='usersListHead-row'>
        <Col id='userlist-head-col1'/>
        <Col xs={5} id='userlist-head-col'><h4 id='user-list-heading'>REGISTERED USERS</h4></Col>
        <Col id='userlist-head-col2'/>
      </Row>
        <Row id='userslist-row'>
          <Col id='users-list-col'>
            <div id='users-list-panal'>
              <UsersList
                currentUser={currentUser}
                setError={setError}
                users={users}
                setUsers={setUsers}
              />
            </div>

          </Col>

        </Row>

      </section>
      <Footer logout={logout}/>

    </div>
  )
}
