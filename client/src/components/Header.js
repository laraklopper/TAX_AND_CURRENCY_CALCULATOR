import React from 'react'
import '../css/componentCss/Header.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { NavLink } from 'react-router-dom';
export default function Header({currentUser}) {
  return (
    <header id='header'>
        <Row>
            <Col></Col>
        </Row>
        <Row>
            <Col/>
        <Col xs={5}>
            <span className='headingSpan'>
                <h1>APP HEADING</h1>
            </span>
        </Col>
        <Col/>
        </Row>
        <Row id='headerNav row'>
            <Col md={12} xs={12} id='navCol'>
            <div>
                <nav>
                    <ul>
                        {currentUser && (
                            <li>
                                <NavLink to='/'>DASHBOARD</NavLink>
                            </li> 
                        )}
                        {currentUser && (
                            <li>
                                <NavLink to='/calculators' className='refLink'>CALCULATOR</NavLink>
                            </li>
                        )}
                        {currentUser && (
                            <li>
                                <NavLink to='/currencyConverter' className='refLink'>CURRENCY CONVERTER</NavLink>
                            </li>
                        )}
                        {currentUser && (
                            <li>
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
