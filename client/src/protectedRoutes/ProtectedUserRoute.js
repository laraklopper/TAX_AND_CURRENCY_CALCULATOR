import React from 'react'
import { Navigate } from 'react-router-dom'

//ProtectedUserRoute Function Component
export default function ProtectedUserRoute(//Export default ProtectedUserRoute.js Function Component
  {//PROPS PASSED FROM PARENT COMPONENT
        currentUser, 
        children
    }
 ) {
  if (!currentUser) {
    return <Navigate/>
  }
  return children
}