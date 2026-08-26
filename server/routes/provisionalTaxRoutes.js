// provisionalTaxRoutes.js
/* Provisional tax (IRP6) endpoints, mounted at /provisional by app.js.

  POST   /calculate   - work out what is payable on one IRP6 (saves nothing)
  POST   /save        - save a calculation to the logged in user's history
  GET    /history     - the logged in user's saved calculations
  DELETE /history/:id - remove one of the logged in user's saved calculations

The tax years themselves are not served from here: provisional tax is the same
normal tax the income tax calculator works out, so the brackets, rebates and
thresholds come from the SAME configuration and the client keeps reading its
dropdown from GET /tax/config. A second endpoint serving the same list is a
second place for it to go stale.

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
const ProvTaxCalc = require('../models/provTaxCalcSchema');
// Import Utility functions
const { getTaxYearConfig } = require('../utils/taxCalculator');
const { calculateProvisionalTax, PROVISIONAL_PERIODS } = require('../utils/provisionalTaxCalculator');

const router = express.Router()// Create a new router object using Express

// Bounds accepted for a taxpayer's age, matching provTaxCalcSchema
const MIN_AGE = 16;
const MAX_AGE = 120;
/* Upper bound on any rand figure in the request, guarding against nonsense
values overflowing the maths. The same cap the income tax route applies. */
const MAX_AMOUNT = 1_000_000_000;
/* Most saved calculations a single /history response will return. A user's
history grows without limit, so the newest records are returned and the total
is reported alongside them rather than the response growing unbounded. */
const HISTORY_LIMIT = 100;

/* The optional rand figures on an IRP6: what has already been withheld,
credited or paid towards the year, and the medical scheme fees credits the
taxpayer supplies. All default to 0, because a blank field on the form means
"none of this applies", not "unknown". */
const OPTIONAL_AMOUNTS = ['employeesTax', 'foreignTaxCredits', 'priorPayments', 'medicalCredits'];

// The labels each optional amount is reported under when it is rejected
const AMOUNT_LABELS = {
    employeesTax: "employeesTax (employees' tax already withheld)",
    foreignTaxCredits: 'foreignTaxCredits',
    priorPayments: 'priorPayments (provisional tax already paid)',
    medicalCredits: 'medicalCredits (medical scheme fees tax credits)',
};

/*=====================================
SHARED INPUT VALIDATION
=======================================*/
/* Reads an optional rand figure off the request body. A field the form left
blank arrives as undefined, null or an empty string and means nothing of that
kind applies, so it becomes 0 rather than NaN. */
const toOptionalAmount = (value) =>
    value === undefined || value === null || value === '' ? 0 : Number(value);

/* Reads the request body and coerces it to numbers, so /calculate and /save
parse a request in exactly the same way and cannot disagree about what was
asked for. */
const parseProvisionalInput = (body = {}) => {
    const input = {
        period: typeof body.period === 'string' ? body.period.trim().toLowerCase() : body.period,
        taxYear: typeof body.taxYear === 'string' ? body.taxYear.trim() : body.taxYear,
        estimatedTaxableIncome: parseFloat(body.estimatedTaxableIncome),
        age: Number(body.age),
        /* The basic amount stays NULL when it was not supplied: a taxpayer
        filing their first IRP6 has no assessment to take one from, and a
        missing basic amount is not the same as a basic amount of nil. */
        basicAmount: body.basicAmount === undefined || body.basicAmount === null || body.basicAmount === ''
            ? null
            : parseFloat(body.basicAmount),
    };

    for (const field of OPTIONAL_AMOUNTS) {
        input[field] = toOptionalAmount(body[field]);
    }

    return input;
};

