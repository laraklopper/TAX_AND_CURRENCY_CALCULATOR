import React, { useState } from 'react'
import '../css/componentCss/CalculatorDisplay.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';

export default function InterestCalc() {
    const  [principal, setPrincipal] = useState(0);// State to stores the principal (starting amount) entered by the user
    const [interestRate, setInterestRate] = useState(0); // State  used to store the interest rate
    const [timePeriod, setTimePeriod] = useState(0); // State used to store the time period
    const [totalInterest, setTotalInterest] = useState(0); // State used to store the calculated total interest

    // Event handler for principal input change
    function handlePrincipalChange(event) {
        setPrincipal(event.target.value);// Store the amount entered by the user
    }
    // Event handler for interest rate input change
    function handleInterestRateChange(event) {
        setInterestRate(event.target.value);// Store the interest rate entered by the user
    }
    // Event handler for time period input change
    function handleTimePeriodChange(event) {
        setTimePeriod(event.target.value);// Store the time period entered by the user (in months)
    }
    // Function to calculate the interest
    function calculateInterest() {
        // Apply the Simple Interest formula: Interest = (Principal × Interest Rate × Time) ÷ 100
        const interest =
            (principal * interestRate * timePeriod) / 100; // Calculate the interest
        setTotalInterest(interest); // Update the totalInterest state with the calculated interest
    }
    // Resets all interest calculator fields back to their initial values
    function handleResetInterest() {
        setPrincipal(0);// Reset the principal amount
        setInterestRate(0);// Reset the interest rate
        setTimePeriod(0);// Reset the time period
        setTotalInterest(0);// Clear the calculated interest
    }

  return (
     <div className='calculator-div' id='calculator-2' aria-labelledby='calculator2Descrip'>
                        {/* ---------Screen Reader Heading------------- */}
                        <p className='visually-hidden' id='calculator2Descrip'>INTEREST CALCULATOR</p>
                        <div id='interest-calculator-block'>
                                <div className='calculator-heading-block'>
                                    <h3 className='calculatorHeading'>INTEREST CALCULATOR</h3>
                                </div>
                                {/* -------------CALCULATOR 2: STACK 1----------------- */}
                                <div id='calculator-input'>
                                <Stack gap={3} id='calculator2Stack1'>
                                    {/* AMOUNT INPUT */}
                                    <div  id='amountInputBlock'>
                                        <label className='calculatorLabel'>AMOUNT:</label>
                                            <input
                                                className='input'
                                                id='amountInput'
                                                placeholder='0'
                                                type='number'
                                                step='0.01'
                                                autoComplete='off'
                                                value={principal}
                                                onChange={handlePrincipalChange}
                                                //ARIA ATTRIBUTES
                                            />
                                       
                                        {/* --------INTEREST RATE-------------- */}
                                    </div>
                                    <div id='interestInputBlock'>
                                    <label className='calculatorLabel' htmlFor='interestInput'>INTEREST:</label>
                                        <input
                                            className='input'
                                            id='interestInput'
                                            type='number'
                                            required
                                            autoComplete='off'
                                            step='0.01'
                                            value={interestRate}
                                            onChange={handleInterestRateChange}
                                            // ARIA ATTRIBUTES:
                                            // aria-label=''
                                        />
                                    </div>
                                    {/* ----------TIME PERIOD (months)-------- */}
                                    <div id='periodInputBlock'>
                        <label className='calculatorLabel' htmlFor='timeInput'>PERIOD:</label>
                                        <input
                                            className='input'
                                            id='timeInput'
                                            type='number'
                                            required
                                            autoComplete='off'
                                            placeholder='0'
                                            step='1'
                                            value={timePeriod}
                                            onChange={handleTimePeriodChange}
                                            // ARIA ATTRIBUTES:
                                            aria-label='Interest-period-input'
                                        />           
                                    </div>
                                </Stack>
                                {/* ======== STACK 2 */}
                                <Stack gap={3} id='calculator2Stack2'>
                                    <div id='calculateInterestBtn-block'>
                                        <Button
                                            type='button'
                                            onClick={calculateInterest}
                                            id='calculateInterestBtn'
                                            variant='light'
                                            // ARIA ATTRIBUTES:
                                            aria-label='Calculate interest'
                                        >
                                            CALCULATE INTEREST
                                        </Button>
                                    </div>
                                    {/* INTEREST OUTPUT */}
                                    <div id='interestOutputBlock'>
                                        {/* OUTPUT */}
                                        <h6 className='calculatorLabel'>INTEREST:</h6>
                                        {/* <h6 className='calculatorLabel'><strong>R</strong></h6> */}
                                        <h6 className='calculatorLabel'>{totalInterest}</h6>
                                    </div>
                                    <div className="p-2">
                                        <Button
                                            id='clearFormBtn'
                                            type='button'
                                            variant='danger'
                                            onClick={handleResetInterest}
                                            // ARIA ATTRIBUTES:
                                            aria-label='Reset interest calculator'
                                        >
                                            RESET CALCULATOR
                                        </Button>
                                    </div>
                                </Stack>
                                </div>
                        </div>
                    </div>  
  )
}
