// taxRoutes.js
/* Income tax endpoints, mounted at /api/tax by app.js.

  GET    /config      - tax years the calculator can work with
  POST   /config      - create or update a tax year configuration (admin only)
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
const { checkJwtToken, checkAdmin, generalRateLimiter } = require('./middleware');
// Import schemas
const User = require('../models/userSchema');
const TaxCalc = require('../models/taxCalcSchema');
const TaxYearConfig = require('../models/TaxYearSchema');
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
/* Most brackets a submitted tax year configuration may contain. SARS has never
published more than seven, so this only guards against a runaway payload. */
const MAX_BRACKETS = 12;
// The tax year label the client sends, e.g. "2025-2026"
const TAX_YEAR_PATTERN = /^\d{4}-\d{4}$/;

/*=====================================
TAX YEAR CONFIG VALIDATION
=======================================*/
// True for a real, finite number that is zero or more
const isPositiveNumber = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;

/* Parses a YYYY-MM-DD date, which is the format an <input type="date"> submits.
The parsed date is formatted back and compared to what came in, because
`new Date` silently ROLLS OVER an impossible day - '2025-02-30' becomes 2 March
rather than an invalid date - and a start date that quietly moved would put the
year of assessment a day or two out. Returns null when the date is unusable. */
const parseIsoDate = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return null;
    return parsed.toISOString().slice(0, 10) === value ? parsed : null;
};

/* Validates a whole tax year configuration submitted by the admin form:
taxYear, the two dates, the brackets and the rebate and threshold sets.

This repeats the checks AddTaxDataForm.js already runs in the browser, because
the browser's copy can be bypassed - this is the one that decides what reaches
the database, and a bad configuration here would silently mis-tax every
calculation made against the year.

Returns a message describing the first problem found, or null when the
configuration is usable. */
const validateTaxYearConfig = (body = {}) => {
    const { taxYear, startDate, endDate, brackets, rebates, thresholds } = body;

    // Conditional rendering to validate the tax year label
    if (typeof taxYear !== 'string' || !TAX_YEAR_PATTERN.test(taxYear.trim())) {
        return 'taxYear must use the format YYYY-YYYY, e.g. 2025-2026';
    }

    // Conditional rendering to validate the two dates bounding the tax year
    const start = parseIsoDate(startDate);
    const end = parseIsoDate(endDate);
    if (!start) return 'startDate must be a real date in the format YYYY-MM-DD';
    if (!end) return 'endDate must be a real date in the format YYYY-MM-DD';
    if (start >= end) return 'endDate must be after startDate';

    // Conditional rendering to validate the bracket list itself
    if (!Array.isArray(brackets) || brackets.length === 0) {
        return 'brackets must be a list containing at least one bracket';
    }
    if (brackets.length > MAX_BRACKETS) {
        return `brackets must contain no more than ${MAX_BRACKETS} brackets`;
    }

    /* Each bracket is checked against the one before it as well as on its own:
    the brackets have to run on from one another, because a gap or an overlap
    would leave an income that either no bracket or two brackets can tax. */
    for (let i = 0; i < brackets.length; i++) {
        const { min, max, baseAmount, rate } = brackets[i] ?? {};
        const label = `brackets[${i}]`;

        if (!isPositiveNumber(min)) return `${label}.min must be a number of 0 or more`;
        if (!isPositiveNumber(baseAmount)) return `${label}.baseAmount must be a number of 0 or more`;
        /* Rates are stored as decimal fractions (0.18 for 18%), which is what
        the form converts its percentages back to before sending. */
        if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0 || rate > 1) {
            return `${label}.rate must be a decimal fraction greater than 0 and no more than 1`;
        }

        /* A null ceiling marks the top bracket, which has no upper limit, so
        only the last bracket is allowed one. */
        const isLast = i === brackets.length - 1;
        if (max === null || max === undefined) {
            if (!isLast) return `${label}.max is required: only the last bracket may have no ceiling`;
        } else {
            if (!isPositiveNumber(max)) return `${label}.max must be a number of 0 or more, or null`;
            if (max <= min) return `${label}.max must be greater than ${label}.min`;
        }

        // Conditional rendering to check this bracket carries on from the previous one
        if (i > 0) {
            const previousMax = brackets[i - 1]?.max;
            if (min !== previousMax + 1) {
                return `${label}.min must be ${previousMax + 1}, carrying on from the previous bracket`;
            }
        }
    }

    // Conditional rendering to validate the three rebates and three thresholds
    for (const key of ['primary', 'secondary', 'tertiary']) {
        if (!isPositiveNumber(rebates?.[key])) return `rebates.${key} must be a number of 0 or more`;
    }
    for (const key of ['under65', 'age65to74', 'age75plus']) {
        if (!isPositiveNumber(thresholds?.[key])) return `thresholds.${key} must be a number of 0 or more`;
    }

    return null;
};

