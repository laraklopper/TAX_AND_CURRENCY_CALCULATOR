require('dotenv').config()
const express = require('express');
const { checkJwtToken } = require('./middleware');
const { currencies } = require('../dataArrays/currencies');
const User = require('../models/userSchema');
const CurrencyConvert = require('../models/curConvertSchema');
const router = express.Router()

router.get('/convert', checkJwtToken ,async (req,res) => {
  const {from, to, amount} = req.query;
    if (!from || !to || !amount) {// Conditional rendering to check if all required query params are present
        return res.status(400).json({ // Send a 400 (Bad Request) status code with a message
            success: false,
            message: 'from, to, and amount query params are required' //JSON message
        });
    }

    const fromCurrency = String(from).trim().toUpperCase();// Normalize currency codes to uppercase
    const toCurrency = String(to).trim().toUpperCase();

    // Conditional rendering to validate both currency codes against the supported list
    if (!currencies.includes(fromCurrency) || !currencies.includes(toCurrency)) {
        return res.status(400).json({
            success: false,
            message: `from and to must be one of: ${currencies.join(', ')}`
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
    if (fromCurrency === toCurrency) {// Short-circuit: no conversion needed when source and target currencies are the same
        return res.status(200).json({
            success: true,
            result: parsedAmount,
            rate: 1, from: fromCurrency, to: toCurrency, amount: parsedAmount });// Return the original amount with a rate of 1
    }

    const apiKey = process.env.CURRENCY_FREAKS_API_KEY;// Read the CurrencyFreaks API key from environment variables
    if (!apiKey) {// Conditional rendering to check if the API key is configured
        console.error('[ERROR: apiRoutes.js, /convert] CURRENCY_FREAKS_API_KEY not set');//Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Currency API not configured' });// Return a 500 (Internal Server Error) status code with a message
    }

    try {
        // CurrencyFreaks free tier always prices against USD as the base,
        // so USD itself is never listed in the "rates" object.
        const symbols = [fromCurrency, toCurrency].filter((code) => code !== 'USD').join(',');
        const url = `https://api.currencyfreaks.com/v2.0/rates/latest?apikey=${apiKey}&symbols=${encodeURIComponent(symbols)}`;

        const apiResponse = await fetch(url);
        if (!apiResponse.ok) {// Conditional rendering to check the upstream API responded successfully
            console.error('[ERROR: apiRoutes.js, /convert] CurrencyFreaks request failed with status', apiResponse.status);
            return res.status(502).json({ success: false, message: 'Failed to retrieve exchange rates' });
        }

        const data = await apiResponse.json();
        const rates = data.rates || {};

        // USD has an implicit rate of 1 since it is the API's base currency
        const rateFrom = fromCurrency === 'USD' ? 1 : parseFloat(rates[fromCurrency]);
        const rateTo = toCurrency === 'USD' ? 1 : parseFloat(rates[toCurrency]);

        if (!rateFrom || !rateTo || isNaN(rateFrom) || isNaN(rateTo)) {// Conditional rendering to guard against a missing/malformed rate
            console.error('[ERROR: apiRoutes.js, /convert] Missing exchange rate for', fromCurrency, toCurrency);
            return res.status(502).json({ success: false, message: 'Exchange rate unavailable for the requested currencies' });
        }

        const conversionRate = rateTo / rateFrom;// Cross rate via the shared USD base
        const convertedAmount = parsedAmount * conversionRate;

        // Best-effort history log tied to the requesting user; must never block the response
        User.findById(req.user.userId).select('fullName').then((user) => {
            if (!user) return;
            return CurrencyConvert.create({
                fullName: user.fullName,
                currency: { baseCurrency: fromCurrency, targetCurrency: toCurrency },
                amount: parsedAmount,
                rate: conversionRate,
            });
        }).catch((error) => {
            console.error('[ERROR: apiRoutes.js, /convert] Failed to save conversion history:', error.message);
        });

        console.log('[SUCCESS: apiRoutes.js, /convert] Converted', parsedAmount, fromCurrency, 'to', toCurrency);
        return res.status(200).json({
            success: true,
            result: convertedAmount,
            rate: conversionRate,
            from: fromCurrency,
            to: toCurrency,
            amount: parsedAmount
        });
    } catch (error) {
        console.error('[ERROR: apiRoutes.js, /convert]', error.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
})
module.exports= router