/* Validates the body shared by /calculate and /save. Returns a message
describing the first problem found, or null when the input is usable.

This repeats the checks ProvisionalTaxCalculatorForm.js already runs in the
browser, because the browser's copy can be bypassed - this is the one that
decides what reaches the maths and the database. */
const validateProvisionalInput = (input) => {
    // Conditional rendering to validate which of the three payments was asked for
    if (!PROVISIONAL_PERIODS.includes(input.period)) {
        return `period must be one of: ${PROVISIONAL_PERIODS.join(', ')}`;
    }
    /* Conditional rendering to validate the estimate. The brackets start at R1,
    so an estimate of nil has no tax to work out and no IRP6 to file. */
    if (isNaN(input.estimatedTaxableIncome) || input.estimatedTaxableIncome <= 0 || input.estimatedTaxableIncome > MAX_AMOUNT) {
        return `estimatedTaxableIncome must be a number greater than 0 and no more than ${MAX_AMOUNT}`;
    }
    // Conditional rendering to validate the age is a whole number in range
    if (!Number.isInteger(input.age) || input.age < MIN_AGE || input.age > MAX_AGE) {
        return `age must be a whole number between ${MIN_AGE} and ${MAX_AGE}`;
    }

    // Conditional rendering to validate each of the optional rand figures
    for (const field of OPTIONAL_AMOUNTS) {
        const value = input[field];
        if (!Number.isFinite(value) || value < 0 || value > MAX_AMOUNT) {
            return `${AMOUNT_LABELS[field]} must be a number between 0 and ${MAX_AMOUNT}`;
        }
    }

    /* Conditional rendering to check the basic amount, when one was supplied.
    An estimate BELOW the basic amount is allowed through: paragraph 19(3)
    leaves that to SARS to revise, so the calculator warns about it in the
    result rather than refusing to work the figures out. */
    if (input.basicAmount !== null) {
        if (isNaN(input.basicAmount) || input.basicAmount < 0 || input.basicAmount > MAX_AMOUNT) {
            return `basicAmount must be a number between 0 and ${MAX_AMOUNT}, or left out`;
        }
    }

    /* Conditional rendering to check nothing has already been paid on a FIRST
    payment. The first IRP6 of a year of assessment is by definition the first
    payment towards it, so a prior payment here would be double-counted. */
    if (input.period === 'first' && input.priorPayments > 0) {
        return 'priorPayments must be 0 on a first provisional payment: nothing has been paid towards the year yet';
    }

    return null;
};

/*──────────────────────────── POST ROUTES ──────────────────────────────
    POST: Used to create a new resource/submit data to the database
 ─────────────────────────────────────────────────────────────────────────*/
