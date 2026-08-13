import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
export default function Dashboard({currentUser, logout}) {
  return (
    <div id='pageContainer' role='main'>
      <Header currentUser={currentUser}/>
      <section>
        
      </section>
      <Footer logout={logout}/>
    </div>
  )
}
