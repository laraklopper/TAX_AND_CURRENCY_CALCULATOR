import React from 'react'
import '../css/pagesCss/PageSetup.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Calculators({currentUser, logout}) {
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} pageHeader={'CALCULATORS'}/>
      <section></section>
      <Footer logout={logout}/>
    </div>
  )
}
