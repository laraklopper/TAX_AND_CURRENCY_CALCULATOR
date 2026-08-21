// interestSchena.js
const mongoose = require('mongoose');

const interestSchema = new mongoose.Schema({
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
    fullName : {
        // Field for user first name
        firstName: {
            type: String,
            required: [true, 'first Name is required'],
            trim: true,
            minlength: [2, 'First name must be at least 2 characters long'],
            maxlength: [50, 'First name cannot exceed 50 characters'],
        },
        // Field for user last name
        lastName:{
            type: String,
            required: [true, 'Last Name is required'],
            trim: true,
            minlength: [2, 'Last name must be at least 2 characters long'],
            maxlength: [50, 'Last name cannot exceed 50 characters'],
        },
    },
    // Amount of money the interest is calculated on
    principal: {
        type: Number,
        required: [true, 'principal amount is required'],
        min: [0, 'Principal cannot be negative'],
    },
    // Annual interest rate (percentage)
    interestRate: {
        type: Number,
        required: [true, 'interest rate is required'],
        min: [0, 'Interest rate cannot be negative'],
    },
    // ==============NESTED TIME OBJECT=================
    time: {
        // Field for the length of the investment/loan
        duration: {
            type: Number,
            required: [true, 'duration is required'],
            min: [0, 'Duration cannot be negative'],
        },
        // Field for the unit the duration is measured in
        unit: {
            type: String,
            enum: ['years', 'months'],
            default: 'years',
        },
    },
    // Whether interest is calculated as simple or compound
    interestType: {
        type: String,
        enum: ['simple', 'compound'],
        default: 'simple',
    },
    // Number of times interest is compounded per year (only used when interestType is 'compound')
    compoundFrequency: {
        type: Number,
        default: 1,
        min: [1, 'Compound frequency must be at least 1'],
    },
    // Optional contribution
    monthlyContribution: {
        type: Number,
        default: 0,
        min: [0, 'Monthly contribution cannot be negative'],
    },
    /*===========CALCULATED RESULT=================
    The figures below are worked out by utils/interestCalculator.js and stored
    with the record, rather than being derived on read. A recurring monthly
    contribution cannot be expressed by the closed-form interest formulas, so
    recomputing on read would not reproduce what the user was shown. */
    // Total interest earned over the whole period
    totalInterest: {
        type: Number,
        required: [true, 'total interest is required'],
        min: [0, 'Total interest cannot be negative'],
    },
    // Sum of all the recurring monthly contributions paid in
    totalContributions: {
        type: Number,
        default: 0,
        min: [0, 'Total contributions cannot be negative'],
    },
    // Closing balance: principal + contributions + interest
    finalAmount: {
        type: Number,
        required: [true, 'final amount is required'],
        min: [0, 'Final amount cannot be negative'],
    },
},{
    timestamps:true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

// Virtual field returning the duration converted to years
interestSchema.virtual('durationInYears').get(function () {
    return this.time.unit === 'months' ? this.time.duration / 12 : this.time.duration;
});

/* Virtual field returning the total capital the user paid in themselves,
as opposed to the interest the calculation earned on top of it. */
interestSchema.virtual('totalCapital').get(function () {
    return this.principal + (this.totalContributions || 0);
});

/* NOTE: `interestAmount` and `totalAmount` used to be virtuals that re-derived
the result from the closed-form simple/compound formulas. They were replaced by
the stored `totalInterest` and `finalAmount` fields above, because neither
formula can account for a recurring monthly contribution - so the virtuals
returned figures that disagreed with what the calculator showed the user. */

module.exports = mongoose.model('interest', interestSchema);
