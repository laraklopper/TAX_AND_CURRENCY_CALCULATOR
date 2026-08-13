import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Calculators({currentUser, logout}) {
  return (
    <div>
      <Header currentUser={currentUser}/>
      <section></section>
      <Footer logout={logout}/>
    </div>
  )
}
