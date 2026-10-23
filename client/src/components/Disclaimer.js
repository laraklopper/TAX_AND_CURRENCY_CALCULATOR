import React from 'react'
import Card from 'react-bootstrap/Card';

export default function Disclaimer() {
  return (
    <Card id='disclaimerCard'>
      <Card.Header id='cardHeading'>
        DISCLAIMER:
      </Card.Header>
      <Card.Body>
        <Card.Title>Special title treatment</Card.Title>
        <Card.Text>
          With supporting text below as a natural lead-in to additional content.
        </Card.Text>
        <Card.Link href='https://www.sars.gov.za/' target='blank' className='web-link'>https://www.sars.gov.za/</Card.Link>
      </Card.Body>
    </Card>

  )
}
