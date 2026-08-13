import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Users({currentUser, logout}) {
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser}/>
      <Footer logout={logout}/>
    </div>
  )
}