/* Rebuilds the configuration from the request body field by field, so only the
fields below can ever reach the database: taking the body as it arrives would
let a request set `_id` or `createdAt` as well. Runs after
validateTaxYearConfig, so every figure read here is already known to be sound. */
const parseTaxYearConfig = (body = {}) => ({
    taxYear: body.taxYear.trim(),
    startDate: parseIsoDate(body.startDate),
    endDate: parseIsoDate(body.endDate),
    brackets: body.brackets.map((bracket) => ({
        min: bracket.min,
        max: bracket.max === undefined ? null : bracket.max,
        baseAmount: bracket.baseAmount,
        rate: bracket.rate,
    })),
    rebates: {
        primary: body.rebates.primary,
        secondary: body.rebates.secondary,
        tertiary: body.rebates.tertiary,
    },
    thresholds: {
        under65: body.thresholds.under65,
        age65to74: body.thresholds.age65to74,
        age75plus: body.thresholds.age75plus,
    },
    isActive: Boolean(body.isActive),
});

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
TAX YEAR CONFIG
=======================================*/
/* Saves the tax year configuration captured by AddTaxDataForm.js: the
brackets, rebates and thresholds every tax calculation for that year is worked
out from.

The tax year LABEL is the identity of a configuration, not an id from the
request: a year that already exists is updated in place, a year that does not
is created. The admin form therefore posts the same way whether it is adding a
year or correcting one, and a correction can never quietly create a second,
competing copy of a year that is already there.

Admin only, because these figures decide what every user's calculations return.
The admin flag is re-read from the database by checkAdmin rather than trusted
from the token. */
router.post('/config', checkJwtToken, checkAdmin, generalRateLimiter, async (req, res) => {
    const validationMessage = validateTaxYearConfig(req.body);
    // Conditional rendering to check the submitted configuration is usable
    if (validationMessage) {
        console.warn('[WARN: taxRoutes.js, POST /config] Rejected:', validationMessage);// Log a warning message in the console for debugging purposes
        return res.status(400).json({ success: false, message: validationMessage });// Send a 400 (Bad Request) status code with a message
    }

    try {
        const config = parseTaxYearConfig(req.body);

        /* Looked up first so the response can say whether the year was created
        or updated, which is what tells the form which message to show. */
        const existing = await TaxYearConfig.findOne({ taxYear: config.taxYear }).select('_id').lean().exec();

        const saved = existing
            ? await TaxYearConfig.findOneAndUpdate(
                { taxYear: config.taxYear },
                config,
                { new: true, runValidators: true }// Return the updated document, checked against the schema
            ).exec()
            : await TaxYearConfig.create(config);

        /* Only ONE year can be the active one: GET /config and the calculator
        both resolve the current year with `findOne({ isActive: true })`, so a
        second active year would make which figures get used arbitrary. Standing
        the new year up therefore stands the previous one down. */
        if (saved.isActive) {
            const standDown = await TaxYearConfig.updateMany(
                { _id: { $ne: saved._id }, isActive: true },
                { isActive: false }
            ).exec();
            if (standDown.modifiedCount > 0) {
                console.log('[SUCCESS: taxRoutes.js, POST /config] Stood down', standDown.modifiedCount, 'previously active tax year(s)');
            }
        }

        console.log('[SUCCESS: taxRoutes.js, POST /config]', existing ? 'Updated' : 'Created', 'tax year', saved.taxYear);
        return res.status(existing ? 200 : 201).json({
            success: true,
            message: existing
                ? `Tax year ${saved.taxYear} updated`
                : `Tax year ${saved.taxYear} created`,
            config: saved,// Returned so the form can carry on editing the saved year
        });
    } catch (error) {
        // A schema validation failure is the admin's input, not a server fault
        if (error.name === 'ValidationError') {
            console.error('[ERROR: taxRoutes.js, POST /config] Validation failed:', error.message);
            return res.status(400).json({ success: false, message: error.message });// Send a 400 (Bad Request) status code with a message
        }
        /* A duplicate key on the unique taxYear index: the year was created by
        another request between the lookup above and the write. */
        if (error.code === 11000) {
            console.warn('[WARN: taxRoutes.js, POST /config] Tax year already exists:', req.body?.taxYear);
            return res.status(409).json({
                success: false,
                message: 'That tax year has just been saved by someone else. Reload the page and try again.'
            });// Send a 409 (Conflict) status code with a message
        }
        console.error('[ERROR: taxRoutes.js, POST /config]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

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

//========EXPORT THE ROUTER============
module.exports = router;// Export the router to be used in other parts of the application
