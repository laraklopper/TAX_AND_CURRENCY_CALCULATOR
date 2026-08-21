import React, { useCallback, useEffect, useState } from 'react'
import './App.css';
import './css/pagesCss/Error.css'
// IMPORT BOOTSTRAP COMPONENTS
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
// IMPORT REACT ROUTER COMPONENTS
import { Route, Routes, useNavigate } from 'react-router-dom';
import { Bug, GlobeOff } from 'lucide-react';
import Dashboard from './pages/Dashboard'
import Calculators from './pages/Calculators';
import CurrencyConverter from './pages/CurrencyConverter'
import Login from './pages/Login';
import Registration from './pages/Registration'
import Profile from './pages/Profile'
import TaxData from './pages/TaxData';
import ProtectedUserRoute from './protectedRoutes/ProtectedUserRoute';
import ProtectedAdminRoute from './protectedRoutes/ProtectedAdminRoute';
export default function App() {
  const [users, setUsers] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loggedIn, setLoggedIn] = useState(false)
  const [error, setError] = useState(null)
  const [userData, setUserData] = useState({
    fullName: {
      firstName: '',
      lastName:''
    },
    email: '',
    password: '',
    dateOfBirth:'',
    admin: false,
  })

  const navigate = useNavigate()

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        
        const token = localStorage.getItem('token');// Retrieve the JWT token from localStorage
        /*Conditional rendering to check if token is 
        found or user is loggedIn*/
        if (!token || !loggedIn) return

        const response = await fetch('http://localhost:3001/users/fetchUsers', {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',// Specify the content type as JSON
            'Authorization': `Bearer ${token}`//Attatch the token in the Authorization header
          }
        })

        const fetchedUsers = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(fetchedUsers?.message || fetchedUsers?.error || 'Failed to fetch users');
        //Conditional rendering to ensure the data is an array
        if (Array.isArray(fetchedUsers)) {
          setUsers(fetchedUsers);//Update the setUsers state with the usersList
          setError(null);// Clear any previous errors
          console.log(`[SUCCESS: App.js] Fetched ${fetchedUsers.length} users`);
        } else {
          throw new Error('Invalid data format received from server');//Throw an error message if the data format is invalid
        }

      } catch (error) {
        console.error('Error fetching user data:', error.message);//Log an error message in the console for debugging purposes
        setError(`Error fetching user data: ${error.message}`);// Set the error state to display the error in the UI
      }
    }

    //Function to fetch current loggedIn user
    const fetchCurrentUser = async () => {//Define an async function to fetch current user details
      try {
      
        const token = localStorage.getItem('token');// Retrieve the JWT token from localStorage
        if (!token || !loggedIn) return;// If no token is found, exit the function
        const response = await fetch('http://localhost:3001/users/me', {
          method: 'GET',//HTTP request method
          mode: 'cors',//Enable Cross-Origin Resource Sharing 
          headers: { 
            'Content-Type': 'application/json',// Specify the Content-Type being sent in the request payload.
            'Authorization': `Bearer ${token}` // Attach the token in the Authorization header  
          },
        });
        const fetchedUser = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(fetchedUser?.message || fetchedUser?.error || 'Failed to fetch current user');
        if (fetchedUser && typeof fetchedUser === 'object' && !fetchedUser.error) {
          setCurrentUser(fetchedUser);
          setError(null);// Clear any previous errors
          console.log('[SUCCESS: App.js] Fetched current user data');
        } else {
          throw new Error('Invalid data format received from server');//Throw an error message if the data format is invalid
        }
      } catch (error) {
        console.error('Error fetching current user data:', error.message);//Log an error message in the console for debugging purposes
        setError(`Error fetching current user data: ${error.message}`);// Set the error state to display the error in the UI
      }
    };
       //Conditional rendering to check if the user is logged in before fetching data
    if (loggedIn) {
      /* Call the FetchUsers function to 
      fetch the list of users*/
      fetchCurrentUser();
      /*Call the FetchCurrentUser function to fetch the 
      current user's details*/
      fetchUsers();
    }
  },[loggedIn, setError])

  // ======================================
  const logout = useCallback(() => {
    //Clear localStorage
       localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('loggedIn')
    // Reset state
     setLoggedIn(false)
    setError('');// Clear any existing error messages
    setUserData()
    setUserData({//Reset the userData
      email: '',
      password: ''
    })//Reset the userData
      /*Use the navigate function to redirect the
    user to the login page after logging out*/
    navigate('/')
  },[navigate])
  //======================================
  return (
    <>
      <Container role='main' id='appContainer'>
      <Row id='globalErrorRow'>
          <Col xs={0} md id='errorCol1'/>
          <Col xs={12} md={8} id='globalErrorCol' aria-live='polite'>
          {/* ---------GLOBAL ERROR MESSAGE------------ */}
            <div id='globalErrorBlock' role='alert' aria-atomic='true'>
              {error && 
              <span id='error-span'>
                <Bug size={20} fontWeight={900} color='#3D0F13' aria-hidden='true'/>
                <p id='errorMessage'>{error}</p>  
              </span>
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
                  <Dashboard currentUser={currentUser} logout={logout}/>
                </ProtectedUserRoute>
              }/>
              <Route path='/calculators' element={
                <ProtectedUserRoute currentUser={currentUser}>
                  <Calculators currentUser={currentUser} logout={logout}/>
                </ProtectedUserRoute>
              }/>
              <Route path='/currencyConverter' element={
                <ProtectedUserRoute currentUser={currentUser}>
                  <CurrencyConverter currentUser={currentUser} logout={logout}/>
                </ProtectedUserRoute>
              }/>
              <Route path='/profile' element={
                <ProtectedUserRoute currentUser={currentUser}>
                  <Profile
                    currentUser={currentUser}
                    setCurrentUser={setCurrentUser}
                    users={users}
                    setUsers={setUsers}
                    setError={setError}
                    logout={logout}
                  />
                </ProtectedUserRoute>
              }/>
              <Route path='/taxes' element={
                <ProtectedAdminRoute currentUser={currentUser}>
                <TaxData users={users} currentUser={currentUser} logout={logout}/>
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
                <Registration setError={setError}/>
              }/>
            </>
          )}
          {/* FALL BACK ROUTE: Response 404 PAGE NOT FOUND */}
        <Route path='*' element={<span id='pageNotFound'>
<h2 id='pageNotFound-text'>404: Page Not Found </h2><GlobeOff fontSize={42} fontWeight={800} color='#470D09'/>
        </span>
        }/>
        </Routes>
        
      </Container>
    </>
  )
}
