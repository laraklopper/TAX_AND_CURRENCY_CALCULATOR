import React from 'react'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import {NavLink} from 'react-router-dom'
export default function MainHeader({mainHeading}) {
  return (
   <header>
    <Row>
        <Col>

        </Col>
    </Row>
    <Row>
        <Col/>
        <Col xs={5}>
            <span className='headerSpan'>
                <h1>APP HEADING</h1>
            </span>
        </Col>
        <Col/>
      </Row>
    <Row>
        <Col>
            <Stack direction="horizontal" gap={3} id='mainHeaderStack'>
                <div className="p-2">
                    <span className='headingSpan'>
                        <h2>{mainHeading}</h2>
                    </span>
                </div>
                <div className="p-2 ms-auto"></div>
                <div className="vr" />
                <div className="p-2">
                    <nav>
                        <ul id='loginNavBar'>
                            <li className='linkItem'>
                                <NavLink to='/'>LOGIN</NavLink>
                            </li>
                            <li className='linkItem'>
                                <NavLink to='/reg'>REGISTRATION</NavLink>
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
