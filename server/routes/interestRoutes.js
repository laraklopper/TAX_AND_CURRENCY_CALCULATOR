// interestRoutes.js
/* Interest calculator endpoints, mounted at /api/interest by app.js.

  POST   /calculate   - work out simple or compound interest (returns a result, saves nothing)
  POST   /save        - save a calculation to the logged in user's history
  GET    /history     - the logged in user's saved calculations
  DELETE /history/:id - remove one of the logged in user's saved calculations

Works out simple or compound interest over a period the user supplies in
either YEARS (annual) or MONTHS (monthly). The rate is always an annual
nominal rate; the calculator converts it to the requested period so both
options can be compared against the same quoted rate.

/save deliberately RECALCULATES from the user's inputs instead of storing the
figures the browser sends. A saved record is therefore always internally
consistent, and a tampered request cannot write false totals to the database.
The fullName it accepts is handled the same way: validated on the way in, but
the name written to the record is the one on the user's own account.

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
const Interest = require('../models/interestSchema');
// Import Utility functions
const { calculateInterest, COMPOUND_FREQUENCIES, MAX_DURATION } = require('../utils/interestCalculator');

const router = express.Router()// Create a new router object using Express

// Values the interest calculator accepts for the time period unit
const PERIOD_UNITS = ['years', 'months'];
// Values the interest calculator accepts for the interest type
const INTEREST_TYPES = ['simple', 'compound'];
/* Most saved calculations a single /history response will return. A user's
history grows without limit, so the newest records are returned and the total
is reported alongside them rather than the response growing unbounded. */
const HISTORY_LIMIT = 100;
/* Length limits for the two halves of fullName. Kept the same as the interest
and user schemas, so a name is rejected with a readable message here instead of
failing mongoose validation further down. */
const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 50;

/*=====================================
INTEREST INPUT PARSING AND VALIDATION
=======================================*/
/* Reads the interest calculator's fields off a request body and coerces them
to numbers. Shared by /calculate and /save so both routes parse a request in
exactly the same way. */
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

/*=====================================
FULL NAME PARSING AND VALIDATION
=======================================*/
/* Reads the nested fullName object off a request body and trims both halves.
The interest calculator sends it with a /save so the record can show who made
the calculation.

Returns null when neither half was supplied, which is not an error: the name is
OPTIONAL on the request because /save reads the stored name off the user record
anyway. It is only validated when the client does send one. */
const parseFullName = (body = {}) => {
    const { firstName, lastName } = body.fullName || {};
    // Conditional check so a body with no fullName is reported as "not sent"
    if (firstName === undefined && lastName === undefined) return null;

    return {
        firstName: typeof firstName === 'string' ? firstName.trim() : '',
        lastName: typeof lastName === 'string' ? lastName.trim() : '',
    };
};

/* Validates a parsed fullName. Returns a message describing the first problem
found, or null when the name is usable or was not sent at all. */
const validateFullName = (fullName) => {
    // Conditional check: nothing to validate when no name was sent
    if (!fullName) return null;

    // Both halves are required by the schema, so a partial name is rejected
    for (const [field, value] of Object.entries(fullName)) {
        if (!value) {
            return `fullName.${field} is required`;
        }
        if (value.length < NAME_MIN_LENGTH || value.length > NAME_MAX_LENGTH) {
            return `fullName.${field} must be between ${NAME_MIN_LENGTH} and ${NAME_MAX_LENGTH} characters`;
        }
    }
    return null;
};

// Conditional helper reporting whether a stored fullName has both halves
const isCompleteFullName = (fullName) =>
    Boolean(fullName && fullName.firstName && fullName.lastName);

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

/*──────────────────────────── GET ROUTES ───────────────────────────────
    GET: READ — Used to fetch information from the database
 ─────────────────────────────────────────────────────────────────────────*/
