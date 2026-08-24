import React, { useEffect, useRef, useState, useCallback } from 'react'
import '../css/componentCss/CalculatorDisplay.css'
// IMPORT BOOTSTRAP COMPONENTS
import Stack from 'react-bootstrap/Stack';
// import Button from 'react-bootstrap/Button';
// IMPORT ICONS FROM LUCIDE-REACT
import { Equal } from 'lucide-react';
import ButtonGrid from './ButtonGrid';
// IMPORT UTILITY FUNCTIONS
import { evaluateExpression, isCalculatorKey } from '../utils/calculationFunc';

export default function NumberCalculator() {
    const [input, setInput] = useState('');// State to store the mathematical expression entered by the user
    const [result, setResult] = useState('');// Stores the calculated result displayed below the calculator
    /*State to Stores accessibility messages that are announced by screen readers
    whenever a button is pressed or a calculation is completed */
    const [liveMessage, setLiveMessage] = useState('')
    const inputRef = useRef(null)

    //Function to handles button clicks from ButtonGrid
    const handleClick = (value, label) => {
        setInput((prev) => prev + value)// Append the selected value to the current mathematical expression
        setLiveMessage(`${label} pressed`)// Announce the pressed button for screen readers
    }
    // Function to clear expression + result and announces the action
    const handleClear = () => {
        setInput('');                           // Clear the current expression
        setResult('');                           // Clear the calculated result
        setLiveMessage('Calculator cleared');    // Announce the action for screen readers
    };
    // Function to remove the last character from the current expression
    const handleBackspace = () => {
        setInput((prev) => prev.slice(0, -1));   // Remove the final character from the input string
        setLiveMessage('Backspace pressed');     // Announce the action for screen readers
    };

       //--------CALCULATOR  LOGIC------------
    // Memoized function that evaluates the mathematical expression
    const handleEquals = useCallback(() => {
        const { ok, value } = evaluateExpression(input)// Evaluate the mathematical expression using math.js

        //Conditional rendering to check the expression could be worked out
        if (!ok) {
            setResult('Error') // Display an error if the expression is invalid
            setLiveMessage('Invalid expression');// Announce the invalid expression
            return;// Exit the function early
        }

        setResult(value) // Display the calculated result
        setLiveMessage(`Result is ${value}`);// Announce the result for screen readers
    }, [input])
    useEffect(() => {
        const handleKeyDown = (event) => {
            const activeEl = document.activeElement;
            const isOtherInput =
                activeEl &&
                (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') &&
                activeEl !== inputRef.current;
            if (isOtherInput) return;// Exit if another input has focus
            const { key } = event;
            // Accept numbers, decimal point and mathematical operators
            if (isCalculatorKey(key)) {
                handleClick(key, key);            // Treat keyboard input the same as clicking a calculator button
            } else if (key === 'Enter' || key === '=') {
                handleEquals();// Calculate the expression when Enter or '=' is pressed
            } else if (key === 'Escape' || key.toLowerCase() === 'c') { // Clear
                handleClear(); // Clear the calculator when Escape or 'C' is pressed
            } else if (key === 'Backspace') {     // Backspace
                handleBackspace();// Remove the last character when Backspace is pressed
            }
        }
         window.addEventListener('keydown', handleKeyDown);// Register the keyboard listener when the component mounts
        /*Remove the event listener when the component unmounts
        to prevent memory leaks and duplicate listeners*/
        return () => window.removeEventListener('keydown', handleKeyDown); // Cleanup on unmount
    },[handleEquals])

  return (
    <div id='calculator-layout' aria-labelledby='calculator1Descrip'>
    {/* Screen-reader live region for announcing actions (hidden visually) */}
        {/*--------Screen Reader Heading--------------  */}
        <p className='visually-hidden' id='calculator1Descrip'>BASIC CALCULATOR</p>
        <div aria-live='assertive' aria-atomic='true' className='visually-hidden'>
            {liveMessage}
        </div>
        <div className='calculator-heading-block'>
            <h3 className='calculatorHeading'>CALCULATOR</h3>
        </div>
        <div id='basic-calculator-input'>
        <Stack gap={3} id='general-calculatorStack'>
        <div id='calculator-input-block'>
            <input
                type='text'
                className='input'
                id='calculatorInput'
                placeholder='0'
                value={input}
                tabIndex={0}
                ref={inputRef}
                readOnly
                // ARIA ATTRIBUTES:
                aria-label='Current Expression'
                aria-readonly='true'
            />
         {/* ==========CALCUTLATOR 1: RESULT DISPLAY======== */}
        <div id='result' tabIndex={-1} aria-live='polite' aria-atomic='true'>
            {/* Result display with '=' prefix */}
            <span id='calculator-output'>
                <Equal fontWeight={800} size={24} aria-hidden='true' focusable='false'/>
                <h4 id='outputText'>{result}</h4>
            </span>
        </div>
      </div>
      <div className="p-2" id='calculator-btn-block'>
        <ButtonGrid
            handleBackspace={handleBackspace}
            handleClear={handleClear}
            handleClick={handleClick}
            handleEquals={handleEquals}
        />
      </div>
    </Stack>
</div>
    </div>
  )
}
