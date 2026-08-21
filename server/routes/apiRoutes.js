require('dotenv').config()
const express = require('express');
const { checkJwtToken } = require('./middleware');
const { currencies } = require('../dataArrays/currencies');
const User = require('../models/userSchema');
const CurrencyConvert = require('../models/curConvertSchema');
const { calculateInterest, COMPOUND_FREQUENCIES, MAX_DURATION } = require('../utils/interestCalculator');
const router = express.Router()

// Values the interest calculator accepts for the time period unit
const PERIOD_UNITS = ['years', 'months'];
// Values the interest calculator accepts for the interest type
const INTEREST_TYPES = ['simple', 'compound'];

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

/*=====================================
INTEREST CALCULATION
=======================================*/
/* Works out simple or compound interest over a period the user supplies in
either YEARS (annual) or MONTHS (monthly). The rate is always an annual
nominal rate; the calculator converts it to the requested period so both
options can be compared against the same quoted rate.

The client also has a local fallback calculation for previewing, but this
route is the source of truth for anything that gets saved. */
router.post('/interest/calculate', checkJwtToken, (req, res) => {
    const {
        type,
        principal,
        rate,
        duration,
        periodUnit,
        compoundingFrequency,
        monthlyContribution
    } = req.body || {};

    // Conditional rendering to check the interest type is one that is supported
    if (!INTEREST_TYPES.includes(type)) {
        return res.status(400).json({// Send a 400 (Bad Request) status code with a message
            success: false,
            message: `type must be one of: ${INTEREST_TYPES.join(', ')}`//JSON message
        });
    }

    // Conditional rendering to check the time period unit is one that is supported
    if (!PERIOD_UNITS.includes(periodUnit)) {
        return res.status(400).json({// Send a 400 (Bad Request) status code with a message
            success: false,
            message: `periodUnit must be one of: ${PERIOD_UNITS.join(', ')}`//JSON message
        });
    }

    const parsedPrincipal = parseFloat(principal);// Convert the principal to a number
    // Conditional rendering to validate that the principal is a positive number
    if (isNaN(parsedPrincipal) || parsedPrincipal <= 0) {
        return res.status(400).json({
            success: false,
            message: 'principal must be a number greater than 0'
        });
    }

    const parsedRate = parseFloat(rate);// Convert the annual interest rate to a number
    // Conditional rendering to validate that the rate is a percentage between 0 and 100
    if (isNaN(parsedRate) || parsedRate <= 0 || parsedRate > 100) {
        return res.status(400).json({
            success: false,
            message: 'rate must be a number greater than 0 and no more than 100'
        });
    }

    const parsedDuration = Number(duration);// Convert the time period to a number
    /* Conditional rendering to validate the duration: whole periods only, and
    capped per unit so a single request cannot ask for a huge breakdown. */
    if (!Number.isInteger(parsedDuration) || parsedDuration <= 0 || parsedDuration > MAX_DURATION[periodUnit]) {
        return res.status(400).json({
            success: false,
            message: `duration must be a whole number of ${periodUnit} between 1 and ${MAX_DURATION[periodUnit]}`
        });
    }

    /* Conditional rendering to validate the compounding frequency. Only
    required for compound interest; simple interest ignores it. */
    if (type === 'compound' && !Object.keys(COMPOUND_FREQUENCIES).includes(compoundingFrequency)) {
        return res.status(400).json({
            success: false,
            message: `compoundingFrequency must be one of: ${Object.keys(COMPOUND_FREQUENCIES).join(', ')}`
        });
    }

    // The recurring monthly contribution is optional, so default it to 0
    const parsedContribution = monthlyContribution === undefined || monthlyContribution === null || monthlyContribution === ''
        ? 0
        : parseFloat(monthlyContribution);
    // Conditional rendering to validate that the contribution is not negative
    if (isNaN(parsedContribution) || parsedContribution < 0) {
        return res.status(400).json({
            success: false,
            message: 'monthlyContribution must be a number of 0 or more'
        });
    }

    try {
        const result = calculateInterest({
            type,
            principal: parsedPrincipal,
            rate: parsedRate,
            duration: parsedDuration,
            periodUnit,
            compoundingFrequency,
            monthlyContribution: parsedContribution,
        });

        console.log('[SUCCESS: apiRoutes.js, /interest/calculate] Calculated', type, 'interest over', parsedDuration, periodUnit);
        return res.status(200).json({ success: true, result });
    } catch (error) {
        console.error('[ERROR: apiRoutes.js, /interest/calculate]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})
module.exports= router