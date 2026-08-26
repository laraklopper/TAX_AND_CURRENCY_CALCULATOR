// vatRoutes.js
/* VAT endpoints, mounted at /vat by app.js.

  POST   /calculate   - work out the VAT on one amount (saves nothing)
  POST   /save        - save a calculation to the logged in user's history
  GET    /history     - the logged in user's saved calculations
  DELETE /history/:id - remove one of the logged in user's saved calculations

Nothing is looked up to answer a VAT calculation. Income tax needs a
TaxYearConfig and a currency conversion needs a rate snapshot, but SARS
publishes VAT as a single flat rate, so the maths in utils/vatCalculator.js is
all there is - which is why /calculate touches the database at all only through
the token check.

/save deliberately RECALCULATES from the user's inputs instead of storing the
figures the browser sends. A saved record is therefore always internally
consistent, and a tampered request cannot write a VAT amount that does not
reconcile against its own net and gross.

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
const VatCalc = require('../models/vatCalcSchema');
// Import Utility functions
const { calculateVat, VAT_MODES } = require('../utils/vatCalculator');

const router = express.Router()// Create a new router object using Express

/* Upper bound on the amount in the request, guarding against nonsense values
overflowing the maths. The same cap the income tax and provisional tax routes
apply. */
const MAX_AMOUNT = 1_000_000_000;
/* Most saved calculations a single /history response will return. A user's
history grows without limit, so the newest records are returned and the total
is reported alongside them rather than the response growing unbounded. */
const HISTORY_LIMIT = 100;

/*=====================================
SHARED INPUT VALIDATION
=======================================*/
/* Reads the request body and coerces it to the shapes the maths expects, so
/calculate and /save parse a request in exactly the same way and cannot disagree
about what was asked for.

The amount is read from `amount` where the request carries one. VatCalculatorForm.js
sends the RESULT of its own local calculation rather than the raw input, so the
amount is otherwise recovered from the figure that was the input in that
direction: the net amount on an exclusive calculation, the gross on an inclusive
one. Recovering it is what lets /save recompute instead of trusting the totals. */
const parseVatInput = (body = {}) => {
    const mode = typeof body.mode === 'string' ? body.mode.trim().toLowerCase() : body.mode;
    /* A request that names no direction is taken as the commoner of the two: a
    price quoted without VAT, with VAT to be added. One that names an
    unrecognised direction is left as it arrived, so validation rejects it by
    name rather than silently working out something else. */
    const direction = mode === undefined || mode === null || mode === '' ? 'exclusive' : mode;

    /* The figure that was typed. Falls back to whichever of the two amounts is
    the input for this direction, never to the derived one. */
    const raw = body.amount ?? (
        direction === 'inclusive' ? body.grossAmount : body.netAmount
    );

    return {
        amount: parseFloat(raw),
        mode: direction,
        isZeroRated: Boolean(body.isZeroRated),
    };
};

/* Validates the body shared by /calculate and /save. Returns a message
describing the first problem found, or null when the input is usable.

This repeats the checks VatCalculatorForm.js already runs in the browser,
because the browser's copy can be bypassed - this is the one that decides what
reaches the maths and the database. */
const validateVatInput = (input) => {
    /* Conditional rendering to validate the amount. Nil is allowed through: a
    zero-rand line on an invoice is a legitimate thing to work VAT out on, and
    it produces a valid nil calculation rather than a meaningless one. */
    if (!Number.isFinite(input.amount) || input.amount < 0 || input.amount > MAX_AMOUNT) {
        return `amount must be a number between 0 and ${MAX_AMOUNT}`;
    }
    // Conditional rendering to validate which direction the calculation runs in
    if (!VAT_MODES.includes(input.mode)) {
        return `mode must be one of: ${VAT_MODES.join(', ')}`;
    }

    return null;
};

/*──────────────────────────── POST ROUTES ──────────────────────────────
    POST: Used to create a new resource/submit data to the database
 ─────────────────────────────────────────────────────────────────────────*/
