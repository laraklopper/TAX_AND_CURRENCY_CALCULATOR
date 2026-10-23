import React from 'react'
import '../css/pagesCss/TaxCalculators.css'
import '../css/pagesCss/PageSetup.css'
import Header from '../components/Header'
import Footer from '../components/Footer'
export default function TaxPage({currentUser, logout}) {
  return (
    <div id='pageContainer'>
        <Header pageHeader={'TAX'} currentUser={currentUser}/>
        <section>
            
        </section>
        <Footer logout={logout}/>
    </div>
  )
}
