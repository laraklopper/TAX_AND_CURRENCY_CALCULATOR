import React from 'react'
import '../css/componentCss/Header.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { NavLink } from 'react-router-dom';
export default function Header({currentUser, pageHeader}) {
  return (
    <header id='header'>
        <Row id='headerRow1'>
            <Col></Col>
        </Row>
        <Row id='headerRow2'>
            <Col/>
        <Col xs={5} id='header-col'>
            <span className='headerSpan'>
                <h1 id='appHeading'>TAX, CURRENCY & INTEREST CALCULATOR</h1>
            </span>
            <span className='headerSpan'>
            <h2 id='page-heading'>{pageHeader}</h2>

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
                                <NavLink to='/calculators' className='refLink'>CALCULATORS</NavLink>
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
                                <NavLink to='/taxes' className='refLink'>TAX DATA</NavLink>
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