/*=====================================
VAT CALCULATION
=======================================*/
/* Works out the net, VAT and gross amounts for one item. Nothing is written to
the database. */
router.post('/calculate', checkJwtToken, async (req, res) => {
    const input = parseVatInput(req.body);

    const validationMessage = validateVatInput(input);
    // Conditional rendering to check the submitted figures are usable
    if (validationMessage) {
        console.warn('[WARN: vatRoutes.js, /calculate] Rejected:', validationMessage);// Log a warning message in the console for debugging purposes
        return res.status(400).json({ success: false, message: validationMessage });// Send a 400 (Bad Request) status code with a message
    }

    try {
        const result = calculateVat(input);

        console.log('[SUCCESS: vatRoutes.js, /calculate] Calculated VAT at', result.ratePercent, '% on a VAT-' + result.mode, 'amount');
        return res.status(200).json({ success: true, result });
    } catch (error) {
        console.error('[ERROR: vatRoutes.js, /calculate]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

/*=====================================
SAVE A CALCULATION
=======================================*/
/* Saves a VAT calculation to the logged in user's history. The user is taken
from the JWT, never from the request body, so a user can only ever write a
record against themselves. */
router.post('/save', checkJwtToken, async (req, res) => {
    const input = parseVatInput(req.body);

    const validationMessage = validateVatInput(input);
    // Conditional rendering to check the submitted figures are usable
    if (validationMessage) {
        console.warn('[WARN: vatRoutes.js, /save] Rejected:', validationMessage);// Log a warning message in the console for debugging purposes
        return res.status(400).json({ success: false, message: validationMessage });// Send a 400 (Bad Request) status code with a message
    }

    try {
        // The fullName is read from the database rather than trusted from the body
        const user = await User.findById(req.user.userId).select('fullName').exec();
        // Conditional rendering to check the user on the token still exists
        if (!user) {
            console.warn('[WARN: vatRoutes.js, /save] No user found for id', req.user.userId);// Log a warning message in the console for debugging purposes
            return res.status(401).json({ success: false, message: 'Invalid token. Please login again.' });// Send a 401 (Unauthorized) status code with a message
        }

        /* Recalculated here rather than read from the request: the backend is
        the source of truth for anything that gets persisted. */
        const result = calculateVat(input);

        const saved = await VatCalc.create({
            user: user._id,
            fullName: user.fullName,
            mode: result.mode,
            isZeroRated: result.isZeroRated,
            ratePercent: result.ratePercent,
            netAmount: result.netAmount,
            vatAmount: result.vatAmount,
            grossAmount: result.grossAmount,
        });

        console.log('[SUCCESS: vatRoutes.js, /save] Saved VAT calculation', saved._id, 'for user', user._id);
        return res.status(201).json({ success: true, message: 'Calculation saved to your history', saved, result });
    } catch (error) {
        // A schema validation failure is the user's input, not a server fault
        if (error.name === 'ValidationError') {
            console.error('[ERROR: vatRoutes.js, /save] Validation failed:', error.message);// Log an error message in the console for debugging purposes
            return res.status(400).json({ success: false, message: error.message });// Send a 400 (Bad Request) status code with a message
        }
        console.error('[ERROR: vatRoutes.js, /save]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
SAVED CALCULATION HISTORY
=======================================*/
/* Returns the logged in user's saved VAT calculations, newest first. The user is
taken from the JWT rather than a query param, so this can only ever return the
requester's own records.

`total` is reported separately from the returned array: only the newest
HISTORY_LIMIT records are sent, so the client can tell when it is looking at a
truncated view rather than the user's whole history. */
router.get('/history', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user.userId;// The token payload signed in authRoutes.js uses `userId`

        /* Counted and fetched together: the count is what tells the client the
        list was truncated, so it has to reflect the same filter. */
        const [total, calculations] = await Promise.all([
            VatCalc.countDocuments({ user: userId }).exec(),
            VatCalc.find({ user: userId })
                .sort({ createdAt: -1 })// Newest calculation first
                .limit(HISTORY_LIMIT)
                .exec(),
        ]);

        console.log('[SUCCESS: vatRoutes.js, GET /history] Returned', calculations.length, 'of', total, 'calculation(s) for user', userId);
        return res.status(200).json({
            success: true,
            total,
            limit: HISTORY_LIMIT,
            calculations,
        });
    } catch (error) {
        console.error('[ERROR: vatRoutes.js, GET /history]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

/*──────────────────────────── DELETE ROUTES ──────────────────────────────────
   DELETE: Used to remove an item from the database
────────────────────────────────────────────────────────────────────────────────*/
/*=====================================
DELETE A SAVED CALCULATION
=======================================*/
/* Removes one of the logged in user's saved VAT calculations.

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
            console.error('[ERROR: vatRoutes.js, DELETE /history/:id] Invalid calculation id:', id);// Log an error message in the console for debugging purposes
            return res.status(400).json({ success: false, message: 'Invalid calculation id' });// Send a 400 (Bad Request) status code with a message
        }

        const removed = await VatCalc.findOneAndDelete({ _id: id, user: userId }).exec();

        /* Conditional rendering to check a record was actually removed. Covers
        both a calculation that does not exist and one owned by another user. */
        if (!removed) {
            console.warn('[WARN: vatRoutes.js, DELETE /history/:id] No calculation', id, 'for user', userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({ success: false, message: 'Calculation not found' });// Send a 404 (Not Found) status code with a message
        }

        console.log('[SUCCESS: vatRoutes.js, DELETE /history/:id] Deleted calculation', id, 'for user', userId);
        return res.status(200).json({
            success: true,
            message: 'Calculation removed from your history',
            calculationId: id,// Returned so the client can drop the calculation from the list on screen
        });
    } catch (error) {
        console.error('[ERROR: vatRoutes.js, DELETE /history/:id]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})

//========EXPORT THE ROUTER============
module.exports = router;// Export the router to be used in other parts of the application
