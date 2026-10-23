import React from 'react'
import '../css/componentCss/Header.css';
import '../css/componentCss/Navbar.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
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
                <nav id='navigation'>
                <ul id='navbar' gap={2} >
                    <Stack gap={3} className="col-md-5 mx-auto">
                    <div className="p-2" id='navbar-block1'>
                    {/* Link to dashBoard(Home Page) */}
                        {currentUser && (
                            <li className='linkItem'>
                                <NavLink to='/' className='refLink'>DASHBOARD</NavLink>
                            </li> 
                        )}
                        {/* Link To Profile Page*/}
                        {currentUser && (
                            <li className='linkItem'>
                                <NavLink to='/profile' className='refLink'>PROFILE</NavLink>
                            </li>
                        )}
                        {/* Link to TaxData page */}
                        {currentUser && (
                            <li className='linkItem'>
                                <NavLink to='/taxData' className='refLink'>TAX DATA</NavLink>
                            </li>
                        )}
                    </div>
                    {/* NAVBAR BLOCK 2: TaxCalculators + Currency Converter + Calculations */}
                    <div className="p-2" id='navbar-block2'>
                        {/* Link TO TAX CALCULATORS Page */}
                        {currentUser && (
                            <li className='linkItem'>
                                <NavLink to='/calculators' className='refLink'>TAX CALCULATORS</NavLink>
                            </li>
                        )}
                        {/* Link to currency Converter Page */}
                        {currentUser && (
                            <li className='linkItem'>
                                <NavLink to='/currencyConverter' className='refLink'>CURRENCY CONVERTER</NavLink>
                            </li>
                        )} 
                        {/* Link to TAX CALCULATIONS Page */}
                        {currentUser && (
                            <li className='linkItem'>
                                <NavLink className='refLink' to='/calculations'>CALCULATIONS</NavLink>
                            </li>
                        )}
                        </div>
                        {/* NAVBAR BLOCK 2 (ADMIN ONLY ROUTES): Tax Data Configuration page + Users Page */}
                        <div className="p-2" id='navbar-block3'>
                        {/* Link to TAX DATA CONFIGURATION page */}
                        {currentUser.admin && (
                            <li className='linkItem' id='taxConfigLink'>
                                <NavLink to='/taxes' className='refLink'>TAX DATA CONFIGURATION</NavLink>
                            </li>
                        )}
                        {/* Link to TAX DATA CONFIGURATION page */}
                        {currentUser.admin && (
                            <li className='linkItem'>
                                <NavLink to='/users' className='refLink'>USERS</NavLink>
                            </li>
                        )}
      </div>
    
    </Stack>
                        
                       
                    </ul>
                </nav>
           

            </Col>
        </Row>
    </header>
  )
}
