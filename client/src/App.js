import React, { useState } from 'react'
import './App.css'
// IMPORT BOOTSTRAP COMPONENTS
import Container from 'react-bootstrap/Container';
// import Row from 'react-bootstrap/Row';
// import Col from 'react-bootstrap/Col';
// IMPORT REACT ROUTER COMPONENTS
import { Routes } from 'react-router-dom';
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [error, setError] = useState(null)
  
  return (
    <>
      <Container>
        <Routes>
          
        </Routes>
      </Container>
    </>
  )
}
