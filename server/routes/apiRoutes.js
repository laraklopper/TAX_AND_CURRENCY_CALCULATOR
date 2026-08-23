// apiRoutes.js
/* Currency endpoints, mounted at /api by app.js.

  GET /currencies                  - every currency the converter can offer
  GET /convert?from=&to=&amount=   - convert an amount between two currencies

Both are backed by Frankfurter through utils/currencyService.js, which is the
only module that talks to the provider. The currency list is no longer a
hardcoded array: /currencies serves what Frankfurter reports it supports, and
/convert validates `from` and `to` against that same list, so the codes the
browser can pick and the codes the server accepts can never drift apart. */

/* Load environment variables from a .env
file using the dotenv package*/
require('dotenv').config()
const express = require('express');
const { checkJwtToken } = require('./middleware');
const User = require('../models/userSchema');
const CurrencyConvert = require('../models/curConvertSchema');
// Import utility functions
const { getSupportedCurrencies, getConversionRate } = require('../utils/currencyService');
const router = express.Router()

/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/

/* Serves the currencies the converter can work with, as { code, name, symbol }.
The browser builds its dropdowns and its currency table from this rather than
from a duplicated array of its own. `live` is false when the list came from the
offline fallback, so the client can tell a real list from a stand-in. */
router.get('/currencies', checkJwtToken, async (req, res) => {
    try {
        const { currencies, live } = await getSupportedCurrencies();

        console.log('[SUCCESS: apiRoutes.js, /currencies] Served', currencies.length, 'currencies');
        return res.status(200).json({
            success: true,
            live,
            total: currencies.length,
            currencies
        });
    } catch (error) {
        console.error('[ERROR: apiRoutes.js, /currencies]', error.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
})

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

      const parsedAmount = parseFloat(amount);// Convert the amount string to a floating-point number
    if (isNaN(parsedAmount) || parsedAmount <= 0) {// Conditional rendering to validate that the amount is a positive number
        return res.status(400).json({// Send a 400 (Bad Request) status code with a message
             success: false,
             message: 'amount must be a positive number' // JSON message
        });
    }

    try {
        /* Validate both codes against the list Frankfurter reports it supports
        rather than a fixed array. GET /currencies serves the same list, so the
        message points there instead of naming 165 codes. */
        const { codes } = await getSupportedCurrencies();
        if (!codes.has(fromCurrency) || !codes.has(toCurrency)) {
            return res.status(400).json({
                success: false,
                message: 'from and to must be supported currency codes — see GET /api/currencies'
            });
        }

        // Conditional rendering
        if (fromCurrency === toCurrency) {// Short-circuit: no conversion needed when source and target currencies are the same
            return res.status(200).json({
                success: true,
                result: parsedAmount,
                rate: 1, from: fromCurrency, to: toCurrency, amount: parsedAmount });// Return the original amount with a rate of 1
        }

        /* One request per conversion, so the rate stored in the user's history
        is the rate that was actually quoted to them. */
        const quote = await getConversionRate(fromCurrency, toCurrency);

        if (!quote) {// Conditional rendering to check a usable rate came back
            console.error('[ERROR: apiRoutes.js, /convert] Missing exchange rate for', fromCurrency, toCurrency);
            return res.status(502).json({ success: false, message: 'Exchange rate unavailable for the requested currencies' });
        }

        const convertedAmount = parsedAmount * quote.rate;

        // Best-effort history log tied to the requesting user; must never block the response
        User.findById(req.user.userId).select('fullName').then((user) => {
            if (!user) return;
            return CurrencyConvert.create({
                fullName: user.fullName,
                currency: { baseCurrency: fromCurrency, targetCurrency: toCurrency },
                amount: parsedAmount,
                rate: quote.rate,
            });
        }).catch((error) => {
            console.error('[ERROR: apiRoutes.js, /convert] Failed to save conversion history:', error.message);
        });

        console.log('[SUCCESS: apiRoutes.js, /convert] Converted', parsedAmount, fromCurrency, 'to', toCurrency);
        return res.status(200).json({
            success: true,
            result: convertedAmount,
            rate: quote.rate,
            date: quote.date,// The day Frankfurter published the rate used
            from: fromCurrency,
            to: toCurrency,
            amount: parsedAmount
        });
    } catch (error) {
        console.error('[ERROR: apiRoutes.js, /convert]', error.message);
        return res.status(502).json({ success: false, message: 'Failed to retrieve exchange rates' });
    }
})

//Export the router
module.exports= router
