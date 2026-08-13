import React from 'react'
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/CurrencyConvert.css'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function CurrencyConverter({currentUser, logout}) {
  return (
    <div id='pageContainer' role='main'>
      <Header currentUser={currentUser} pageHeader={'CURRENCY CONVERTER'}/>
      <section id='currency-converter-sec1'>
        {/*Currency Converter form  */}
      </section>
      <Footer logout={logout}/>
    </div>
  )
}
