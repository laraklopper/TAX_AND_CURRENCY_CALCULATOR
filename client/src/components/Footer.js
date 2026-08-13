import React from 'react'
import '../css/componentCss/Footer.css'
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
export default function Footer({logout}) {
  return (
    <footer id='loggedIn-footer'>
         <Row id='footerRow1'>
          <Col id='footer-col1'>
            <Stack direction="horizontal" gap={3} id='logout-stack'>
                <div className="p-2"></div>
                <div className="p-2 ms-auto"></div>
                <div className="p-2">
                <Button 
                  variant="warning" 
                  id='logoutBtn' 
                  onClick={logout}
                  type='button'
                  // ARIA ATTRIBUTES:
                  aria-label='logout'
                  >
                  LOGOUT
                  </Button>
                  </div>
            </Stack>
          </Col>
        </Row>
        <Row>
            <Col md={12}/>
        </Row>
         {/* Row 3: CopyRight Information */}
      <Row id='copyRightRow'>
        <Col xs={0} md id='copyRightCol1'/>
        <Col xs={12} md={4} id='copyRightCol'>
          <div id='copyright-div' >
            <p id='copyrightText' aria-label='copy right details' aria-live='polite' >© 2026 Tax Calculator App. All rights reserved.</p>
          </div>
        </Col>
        <Col xs={0} md id='copyRightCol2'/>
      </Row>

    </footer>
  )
}
