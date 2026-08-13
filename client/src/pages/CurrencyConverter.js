import React from 'react'
import '../css/pagesCss/PageSetup.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function CurrencyConverter({currentUser, logout}) {
  return (
    <div id='pageContainer'>
      <Header currentUser={currentUser} pageHeader={'CURRENCY CONVERTER'}/>
      <Footer logout={logout}/>
    </div>
  )
}
