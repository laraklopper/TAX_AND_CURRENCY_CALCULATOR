//ProtectedAdminRoute.js
import React from 'react'
import { Navigate } from 'react-router-dom'

export default function ProtectedAdminRoute(
  {//PROPS PASSED FROM PARENT COMPONENT
    currentUser, 
    children
  }) {

    // If there is no logged-in user OR the user is not an admin,
  // redirect them to the login(landing) page.
    if (!currentUser || !currentUser.admin) {
        return <Navigate to='/'/>
    }
      // If the user exists and is an admin,
  // render the protected content (child component).
  return children
}
