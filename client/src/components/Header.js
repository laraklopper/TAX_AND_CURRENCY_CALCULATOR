import React from 'react'
import '../css/componentCss/Header.css';
import '../css/componentCss/Navbar.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import { NavLink } from 'react-router-dom';
export default function Header(
    {//PROPS PASSED FROM PARENT COMPONENT (Dashboard.js, Profile.js, TaxPage.js, TaxCalculators.js, CurrencyConverter.js, Calculations.js, TaxDataConfig.js, Users.js)
        currentUser,
        pageHeader}) {
  return (
    <header id='header' role='banner'>
        <Row id='headerRow1'>
            <Col/>
        </Row>
        <Row id='headerRow2'>
            <Col/>
            <Col xs={5} id='header-col'>
                <span className='headerSpan'>
                {/* Application Heading */}
                    <h1 id='appHeading'>TAX, CURRENCY & INTEREST CALCULATOR</h1>
                </span>
                <span className='headerSpan'>
                {/* Page Heading */}
                    <h2 id='page-heading'>{pageHeader}</h2>
                </span>
            </Col>
            <Col/>
        </Row>
        <Row id='headerNavRow'>
            <Col md={12} xs={12} id='navCol'>
                <nav id='navigation'>
                    <ul id='navbar' gap={2}>
                    {/* NAVIGATION BAR STACK */}
                        <Stack gap={3} id='navBarStack' className="col-md-5 mx-auto">
                            {/* NAVBAR BLOCK 1: Dashboard + Profile + Tax Data */}
                            {currentUser && (
                                <div className="p-2" id='navbar-block1'>
                                    {/* Link to DASHBOARD (Home) Page */}
                                    <li className='linkItem'>
                                        <NavLink to='/' className='refLink'>DASHBOARD</NavLink>
                                    </li>
                                    {/* Link to PROFILE Page */}
                                    <li className='linkItem'>
                                        <NavLink to='/profile' className='refLink'>PROFILE</NavLink>
                                    </li>
                                    {/* Link to TAX DATA Page */}
                                    <li className='linkItem'>
                                        <NavLink to='/taxData' className='refLink'>TAX DATA</NavLink>
                                    </li>
                                </div>
                            )}
                            {/* NAVBAR BLOCK 2: Tax Calculators + Currency Converter + Calculations */}
                            {currentUser && (
                                <div className="p-2" id='navbar-block2'>
                                    {/* Link to TAX CALCULATORS Page */}
                                    <li className='linkItem'>
                                        <NavLink to='/taxCalculators' className='refLink'>TAX CALCULATORS</NavLink>
                                    </li>
                                    {/* Link to CURRENCY CONVERTER Page */}
                                    <li className='linkItem'>
                                        <NavLink to='/currencyConverter' className='refLink'>CURRENCY CONVERTER</NavLink>
                                    </li>
                                    {/* Link to TAX CALCULATIONS Page */}
                                    <li className='linkItem'>
                                        <NavLink to='/calculations' className='refLink'>TAX CALCULATIONS</NavLink>
                                    </li>
                                </div>
                            )}
                            {/* NAVBAR BLOCK 3 (ADMIN ONLY ROUTES): Tax Data Configuration + Users */}
                            {currentUser?.admin && (
                                <div className="p-2" id='navbar-block3'>
                                    {/* Link to TAX DATA CONFIGURATION Page */}
                                    <li className='linkItem' id='taxConfigLink'>
                                        <NavLink to='/taxConfig' className='refLink'>TAX DATA CONFIGURATION</NavLink>
                                    </li>
                                    {/* Link to USERS Page */}
                                    <li className='linkItem'>
                                        <NavLink to='/users' className='refLink'>USERS</NavLink>
                                    </li>
                                </div>
                            )}
                        </Stack>
                    </ul>
                </nav>
            </Col>
        </Row>
    </header>
  )
}
