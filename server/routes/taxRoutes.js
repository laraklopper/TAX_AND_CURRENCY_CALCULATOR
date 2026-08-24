// taxRoutes.js
/* Income tax endpoints, mounted at /api/tax by app.js.

  GET    /config      - tax years the calculator can work with
  POST   /calculate   - work out the tax payable (returns a result, saves nothing)
  POST   /save        - save a calculation to the logged in user's history
  GET    /history     - the logged in user's saved calculations
  DELETE /history/:id - remove one of the logged in user's saved calculations

/save deliberately RECALCULATES from the user's inputs instead of storing the
figures the browser sends. A saved record is therefore always internally
consistent, and a tampered request cannot write false totals to the database.

The history routes scope every query by the user id on the JWT, never by an id
taken from the request, so a user can only ever read or delete their own
records. */

/* Load environment variables from a .env
file using the dotenv package*/
require('dotenv').config()
// Import Required modules and packages
const express = require('express');
const mongoose = require('mongoose');
// IMPORT CUSTOM MIDDLEWARE
const { checkJwtToken } = require('./middleware');
// Import schemas
const User = require('../models/userSchema');
const TaxCalc = require('../models/taxCalcSchema');
// Import Utility functions
const { calculateTax, getTaxYearConfig, listTaxYears } = require('../utils/taxCalculator');

const router = express.Router()// Create a new router object using Express

// Bounds accepted for a taxpayer's age, matching taxCalcSchema
const MIN_AGE = 16;
const MAX_AGE = 120;
// Upper bound on income, guarding against nonsense values overflowing the maths
const MAX_INCOME = 1_000_000_000;
/* Most saved calculations a single /history response will return. A user's
history grows without limit, so the newest records are returned and the total
is reported alongside them rather than the response growing unbounded. */
const HISTORY_LIMIT = 100;

/*=====================================
SHARED INPUT VALIDATION
=======================================*/
/* Validates the body shared by /calculate and /save. Returns a message
describing the first problem found, or null when the input is usable. */
const validateTaxInput = ({ annualIncome, age, dependants }) => {
    // Conditional rendering to validate that the income is a positive number
    if (isNaN(annualIncome) || annualIncome <= 0 || annualIncome > MAX_INCOME) {
        return `annualIncome must be a number greater than 0 and no more than ${MAX_INCOME}`;
    }
    // Conditional rendering to validate the age is a whole number in range
    if (!Number.isInteger(age) || age < MIN_AGE || age > MAX_AGE) {
        return `age must be a whole number between ${MIN_AGE} and ${MAX_AGE}`;
    }
    // Conditional rendering to validate the dependant count
    if (!Number.isInteger(dependants) || dependants < 0) {
        return 'dependants must be a whole number of 0 or more';
    }
    return null;
}

/* Reads the shared fields off a request body and coerces them to numbers, so
both routes parse the request in exactly the same way. */
const parseTaxInput = (body = {}) => ({
    annualIncome: parseFloat(body.annualIncome),
    age: Number(body.age),
    dependants: body.dependants === undefined || body.dependants === null || body.dependants === ''
        ? 0
        : Number(body.dependants),
    taxYear: typeof body.taxYear === 'string' ? body.taxYear.trim() : body.taxYear,
});

