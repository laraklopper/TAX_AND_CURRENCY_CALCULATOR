// MainHeader.js
//IMPORT REQUIRED MODULES AND PACKAGES
import React, { useEffect, useState } from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentCss/Header.css'
import '../css/componentCss/Navbar.css'
// IMPORT BOOTSTRAP COMPONENTS
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import ListGroup from 'react-bootstrap/ListGroup';
//IMPORT REACT-ROUTER-DOM COMPENTS
import {NavLink} from 'react-router-dom'
// IMPORT UTILITY FUNCTIONS
import {dateDisplay, timeDisplay} from '../utils/timeFunctions';
// IMPORT ICONS FROM LUCIDE-REACT
import {Calendar, Clock8 } from 'lucide-react';

//MainHeader Function Component
export default function MainHeader(//Export default MainHeader.js function component
    {//PROPS PASSED TO PARENT COMPONENT(Login.js, Register.js)
        mainHeading
    }
    ) {
    //==========STATE VARIABLES==============
    const [date, setDate] = useState(new Date());//State to store header date/time (updated every second)

    //================EFFECT LIVE CLOCK================//
    useEffect(() => {
        const timer = setInterval(() => {
            setDate(new Date())
            return () => clearInterval(timer)
        }, 1000);
        // Cleanup function:
        // Clears interval when component unmounts
        // Prevents memory leaks and duplicate timers
        return () => clearInterval(timer)
    },[])



    //======================
  return (
   <header id='mainHeader' role='banner' aria-labelledby='pageHeader'>
   {/* --------Screen Reader Heading---------------- */}
    <p className='visually-hidden' id='pageHeader'>HEADER</p>
   {/* Header Row 1: Date + Time */}
    <Row id='headerRow1'>
        <Col id='mainHeaderCol1' md={12}>
             <Stack direction="horizontal" gap={3} id='header-time-stack'>
                <div className="p-2" id='header-time'>
                    <ListGroup variant="flush" id='header-date-list'>
                    {/* Date: dateDisplay  -> formats Date into readable date string */}
                        <ListGroup.Item id='dateItem' aria-labelledby='dateLabel'>
                            <p id='dateLabel' className='visually-hidden'>Current Date:</p>
                            <h5 className='clockListText'><Calendar size={20} aria-hidden='true' focusable='false'/>{dateDisplay(date)}</h5>
                        </ListGroup.Item>
                        {/* TIME: timeDisplay  -> formats Date into readable time string */}
                        <ListGroup.Item id='timeItem' aria-labelledby='timeLabel'>
                            <p id='timeLabel' className='visually-hidden'>Current Tiem</p>
                            <h5 className='clockListText'><Clock8  size={20} aria-hidden='true' focusable='false'/>{timeDisplay(date)}</h5>
                        </ListGroup.Item>
                    </ListGroup>
                </div>
                <div className="p-2 ms-auto"></div>
                <div className="p-2"></div>
            </Stack> 
        </Col>
    </Row>
    {/* Header row 2: App Heading */}
    <Row id='headerRow2'>
        <Col/>
        <Col xs={5} id='app-heading-col'>
            <span className='headerSpan'>
                <h1 id='appHeading'>TAX, CURRENCY & INTEREST CALCULATOR</h1>
            </span>
        </Col>
        <Col/>
      </Row>
      {/* Header Row 3; Page Heading and Navigation Bar */}
    <Row id='headerRow3'>
        <Col id='mainNavCol'>
            {/* MAIN HEADER STACK: Page Heading and Navigation Bar   */}
            <Stack direction="horizontal" gap={3} id='mainHeaderStack'>
                <div className="p-2">
                {/* Page Heading */}
                    <span className='headingSpan'>
                        <h2 id='page-heading'>{mainHeading}</h2>
                    </span>
                </div>
                <div className="p-2 ms-auto"></div>
                <div className="vr" />
                <div className="p-2" id='main-nav-block'>
                {/* NAVIGATION BAR: Login and Registration pages */}
                    <nav id='navigation'>
                        <ul id='loginNavBar'>
                        {/* Link to Login Page */}
                            <li className='linkItem'>
                                <NavLink to='/' className='refLink'>LOGIN</NavLink>
                            </li>
                            {/* Link to registration page */}
                            <li className='linkItem'>
                                <NavLink to='/reg' className='refLink'>REGISTRATION</NavLink>
                            </li>
                        </ul>
                    </nav>
                </div>
            </Stack>
        </Col>
    </Row>
   </header>
  )
}