/*=====================================
SAVED CALCULATION HISTORY
=======================================*/
/* Returns the logged in user's saved interest calculations, newest first. The
user is taken from the JWT rather than a query param, so this can only ever
return the requester's own records.

`total` is reported separately from the returned array: only the newest
HISTORY_LIMIT records are sent, so the client can tell when it is looking at a
truncated view rather than the user's whole history. */
router.get('/history', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user.userId;// The token payload signed in authRoutes.js uses `userId`

        /* Counted and fetched together: the count is what tells the client the
        list was truncated, so it has to reflect the same filter. */
        const [total, calculations] = await Promise.all([
            Interest.countDocuments({ user: userId }).exec(),
            Interest.find({ user: userId })
                .sort({ createdAt: -1 })// Newest calculation first
                .limit(HISTORY_LIMIT)
                .exec(),
        ]);

        console.log('[SUCCESS: interestRoutes.js, GET /history] Returned', calculations.length, 'of', total, 'calculation(s) for user', userId);
        return res.status(200).json({
            success: true,
            total,
            limit: HISTORY_LIMIT,
            calculations,
        });
    } catch (error) {
        console.error('[ERROR: interestRoutes.js, GET /history]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

/*──────────────────────────── POST ROUTES ──────────────────────────────
    POST: Used to create a new resource/submit data to the database
 ─────────────────────────────────────────────────────────────────────────*/
/*=====================================
INTEREST CALCULATION
=======================================*/
/*The client also has a local fallback calculation for previewing, but this
route is the source of truth for anything that gets saved. */
router.post('/calculate', checkJwtToken, (req, res) => {
    const input = parseInterestInput(req.body);

    const validationMessage = validateInterestInput(input);
    // Conditional rendering to check the submitted figures are usable
    if (validationMessage) {
        return res.status(400).json({ success: false, message: validationMessage });// Send a 400 (Bad Request) status code with a message
    }

    try {
        const result = calculateInterest(input);

        console.log('[SUCCESS: interestRoutes.js, /calculate] Calculated', input.type, 'interest over', input.duration, input.periodUnit);
        return res.status(200).json({ success: true, result });
    } catch (error) {
        console.error('[ERROR: interestRoutes.js, /calculate]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

/*=====================================
SAVE AN INTEREST CALCULATION
=======================================*/
/* Saves an interest calculation to the logged in user's history. The user is
taken from the JWT, never from the request body, so a user can only ever write
a record against themselves.

The result is RECALCULATED from the submitted inputs rather than read from the
request, so a saved record is always internally consistent and a tampered
request cannot write false totals to the database.

The fullName the client sends is treated the same way: it is validated, but the
name STORED on the record is the one on the user's own account, so a request
cannot file a calculation under somebody else's name. The submitted name is
only used if the account itself has no usable one. */
router.post('/save', checkJwtToken, async (req, res) => {
    const input = parseInterestInput(req.body);
    const submittedFullName = parseFullName(req.body);

    const validationMessage = validateInterestInput(input) || validateFullName(submittedFullName);
    // Conditional rendering to check the submitted figures and name are usable
    if (validationMessage) {
        return res.status(400).json({ success: false, message: validationMessage });// Send a 400 (Bad Request) status code with a message
    }

    try {
        // The fullName is read from the database rather than trusted from the body
        const user = await User.findById(req.user.userId).select('fullName').exec();
        // Conditional rendering to check the user on the token still exists
        if (!user) {
            console.warn('[WARN: interestRoutes.js, /save] No user found for id', req.user.userId);
            return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });
        }

        /* The account's own name wins. The submitted name is the fallback for
        the one case it cannot be wrong about - an account with no stored name
        - so an otherwise valid save is not lost to incomplete profile data. */
        const fullName = isCompleteFullName(user.fullName) ? user.fullName : submittedFullName;

        /* Conditional rendering to check a name was resolved at all: the
        schema requires one, so there is nothing to file the record under. */
        if (!isCompleteFullName(fullName)) {
            console.warn('[WARN: interestRoutes.js, /save] No usable fullName for user', user._id);
            return res.status(400).json({ success: false, message: 'A first name and last name are required to save a calculation' });// Send a 400 (Bad Request) status code with a message
        }

        /* Logged rather than rejected: the stored name is used either way, and
        a mismatch usually just means the profile was edited in another tab. */
        if (submittedFullName && isCompleteFullName(user.fullName) &&
            (submittedFullName.firstName !== user.fullName.firstName || submittedFullName.lastName !== user.fullName.lastName)) {
            console.warn('[WARN: interestRoutes.js, /save] Submitted fullName does not match the stored name for user', user._id, '- saving under the stored name');
        }

        const result = calculateInterest(input);

        const saved = await Interest.create({
            user: user._id,
            fullName,
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

        console.log('[SUCCESS: interestRoutes.js, /save] Saved interest calculation', saved._id, 'for user', user._id);
        return res.status(201).json({ success: true, message: 'Calculation saved to your history', saved, result });
    } catch (error) {
        // A schema validation failure is the user's input, not a server fault
        if (error.name === 'ValidationError') {
            console.error('[ERROR: interestRoutes.js, /save] Validation failed:', error.message);
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('[ERROR: interestRoutes.js, /save]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

/*──────────────────────────── DELETE ROUTES ────────────────────────────
    DELETE: Used to remove an item from the database
 ─────────────────────────────────────────────────────────────────────────*/
/*=====================================
DELETE A SAVED CALCULATION
=======================================*/
/* Removes one of the logged in user's saved interest calculations.

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
            console.error('[ERROR: interestRoutes.js, DELETE /history/:id] Invalid calculation id:', id);
            return res.status(400).json({ success: false, message: 'Invalid calculation id' });// Send a 400 (Bad Request) status code with a message
        }

        const removed = await Interest.findOneAndDelete({ _id: id, user: userId }).exec();

        /* Conditional rendering to check a record was actually removed. Covers
        both a calculation that does not exist and one owned by another user. */
        if (!removed) {
            console.warn('[WARN: interestRoutes.js, DELETE /history/:id] No calculation', id, 'for user', userId);
            return res.status(404).json({ success: false, message: 'Calculation not found' });// Send a 404 (Not Found) status code with a message
        }

        console.log('[SUCCESS: interestRoutes.js, DELETE /history/:id] Deleted calculation', id, 'for user', userId);
        return res.status(200).json({
            success: true,
            message: 'Calculation removed from your history',
            calculationId: id,// Returned so the client can drop the calculation from the list on screen
        });
    } catch (error) {
        console.error('[ERROR: interestRoutes.js, DELETE /history/:id]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

//=====EXPORT ROUTES==============
module.exports = router;// Export the router to be used in other parts of the application