/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
TAX YEAR CONFIG
=======================================*/
/* Returns the tax years the client can offer in its dropdown, along with the
brackets, rebates and thresholds for the active year. */
router.get('/config', checkJwtToken, async (req, res) => {
    try {
        const taxYears = await listTaxYears();// Newest year first
        const activeConfig = await getTaxYearConfig(req.query.taxYear);

        console.log('[SUCCESS: taxRoutes.js, /config] Returned', taxYears.length, 'tax year(s)');
        return res.status(200).json({ success: true, taxYears, config: activeConfig });
    } catch (error) {
        console.error('[ERROR: taxRoutes.js, /config]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

/*=====================================
SAVED CALCULATION HISTORY
=======================================*/
/* Returns the logged in user's saved tax calculations, newest first. The user
is taken from the JWT rather than a query param, so this can only ever return
the requester's own records.

`total` is reported separately from the returned array: only the newest
HISTORY_LIMIT records are sent, so the client can tell when it is looking at a
truncated view rather than the user's whole history. */
router.get('/history', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user.userId;// The token payload signed in authRoutes.js uses `userId`

        /* Counted and fetched together: the count is what tells the client the
        list was truncated, so it has to reflect the same filter. */
        const [total, calculations] = await Promise.all([
            TaxCalc.countDocuments({ user: userId }).exec(),
            TaxCalc.find({ user: userId })
                .sort({ createdAt: -1 })// Newest calculation first
                .limit(HISTORY_LIMIT)
                .exec(),
        ]);

        console.log('[SUCCESS: taxRoutes.js, GET /history] Returned', calculations.length, 'of', total, 'calculation(s) for user', userId);
        return res.status(200).json({
            success: true,
            total,
            limit: HISTORY_LIMIT,
            calculations,
        });
    } catch (error) {
        console.error('[ERROR: taxRoutes.js, GET /history]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})
/*──────────────────────────── POST ROUTES ──────────────────────────────
    POST: Used to create a new resource/submit data to the database
 ─────────────────────────────────────────────────────────────────────────*/
/*=====================================
TAX CALCULATION
=======================================*/
/* Works out the tax payable on an annual income using the selected tax year's
brackets and age-based rebates. Nothing is written to the database. */
router.post('/calculate', checkJwtToken, async (req, res) => {
    const input = parseTaxInput(req.body);

    const validationMessage = validateTaxInput(input);
    // Conditional rendering to check the submitted figures are usable
    if (validationMessage) {
        return res.status(400).json({ success: false, message: validationMessage });// Send a 400 (Bad Request) status code with a message
    }

    try {
        const config = await getTaxYearConfig(input.taxYear);
        // Conditional rendering to check the requested tax year exists
        if (!config) {
            return res.status(400).json({
                success: false,
                message: `No tax data is available for the tax year ${input.taxYear}`
            });
        }

        const result = calculateTax({ ...input, config });

        console.log('[SUCCESS: taxRoutes.js, /calculate] Calculated tax for', config.taxYear);
        return res.status(200).json({ success: true, result });
    } catch (error) {
        console.error('[ERROR: taxRoutes.js, /calculate]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

/*=====================================
SAVE A CALCULATION
=======================================*/
/* Saves a tax calculation to the logged in user's history. The user is taken
from the JWT, never from the request body, so a user can only ever write a
record against themselves. */
router.post('/save', checkJwtToken, async (req, res) => {
    const input = parseTaxInput(req.body);
    const deductions = req.body?.deductions === undefined || req.body?.deductions === null || req.body?.deductions === ''
        ? 0
        : parseFloat(req.body.deductions);

    const validationMessage = validateTaxInput(input);
    // Conditional rendering to check the submitted figures are usable
    if (validationMessage) {
        return res.status(400).json({ success: false, message: validationMessage });// Send a 400 (Bad Request) status code with a message
    }
    // Conditional rendering to validate the optional deductions figure
    if (isNaN(deductions) || deductions < 0 || deductions > input.annualIncome) {
        return res.status(400).json({
            success: false,
            message: 'deductions must be a number between 0 and the annual income'
        });
    }

    try {
        // The fullName is read from the database rather than trusted from the body
        const user = await User.findById(req.user.userId).select('fullName').exec();
        // Conditional rendering to check the user on the token still exists
        if (!user) {
            console.warn('[WARN: taxRoutes.js, /save] No user found for id', req.user.userId);
            return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
        }

        const config = await getTaxYearConfig(input.taxYear);
        // Conditional rendering to check the requested tax year exists
        if (!config) {
            return res.status(400).json({
                success: false,
                message: `No tax data is available for the tax year ${input.taxYear}`
            });
        }

        /* Recalculated here rather than read from the request: the backend is
        the source of truth for anything that gets persisted. */
        const result = calculateTax({ ...input, config });

        const saved = await TaxCalc.create({
            user: user._id,
            fullName: user.fullName,
            income: { grossIncome: result.annualIncome, taxYear: result.taxYear },
            deductions,
            age: result.age,
            ageGroup: result.ageGroup,
            dependants: result.dependants,
            grossTax: result.grossTax,
            rebate: result.rebate,
            netTax: result.netTax,
            effectiveRate: result.effectiveRate,
            marginalRate: result.marginalRate,
        });

        console.log('[SUCCESS: taxRoutes.js, /save] Saved tax calculation', saved._id, 'for user', user._id);
        return res.status(201).json({ success: true, message: 'Calculation saved to your history', saved, result });
    } catch (error) {
        // A schema validation failure is the user's input, not a server fault
        if (error.name === 'ValidationError') {
            console.error('[ERROR: taxRoutes.js, /save] Validation failed:', error.message);
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('[ERROR: taxRoutes.js, /save]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

/*──────────────────────────── DELETE ROUTES ──────────────────────────────────
   DELETE: Used to remove an item from the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
DELETE A SAVED CALCULATION
=======================================*/
/* Removes one of the logged in user's saved tax calculations.

The id and the user are matched in a SINGLE query rather than fetching the
record and then checking who owns it. A calculation belonging to another user
therefore behaves exactly like one that does not exist, so an id cannot be
guessed at to find out whether it is someone else's. */
router.delete('/history/:id', checkJwtToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;// The token payload signed in authRoutes.js uses `userId`

        /* Conditional rendering to check the id is a valid ObjectId: querying
        on a malformed id raises a CastError, which would return a 500 */
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.error('[ERROR: taxRoutes.js, DELETE /history/:id] Invalid calculation id:', id);
            return res.status(400).json({ success: false, message: 'Invalid calculation id' });// Send a 400 (Bad Request) status code with a message
        }

        const removed = await TaxCalc.findOneAndDelete({ _id: id, user: userId }).exec();

        /* Conditional rendering to check a record was actually removed. Covers
        both a calculation that does not exist and one owned by another user. */
        if (!removed) {
            console.warn('[WARN: taxRoutes.js, DELETE /history/:id] No calculation', id, 'for user', userId);
            return res.status(404).json({ success: false, message: 'Calculation not found' });// Send a 404 (Not Found) status code with a message
        }

        console.log('[SUCCESS: taxRoutes.js, DELETE /history/:id] Deleted calculation', id, 'for user', userId);
        return res.status(200).json({
            success: true,
            message: 'Calculation removed from your history',
            calculationId: id,// Returned so the client can drop the calculation from the list on screen
        });
    } catch (error) {
        console.error('[ERROR: taxRoutes.js, DELETE /history/:id]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

module.exports = router
