// vatCalcSchema.js
/* A saved VAT calculation - one item as the calculator worked it out.

VAT is the simplest of the four calculators to store, because there is nothing
to resolve: no tax year, no brackets, no rebates and no age. What a record has
to carry is which DIRECTION the calculation ran in (VAT added to a
VAT-exclusive price, or stripped back out of a VAT-inclusive one) and the rate
it was worked out at, because those two facts are what make the three amounts
reconcile.

`ratePercent` is stored rather than read from utils/vatCalculator.js on the way
out. The rate is published by SARS and does change - it went from 14% to 15% in
2018, and a rise to 15.5% was tabled and withdrawn for 2025/2026 - so a record
that took the rate from the current constant would silently restate an old
calculation at today's rate. Stored, an old record still reproduces exactly what
the calculator showed.

The figures come from utils/vatCalculator.js, which the /save route re-runs on
the user's inputs rather than trusting the totals the browser sends. */
const mongoose = require('mongoose');
// The two directions a calculation can run in, shared with the maths
const { VAT_MODES } = require('../utils/vatCalculator');

const vatCalcSchema = new mongoose.Schema({
    /* The user the saved calculation belongs to. Stored as a reference rather
    than relying on fullName, so a history lookup cannot return another user's
    calculations when two users share a name. */
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: [true, 'user is required'],
        index: true,
    },
    //===============NESTED FULL NAME OBJECT=========
    // Current logged in user fullName
    fullName: {
        // Field for user first name
        firstName: {
            type: String,
            required: [true, 'first Name is required'],
            trim: true,
            minlength: [2, 'First name must be at least 2 characters long'],
            maxlength: [50, 'First name cannot exceed 50 characters'],
        },
        // Field for user last name
        lastName: {
            type: String,
            required: [true, 'Last Name is required'],
            trim: true,
            minlength: [2, 'Last name must be at least 2 characters long'],
            maxlength: [50, 'Last name cannot exceed 50 characters'],
        },
    },
    //==============HOW THE CALCULATION WAS ASKED FOR=================
    /* Which direction the calculation ran in. 'exclusive' means the amount
    entered was the price before VAT and VAT was added on top; 'inclusive' means
    it was the price after VAT and the VAT in it was stripped back out. The three
    amounts below are the same either way - this is what says which of them the
    user typed. */
    mode: {
        type: String,
        enum: {
            values: VAT_MODES,
            message: `mode must be one of: ${VAT_MODES.join(', ')}`,
        },
        required: [true, 'mode is required'],
    },
    /* Whether the item was flagged as zero-rated (0%) rather than levied at the
    standard rate. A zero-rated supply is still a taxable supply, which is why it
    is recorded as a rate of nil rather than as no calculation at all. */
    isZeroRated: {
        type: Boolean,
        default: false,
    },
    /* The rate the VAT was worked out at, as a percentage: the SARS standard
    rate, or 0 for a zero-rated item. Stored rather than derived, so a record
    saved at 14% or 15% still reproduces itself after the rate changes. */
    ratePercent: {
        type: Number,
        required: [true, 'rate percent is required'],
        min: [0, 'Rate percent cannot be negative'],
        max: [100, 'Rate percent cannot exceed 100'],
    },
    /*===========CALCULATED RESULT=================
    Worked out by utils/vatCalculator.js and stored so the record reproduces
    exactly what the user saw. */
    // The amount excluding VAT
    netAmount: {
        type: Number,
        required: [true, 'net amount is required'],
        min: [0, 'Net amount cannot be negative'],
    },
    // The VAT portion itself, nil on a zero-rated item
    vatAmount: {
        type: Number,
        required: [true, 'VAT amount is required'],
        min: [0, 'VAT amount cannot be negative'],
    },
    // The amount including VAT
    grossAmount: {
        type: Number,
        required: [true, 'gross amount is required'],
        min: [0, 'Gross amount cannot be negative'],
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

/* Virtual field returning the amount the user actually typed: the net amount on
an exclusive calculation and the gross on an inclusive one. Derived rather than
stored, because `mode` already says which of the two it was and storing it again
would be a fourth amount that could disagree with the other three. */
vatCalcSchema.virtual('enteredAmount').get(function () {
    return this.mode === 'inclusive' ? this.grossAmount : this.netAmount;
});

/* Virtual field returning the VAT as a percentage of the net amount. This is
the rate the calculation actually worked out to, which reconciles against
`ratePercent` and is what makes a stored record checkable. Nil net amount
returns 0 rather than dividing by zero. */
vatCalcSchema.virtual('effectiveRate').get(function () {
    return this.netAmount > 0 ? (this.vatAmount / this.netAmount) * 100 : 0;
});

module.exports = mongoose.model('vat', vatCalcSchema);
