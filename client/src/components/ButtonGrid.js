// ButtonGrid.js
//IMPORT REQUIRED MODULES AND PACKAGES
import React from 'react'
// IMPORT CSS STYLESHEETS
import '../css/componentsCsss/ButtonGrid.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
// IMPORT ICONS FROM LUCIDE-REACT
import { Divide, 
        Equal, 
        Minus, 
        X, 
        Plus, 
        Delete
    } from 'lucide-react';

export default function ButtonGrid() {
  return (
    <div id='btnGrid' aria-labelledby='calculatorBtnGrid'>
            {/* ---------Screen Reader Heading----- */}
            <p className='visually-hidden' id='calculatorBtnGrid'>BUTTON GRID</p>
            <Stack gap={3} id='buttonGridStack'>
            {/* ------LINE 1: 7, 8, 9, divide----------- */}
            <div id='line1' aria-label='First row of calculator buttons' >
                {/* Button: 7 */}
                <Button variant='secondary' id='Btn7'>7</Button>
                {/* Button 8 */}
                <Button variant='secondary' id='Btn8'>8</Button>
                {/* Button 9 */}
                <Button variant='secondary' id='Btn9'>9</Button>
                {/* Button: divide */}
                <Button variant='secondary' id='Btn9'> 
                    <Divide size={16} fontWeight={700} aria-hidden='true' focusable='false'/>
                </Button>
            </div>
       {/* -----------LINE 2: 4, 5, 6, Multiply ---------------- */}
      <div className="p-2" id='line2' aria-label='Second row of calculator buttons'>
        {/* Button 4 */}
        <Button variant='secondary' id='Btn4'>4</Button>
        {/* Button 5 */}
        <Button variant='secondary' id='Btn5'>5</Button>
        {/* Button 6 */}
        <Button variant='secondary' id='Btn6'>6</Button>
        {/* Button: Multiply */}
        <Button variant='secondary' id='multiplyBtn'>
            <X size={16} fontWeight={700} aria-hidden='true' focusable='false'/>
        </Button>
      </div>
      {/* ------LINE 3 : 1, 2, 3, Minus------------ */}
      <div  id='line3' aria-label='Third row of calculator buttons'>
        {/* Button: 1 */}
        <Button variant='secondary' id='Btn1'>1</Button>
        {/* Button: 2 */}
        <Button variant='secondary' id='Btn2'>2</Button>
        {/* Button: 3 */}
        <Button variant='secondary' id='Btn3'>3</Button>
        {/* Button: Minus */}
        <Button variant='secondary' id='minusBtn'>
            <Minus size={16} fontWeight={700} aria-hidden='true' focusable='false'/>
        </Button>
      </div>
      {/* ------LINE 4: 0 , decimal,equal, plus ------------ */}
      <div className="p-2">
        {/* Button: 0 */}
        <Button variant='secondary' id='Btn3'>0</Button>
        {/* Button: decimal Point */}
        <Button variant='secondary' id='Btn3'>.</Button>
        {/* Button: Equals */}
        <Button variant='secondary' id='equalsBtn'>
            <Equal size={16}  fontWeight={700} aria-hidden='true' focusable='false'/>
        </Button>
        {/* Button: Plus */}
        <Button variant='secondary' id='plusBtn'>
            <Plus size={16}  fontWeight={700} aria-hidden='true' focusable='false'/>
        </Button>
      </div>
      {/* -----LINE 5: Clear Btn + BackSpace------------ */}
      <div id='line5' aria-label='Clear button row'>
        {/* Button: Clear (C) */}
        <Button variant='secondary' id='clearBtn'>
            C
        </Button>
        {/* Button: Backspace */}
        <Button variant='secondary' id='backSpaceBtn'> 
            <Delete size={20} fontWeight={700} aria-hidden='true' focusable='false' />
        </Button>
      </div>
    </Stack>
    </div>
  )
}