/*=====================================
PROVISIONAL TAX CALCULATION
=======================================*/
/* Works out what is payable on one IRP6 from the taxpayer's estimate of their
taxable income for the whole year of assessment. Nothing is written to the
database. */
router.post('/calculate', checkJwtToken, async (req, res) => {
    const input = parseProvisionalInput(req.body);

    const validationMessage = validateProvisionalInput(input);
    // Conditional rendering to check the submitted figures are usable
    if (validationMessage) {
        console.warn('[WARN: provisionalTaxRoutes.js, /calculate] Rejected:', validationMessage);// Log a warning message in the console for debugging purposes
        return res.status(400).json({ success: false, message: validationMessage });// Send a 400 (Bad Request) status code with a message
    }

    try {
        /* The same configuration the income tax calculator resolves, so the two
        calculators can never disagree about the tax on an income. */
        const config = await getTaxYearConfig(input.taxYear);
        // Conditional rendering to check the requested tax year exists
        if (!config) {
            return res.status(400).json({
                success: false,
                message: `No tax data is available for the tax year ${input.taxYear}`
            });// Send a 400 (Bad Request) status code with a message
        }

        const result = calculateProvisionalTax({ ...input, config });

        console.log('[SUCCESS: provisionalTaxRoutes.js, /calculate] Calculated the', input.period, 'payment for', config.taxYear);
        return res.status(200).json({ success: true, result });
    } catch (error) {
        console.error('[ERROR: provisionalTaxRoutes.js, /calculate]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

/*=====================================
SAVE A CALCULATION
=======================================*/
/* Saves a provisional tax calculation to the logged in user's history. The user
is taken from the JWT, never from the request body, so a user can only ever
write a record against themselves. */
router.post('/save', checkJwtToken, async (req, res) => {
    const input = parseProvisionalInput(req.body);

    const validationMessage = validateProvisionalInput(input);
    // Conditional rendering to check the submitted figures are usable
    if (validationMessage) {
        console.warn('[WARN: provisionalTaxRoutes.js, /save] Rejected:', validationMessage);// Log a warning message in the console for debugging purposes
        return res.status(400).json({ success: false, message: validationMessage });// Send a 400 (Bad Request) status code with a message
    }

    try {
        // The fullName is read from the database rather than trusted from the body
        const user = await User.findById(req.user.userId).select('fullName').exec();
        // Conditional rendering to check the user on the token still exists
        if (!user) {
            console.warn('[WARN: provisionalTaxRoutes.js, /save] No user found for id', req.user.userId);// Log a warning message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });// Send a 401 (Unauthorized) status code with a message
        }

        const config = await getTaxYearConfig(input.taxYear);
        // Conditional rendering to check the requested tax year exists
        if (!config) {
            return res.status(400).json({
                success: false,
                message: `No tax data is available for the tax year ${input.taxYear}`
            });// Send a 400 (Bad Request) status code with a message
        }

        /* Recalculated here rather than read from the request: the backend is
        the source of truth for anything that gets persisted. */
        const result = calculateProvisionalTax({ ...input, config });

        const saved = await ProvTaxCalc.create({
            user: user._id,
            fullName: user.fullName,
            taxYear: result.taxYear,
            period: result.period,
            periodPortion: result.periodPortion,
            dueDate: result.dueDate,// Null where the tax year carries no usable dates
            estimatedTaxableIncome: result.estimatedTaxableIncome,
            age: result.age,
            ageGroup: result.ageGroup,
            basicAmount: result.basicAmount,
            taxOnEstimate: result.taxOnEstimate,
            rebate: result.rebate,
            medicalCredits: result.medicalCredits,
            annualTaxLiability: result.annualTaxLiability,
            taxForPeriod: result.taxForPeriod,
            employeesTax: result.employeesTax,
            foreignTaxCredits: result.foreignTaxCredits,
            priorPayments: result.priorPayments,
            amountPayable: result.amountPayable,
            effectiveRate: result.effectiveRate,
            marginalRate: result.marginalRate,
        });

        console.log('[SUCCESS: provisionalTaxRoutes.js, /save] Saved provisional tax calculation', saved._id, 'for user', user._id);
        return res.status(201).json({ success: true, message: 'Calculation saved to your history', saved, result });
    } catch (error) {
        // A schema validation failure is the user's input, not a server fault
        if (error.name === 'ValidationError') {
            console.error('[ERROR: provisionalTaxRoutes.js, /save] Validation failed:', error.message);// Log an error message in the console for debugging purposes
            return res.status(400).json({ success: false, message: error.message });// Send a 400 (Bad Request) status code with a message
        }
        console.error('[ERROR: provisionalTaxRoutes.js, /save]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
SAVED CALCULATION HISTORY
=======================================*/
/* Returns the logged in user's saved provisional tax calculations, newest
first. The user is taken from the JWT rather than a query param, so this can
only ever return the requester's own records.

`total` is reported separately from the returned array: only the newest
HISTORY_LIMIT records are sent, so the client can tell when it is looking at a
truncated view rather than the user's whole history. */
router.get('/history', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user.userId;// The token payload signed in authRoutes.js uses `userId`

        /* Counted and fetched together: the count is what tells the client the
        list was truncated, so it has to reflect the same filter. */
        const [total, calculations] = await Promise.all([
            ProvTaxCalc.countDocuments({ user: userId }).exec(),
            ProvTaxCalc.find({ user: userId })
                .sort({ createdAt: -1 })// Newest calculation first
                .limit(HISTORY_LIMIT)
                .exec(),
        ]);

        console.log('[SUCCESS: provisionalTaxRoutes.js, GET /history] Returned', calculations.length, 'of', total, 'calculation(s) for user', userId);
        return res.status(200).json({
            success: true,
            total,
            limit: HISTORY_LIMIT,
            calculations,
        });
    } catch (error) {
        console.error('[ERROR: provisionalTaxRoutes.js, GET /history]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

/*──────────────────────────── DELETE ROUTES ──────────────────────────────────
   DELETE: Used to remove an item from the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
DELETE A SAVED CALCULATION
=======================================*/
/* Removes one of the logged in user's saved provisional tax calculations.

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
            console.error('[ERROR: provisionalTaxRoutes.js, DELETE /history/:id] Invalid calculation id:', id);// Log an error message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'Invalid calculation id' });// Send a 400 (Bad Request) status code with a message
        }

        const removed = await ProvTaxCalc.findOneAndDelete({ _id: id, user: userId }).exec();

        /* Conditional rendering to check a record was actually removed. Covers
        both a calculation that does not exist and one owned by another user. */
        if (!removed) {
            console.warn('[WARN: provisionalTaxRoutes.js, DELETE /history/:id] No calculation', id, 'for user', userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'Calculation not found' });// Send a 404 (Not Found) status code with a message
        }

        console.log('[SUCCESS: provisionalTaxRoutes.js, DELETE /history/:id] Deleted calculation', id, 'for user', userId);
        return res.status(200).json({
            success: true,
            message: 'Calculation removed from your history',
            calculationId: id,// Returned so the client can drop the calculation from the list on screen
        });
    } catch (error) {
        console.error('[ERROR: provisionalTaxRoutes.js, DELETE /history/:id]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

//========EXPORT THE ROUTER============
module.exports = router;// Export the router to be used in other parts of the application
