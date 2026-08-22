// Users.js
//IMPORT REQUIRED MODULES AND PACKAGES
import React from 'react'
// IMPORT CSS STYLESHEETS
import '../css/pagesCss/PageSetup.css'
import '../css/pagesCss/Users.css'
//IMPORT CUSTOM COMPONENTS
import Header from '../components/Header'
import Footer from '../components/Footer'

// =======MAIN USERS PAGE COMPONENT===========
export default function Users(
  {//PROPS PASSED FROM PARENT COMPONENT (App.js)
    currentUser, 
    logout
  }) {

    //============JSX RENDERING=============
  return (
    <div>
      <Header pageHeader='USERS' currentUser={currentUser}/>
      <section>

      </section>
      <Footer logout={logout}/>

    </div>
  )
}
