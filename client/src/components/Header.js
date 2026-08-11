import React from 'react'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { NavLink } from 'react-router-dom';
export default function Header({currentUser}) {
  return (
    <header>
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
        <Row>
            <Col>
            <div>
                <nav>
                    <ul>
                        {currentUser && (
                            <li>
                                <NavLink to='/'>DASHBOARD</NavLink>
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
