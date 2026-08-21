require('dotenv').config()
const express = require('express');
const { checkJwtToken } = require('./middleware');
const { currencies } = require('../dataArrays/currencies');
const User = require('../models/userSchema');
const CurrencyConvert = require('../models/curConvertSchema');
const Interest = require('../models/interestSchema');
const { calculateInterest, COMPOUND_FREQUENCIES, MAX_DURATION } = require('../utils/interestCalculator');
const router = express.Router()

// Values the interest calculator accepts for the time period unit
const PERIOD_UNITS = ['years', 'months'];
// Values the interest calculator accepts for the interest type
const INTEREST_TYPES = ['simple', 'compound'];

/*=====================================
INTEREST INPUT PARSING AND VALIDATION
=======================================*/
/* Reads the interest calculator's fields off a request body and coerces them
to numbers. Shared by /interest/calculate and /interest/save so both routes
parse a request in exactly the same way. */
const parseInterestInput = (body = {}) => ({
    type: body.type,
    principal: parseFloat(body.principal),
    rate: parseFloat(body.rate),
    duration: Number(body.duration),
    periodUnit: body.periodUnit,
    compoundingFrequency: body.compoundingFrequency,
    // The recurring monthly contribution is optional, so default it to 0
    monthlyContribution: body.monthlyContribution === undefined || body.monthlyContribution === null || body.monthlyContribution === ''
        ? 0
        : parseFloat(body.monthlyContribution),
});

/* Validates a parsed interest request. Returns a message describing the first
problem found, or null when the input is usable. */
const validateInterestInput = ({ type, principal, rate, duration, periodUnit, compoundingFrequency, monthlyContribution }) => {
    // Conditional rendering to check the interest type is one that is supported
    if (!INTEREST_TYPES.includes(type)) {
        return `type must be one of: ${INTEREST_TYPES.join(', ')}`;
    }
    // Conditional rendering to check the time period unit is one that is supported
    if (!PERIOD_UNITS.includes(periodUnit)) {
        return `periodUnit must be one of: ${PERIOD_UNITS.join(', ')}`;
    }
    // Conditional rendering to validate that the principal is a positive number
    if (isNaN(principal) || principal <= 0) {
        return 'principal must be a number greater than 0';
    }
    // Conditional rendering to validate that the rate is a percentage between 0 and 100
    if (isNaN(rate) || rate <= 0 || rate > 100) {
        return 'rate must be a number greater than 0 and no more than 100';
    }
    /* Conditional rendering to validate the duration: whole periods only, and
    capped per unit so a single request cannot ask for a huge breakdown. */
    if (!Number.isInteger(duration) || duration <= 0 || duration > MAX_DURATION[periodUnit]) {
        return `duration must be a whole number of ${periodUnit} between 1 and ${MAX_DURATION[periodUnit]}`;
    }
    /* Conditional rendering to validate the compounding frequency. Only
    required for compound interest; simple interest ignores it. */
    if (type === 'compound' && !Object.keys(COMPOUND_FREQUENCIES).includes(compoundingFrequency)) {
        return `compoundingFrequency must be one of: ${Object.keys(COMPOUND_FREQUENCIES).join(', ')}`;
    }
    // Conditional rendering to validate that the contribution is not negative
    if (isNaN(monthlyContribution) || monthlyContribution < 0) {
        return 'monthlyContribution must be a number of 0 or more';
    }
    return null;
};

/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/
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

/*──────────────────────────── POST ROUTES ──────────────────────────────
    POST: Used to create a new resource/submit data to the database
 ─────────────────────────────────────────────────────────────────────────*/
/*=====================================
INTEREST CALCULATION
=======================================*/
/* Works out simple or compound interest over a period the user supplies in
either YEARS (annual) or MONTHS (monthly). The rate is always an annual
nominal rate; the calculator converts it to the requested period so both
options can be compared against the same quoted rate.*/


/*The client also has a local fallback calculation for previewing, but this
route is the source of truth for anything that gets saved. */
router.post('/interest/calculate', checkJwtToken, (req, res) => {
    const input = parseInterestInput(req.body);

    const validationMessage = validateInterestInput(input);
    // Conditional rendering to check the submitted figures are usable
    if (validationMessage) {
        return res.status(400).json({ success: false, message: validationMessage });// Send a 400 (Bad Request) status code with a message
    }

    try {
        const result = calculateInterest(input);

        console.log('[SUCCESS: apiRoutes.js, /interest/calculate] Calculated', input.type, 'interest over', input.duration, input.periodUnit);
        return res.status(200).json({ success: true, result });
    } catch (error) {
        console.error('[ERROR: apiRoutes.js, /interest/calculate]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})


// ROUTE TO SAVE AN INTEREST CALCULATION
/* Saves an interest calculation to the logged in user's history. The user is
taken from the JWT, never from the request body, so a user can only ever write
a record against themselves.

The result is RECALCULATED from the submitted inputs rather than read from the
request, so a saved record is always internally consistent and a tampered
request cannot write false totals to the database. */

router.post('/interest/save', checkJwtToken, async (req, res) => {
    const input = parseInterestInput(req.body);

    const validationMessage = validateInterestInput(input);
    // Conditional rendering to check the submitted figures are usable
    if (validationMessage) {
        return res.status(400).json({ success: false, message: validationMessage });// Send a 400 (Bad Request) status code with a message
    }

    try {
        // The fullName is read from the database rather than trusted from the body
        const user = await User.findById(req.user.userId).select('fullName').exec();
        // Conditional rendering to check the user on the token still exists
        if (!user) {
            console.warn('[WARN: apiRoutes.js, /interest/save] No user found for id', req.user.userId);
            return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
        }

        const result = calculateInterest(input);

        const saved = await Interest.create({
            user: user._id,
            fullName: user.fullName,
            principal: result.principal,
            interestRate: result.rate,
            // The schema stores the duration and its unit separately
            time: { duration: input.duration, unit: result.periodUnit },
            interestType: result.type,
            /* The schema stores the compounding frequency as a NUMBER of times
            per year, so the frequency name is mapped to its count here. Simple
            interest does not compound, so it falls back to 1. */
            compoundFrequency: COMPOUND_FREQUENCIES[input.compoundingFrequency] || 1,
            monthlyContribution: result.monthlyContribution,
            totalContributions: result.totalContributions,
            totalInterest: result.totalInterest,
            finalAmount: result.finalAmount,
        });

        console.log('[SUCCESS: apiRoutes.js, /interest/save] Saved interest calculation', saved._id, 'for user', user._id);
        return res.status(201).json({ success: true, message: 'Calculation saved to your history', saved, result });
    } catch (error) {
        // A schema validation failure is the user's input, not a server fault
        if (error.name === 'ValidationError') {
            console.error('[ERROR: apiRoutes.js, /interest/save] Validation failed:', error.message);
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('[ERROR: apiRoutes.js, /interest/save]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})
module.exports= router