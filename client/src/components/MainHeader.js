import React from 'react'
import '../css/componentCss/Header.css'
import '../css/componentCss/Navbar.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import {NavLink} from 'react-router-dom'
export default function MainHeader({mainHeading}) {
  return (
   <header id='mainHeader' role='banner'>
    <Row id='headerRow1'>
        <Col id='mainHeaderCol1'></Col>
    </Row>
    <Row id='headerRow2'>
        <Col/>
        <Col xs={5}>
            <span className='headerSpan'>
                <h1 id='appHeading'>APP HEADING</h1>
            </span>
        </Col>
        <Col/>
      </Row>
    <Row id='mainNavRow'>
        <Col id='mainNavCol'>
            <Stack direction="horizontal" gap={3} id='mainHeaderStack'>
                <div className="p-2">
                    <span className='headingSpan'>
                        <h2 id='page-heading'>{mainHeading}</h2>
                    </span>
                </div>
                <div className="p-2 ms-auto"></div>
                <div className="vr" />
                <div className="p-2" id='main-nav-block'>
                    <nav id='navigation'>
                        <ul id='loginNavBar'>
                            <li className='linkItem'>
                                <NavLink to='/' className='refLink'>LOGIN</NavLink>
                            </li>
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
