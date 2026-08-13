import React from 'react'
import '../css/componentCss/Header.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { NavLink } from 'react-router-dom';
export default function Header({currentUser}) {
  return (
    <header id='header'>
        <Row id='headerRow1'>
            <Col></Col>
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
        <Row id='headerNavRow'>
            <Col md={12} xs={12} id='navCol'>
            <div>
                <nav id='navigation'>
                    <ul id='navbar'>
                        {currentUser && (
                            <li className='linkItem'>
                                <NavLink to='/' className='refLink'>DASHBOARD</NavLink>
                            </li> 
                        )}
                        {currentUser && (
                            <li className='linkItem'>
                                <NavLink to='/calculators' className='refLink'>CALCULATOR</NavLink>
                            </li>
                        )}
                        {currentUser && (
                            <li className='linkItem'>
                                <NavLink to='/currencyConverter' className='refLink'>CURRENCY CONVERTER</NavLink>
                            </li>
                        )}
                        {currentUser && (
                            <li className='linkItem'>
                                <NavLink to='/profile' className='refLink'>PROFILE</NavLink>
                            </li>
                        )}
                        {currentUser.admin && (
                            <li>
                                <NavLink to='/users' className='refLink'>USERS</NavLink>
                            </li>
                        )}
                    </ul>
                </nav>
            </div>

            </Col>
        </Row>
    </header>
  )
}
