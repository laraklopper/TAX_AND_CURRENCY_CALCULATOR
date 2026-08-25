import React from 'react'
import '../css/componentCss/Footer.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';

export default function PageFooter() {

    //============JSX RENDERING===============
  return (
             <footer className='pageFooter'>
        <Row id='footerRow1'>
          <Col id='footer-col1'>
            <Stack direction="horizontal" gap={3} id='page-footer-stack'>
      <div className="p-2"></div>
      <div className="p-2 ms-auto"></div>
      <div className="p-2">
        {/* CLOCK */}
      </div>
    </Stack>
          </Col>
        </Row>
         {/* Row 3: CopyRight Information */}
         <Row>
         <Col xs={0} md id='copyRightCol1'/>
        <Col xs={12} md={8}>
          <div id='copyright-div' >
            <p id='copyrightText' aria-label='copy right details' aria-live='polite' >© 2026 Tax Calculator App. All rights reserved.</p>
          </div>
        </Col>
        <Col xs={0} md id='copyRightCol2'/>
      </Row>
      </footer>
  )
}
