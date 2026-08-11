import React, { useState } from 'react'
import './App.css'
// IMPORT BOOTSTRAP COMPONENTS
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
// IMPORT REACT ROUTER COMPONENTS
import { Route, Routes } from 'react-router-dom';
import { Bug } from 'lucide-react';
import Home from './pages/Home';
import Login from './pages/Login';
import Registration from './pages/Registration'
import ProtectedUserRoute from './protectedRoutes/ProtectedUserRoute';
export default function App() {
  // const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [error, setError] = useState(null)
  
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
                <ProtectedUserRoute>
                  <Home/>
                </ProtectedUserRoute>
              }/>
            </>
          ):(
            <>
              <Route exact path='/' element={
                <Login/>
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
