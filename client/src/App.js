import React, { useState } from 'react'
import './App.css'
// IMPORT BOOTSTRAP COMPONENTS
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
// IMPORT REACT ROUTER COMPONENTS
import { Route, Routes } from 'react-router-dom';
import { Bug } from 'lucide-react';
import Dashboard from './pages/Dashboard'
import Calculators from './pages/Calculators';
import CurrencyConverter from './pages/CurrencyConverter'
import Login from './pages/Login';
import Registration from './pages/Registration'
import Profile from './pages/Profile'
import Users from './pages/Users'
import ProtectedUserRoute from './protectedRoutes/ProtectedUserRoute';
import ProtectedAdminRoute from './protectedRoutes/ProtectedAdminRoute';
export default function App() {
  // const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [error, setError] = useState(null)
  const [userData, setUserData] = useState({
    fullName: {
      firstName: '',
      lastName:''
    },
    email: '',
    dateOfBirth:'',
    admin: false,
  })
  return (
    <>
      <Container role='main' id='appContainer'>
      <Row id='globalErrorRow'>
          <Col xs={0} md id='errorCol1'/>
          <Col xs={12} md={6} id='globalErrorCol' aria-live='polite'>
          {/* ---------GLOBAL ERROR MESSAGE------------ */}
            <div id='globalErrorBlock' role='alert' aria-atomic='true'>
              {error && 
              <p id='errorMessage'><Bug size={20} fontWeight={900} aria-hidden='true'/>{error}</p>
              }
            </div>
          </Col>
          <Col xs={0} md id='errorCol2'/>
        </Row>
        <Routes>
          {loggedIn ? (
            <>
            {/* Route to Home/Dashboard  */}
              <Route exact path='/' element={
                <ProtectedUserRoute currentUser={currentUser}>
                  <Dashboard currentUser={currentUser}/>
                </ProtectedUserRoute>
              }/>
              <Route path='/calculators' element={
                <ProtectedUserRoute currentUser={currentUser}>
                  <Calculators currentUser={currentUser}/>
                </ProtectedUserRoute>
              }/>
              <Route path='/currencyConverter' element={
                <ProtectedUserRoute currentUser={currentUser}>
                  <CurrencyConverter currentUser={currentUser}/>
                </ProtectedUserRoute>
              }/>
              <Route path='/profile' element={
                <ProtectedUserRoute currentUser={currentUser}>
                  <Profile currentUser={currentUser}/>
                </ProtectedUserRoute>
              }/>
              <Route path='/users' element={
                <ProtectedAdminRoute currentUser={currentUser}>
                  <Users currentUser={currentUser}/>
                </ProtectedAdminRoute>
              }/>
            </>
          ):(
            <>
              <Route exact path='/' element={
                <Login
                  userData={userData}
                  setUserData={setUserData}
                  setError={setError}
                  loggedIn={loggedIn}
                  setLoggedIn={setLoggedIn}
                  setCurrentUser={setCurrentUser}
                />
              }/>
              <Route path='/reg' element={
                <Registration/>
              }/>
            </>
          )}
        </Routes>
      </Container>
    </>
  )
}
