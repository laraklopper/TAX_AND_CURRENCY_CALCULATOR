import React from 'react'
import '../css/pagesCss/PageSetup.css'
// BOOTSTRAP COMPONENTS
// import Row from 'react-bootstrap/Row';
// import Col from 'react-bootstrap/Col';
// import Stack from 'react-bootstrap/Stack';
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Calculations({currentUser, logout}) {
  return (
    <div id='pageContainer'>
        <Header pageHeader={'CALCULATIONS'} currentUser={currentUser}/>
        <section id='calculations-section1'>

        </section>
        <Footer
            logout={logout}
        />
    </div>
  )
}
