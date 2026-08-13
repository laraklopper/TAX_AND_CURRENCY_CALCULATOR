require('dotenv').config()
const express = require('express');
const { checkJwtToken } = require('./middleware');
const router = express.Router()

router.get('/convert', checkJwtToken ,async (req,res) => {
  const {from, to, amount} = req.query;  
    if (!from || !to || !amount) {// Conditional rendering to check if all required query params are present
        return res.status(400).json({ // Send a 400 (Bad Request) status code with a message
            success: false, 
            message: 'from, to, and amount query params are required' //JSON message
        });
    }
      const parsedAmount = parseFloat(amount);// Convert the amount string to a floating-point number
    if (isNaN(parsedAmount) || parsedAmount <= 0) {// Conditional rendering to validate that the amount is a positive number
        return res.status(400).json({// Send a 400 (Bad Request) status code with a message
             success: false, 
             message: 'amount must be a positive number' // JSON message
        });
    }

    // Conditional rendering
    if (from === to) {// Short-circuit: no conversion needed when source and target currencies are the same
        return res.status(200).json({ 
            success: true, 
            result: parsedAmount, 
            rate: 1, from, to, amount: parsedAmount });// Return the original amount with a rate of 1
    }

    const apiKey = process.env.CURRENCYFREAKS_API_KEY;// Read the CurrencyFreaks API key from environment variables
    if (!apiKey) {// Conditional rendering to check if the API key is configured
        console.error('[ERROR: apiRoutes.js, /convert] CURRENCYFREAKS_API_KEY not set');//Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Currency API not configured' });// Return a 500 (Internal Server Error) status code with a message
    }

    try {
        
    } catch (error) {
        
    }
})
module.exports= router