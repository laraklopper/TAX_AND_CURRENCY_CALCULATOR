//ResetPswdHeader.js
import React, { useEffect, useState } from 'react'
import '../css/componentCss/Header.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import ListGroup from 'react-bootstrap/ListGroup';
import {Calendar, Clock8 } from 'lucide-react';
import { dateDisplay, timeDisplay } from '../utils/timeFunctions';

export default function ResetPswdHeader(
    {//PROPS PASSED TO PARENT COMPONENT(ForgotPassword.js, ResetPassword.js)
    resetPswdHeading
    }) {
    const [date, setDate] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => {
           setDate(new Date())
           return () => clearInterval(timer) 
        }, 1000)
        return () => clearInterval(timer)
    },[])

  return (
        <header id='forgotPswdHeader' role='banner'>
            <Row id='forgot-pswd-headerRow1' md={12}>
                    <Col id='forgotPswdHeadCol1'>
                           <Stack direction="horizontal" gap={3} id='resetPswdClock-stack'>
                                <div className="p-2" id='reset-pswd-clock-block'>
<ListGroup variant="flush" id='reset-pswd-date-list'>
      <ListGroup.Item id='dateItem' aria-labelledby='dateLabel'>
      {/* --------Screen Reader Heading--------- */}
      <p id='dateLabel' className='visually-hidden'>Current Date:</p>
      {/* DATE: dateDisplay  -> formats Date into readable date string */}
      <h5 className='clockListText'>
        <Calendar size={20} aria-hidden='true' focusable='false'/>{dateDisplay(date)}
      </h5>
      </ListGroup.Item>
      <ListGroup.Item id='timeItem' aria-labelledby='timeLabel'>
      {/* --------Screen Reader Heading--------- */}
        <p id='timeLabel' className='visually-hidden'>Current Time:</p>
        {/* TIME: timeDisplay  -> formats Date into readable time string */}
        <h5 className='clockListText'>
            <Clock8 size={20} aria-hidden='true' focusable='false'/>{timeDisplay(date)}
        </h5>
      </ListGroup.Item>
     
    </ListGroup>
                                </div>
                                <div className="p-2 ms-auto"></div>
                                <div className="p-2"></div>
                            </Stack>
                    </Col>
            </Row>
             <Row id='headerRow2'>
        <Col/>
        <Col xs={5} id='app-heading-col'>
            <span className='forgot-password-head-span'>
                <h1 id='appHeading'>TAX, CURRENCY & INTEREST CALCULATOR</h1>
                <h2 id='page-heading'>{resetPswdHeading}</h2>
            </span>
        </Col>
        <Col/>
      </Row>
      <Row id='forgotPswdHeadRow3'>
            <Col id='forgotPswdHeadCol3'/>
        </Row>
        </header>
  )
}
