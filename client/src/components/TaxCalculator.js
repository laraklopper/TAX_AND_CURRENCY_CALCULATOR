import React, { useState } from 'react'
import '../css/componentCss/CalculatorDisplay.css'
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';

export default function TaxCalculator() {
    const [amount, setAmount] = useState('')
    const [taxRate, setTaxRate] = useState(15)

       // Convert the entered amount from a string to a number.
    const parsedAmount = parseFloat(amount) || 0;// If the input is empty or invalid, use 0 instead.
    // Calculate the tax amount using the entered amount and tax rate.
    const taxAmount = (parsedAmount * taxRate) / 100; // Formula: Tax = Amount × Tax Rate ÷ 100
    const totalAmount = parsedAmount + taxAmount;// Calculate the total amount including tax.

    // Function to resets the Tax Calculator back to its default values
    const handleReset = () => {
        setAmount('') // Clear the amount entered by the user
        setTaxRate(15)// Reset the tax rate to the default South African VAT rate (15%)
    }

  return (
      <div className='calculator-div' id='calculator-3' aria-labelledby='calculator3Descrip'>
                        {/* -------Screen Reader Heading----------- */}
                        <p className='visually-hidden' id='calculator3Descrip'>TAX CALCULATOR : DEFAULT VALUE 15%</p>
                        <div id='tax-calculator-panal' aria-labelledby='calculator3Head'>
                            
                                <div className='calculator-heading-block'>
                                    <h3 className='calculatorHeading' id='calculator3Head'>TAX CALCULATOR</h3>
                                </div>
                                <div id='tax-calculator-input'>
                                {/* ========= STACK 1============= */}
                                <Stack gap={3} id='calculator3Stack1'>
                                    {/* ---------TAX AMOUNT------------------ */}
                                    <div className="p-2" id='taxAmountBlock'>
                                        <label htmlFor='taxAmountInput' className='calculatorLabel'>AMOUNT:</label>
                                        <input
                                            className='input'
                                            id='taxAmountInput'
                                            type="number"
                                            min="0"
                                            step='0.01'
                                            placeholder="Enter amount"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            // ARIA ATTRIBUTES:
                                            aria-label='Enter amount'
                                        />
                                    </div>
                                    <div className="p-2" id='taxRateBlock'>
                                        {/* ---------TAX RATE------------- */}
                                            <label className='calculatorLabel'>TAX RATE:</label>
                                            <input
                                                className='input'
                                                id='taxRateInput'
                                                type='number'
                                                required
                                                step='0.01'
                                                placeholder='TAX RATE'
                                                min="0"
                                                value={taxRate}
                                                onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                                                // ARIA ATTRIBUTES:
                                                aria-label='Tax rate'
                                            />
                                        
                                       
                                    </div>
                                </Stack>
                                {/* ======= STACK 2: OUTPUT======= */}
                                <Stack gap={3} id='calculator3Stack2'>
                                    {/* TAX OUTPUT DISPLAY */}
                                    <div id='tax-output-block'>
                                        <span className='tax-span'>
                                            <TaxRow label="Amount:" value={parsedAmount} />
                                        </span>
                                        <span className='tax-span'>
                                            <TaxRow label={`Tax (${taxRate}%)`} value={taxAmount} />
                                        </span>
                                        <span className='tax-span'>
                                            <TaxRow label="Total" value={totalAmount} bold />
                                        </span>
                                    </div>
                                    <hr style={{ color: '#000', height: .50 , display: 'flex', width: '80%'}} />
                                    <div className="p-2" id='resetTaxBtnDiv'>
                                        <Button
                                            variant='danger'
                                            id='resetBtn'
                                            onClick={handleReset}
                                            type='button'
                                            // ARIA ATTRIBUTES:
                                            aria-label='Reset Tax calculator'
                                        >
                                            RESET
                                        </Button>
                                    </div>
                                </Stack>
                            </div>
                        </div>
                    </div>  
  )
}

//================ TAX ROW COMPONENT =================
// Reusable component that displays a single output row in the Tax Calculator.
function TaxRow(
    { //PROPS
        label, // label - The text displayed on the left (e.g. Amount, Tax, Total)
        value, // value - The monetary value displayed on the right
        bold // bold  - Optional Boolean that makes the row bold
    }) {
    // ==========JSX RENDERING=============
    return (
        <div id='tax-div' role='group'>
            {/* Display the row label */}
            <p className='calculatorLabel' 
            // style={{ fontWeight: bold ? 'bold' : 'normal' }}
            >{label}</p>{/* Make text bold when bold=true */}
            {/* Display the formatted Rand value */}
            <p className='calculatorLabel' style={{ fontWeight: bold ? 'bold' : 'normal' }}>{/* Make value bold when bold=true */}
                R {value.toFixed(2)}
            </p>
        </div>
    );
}