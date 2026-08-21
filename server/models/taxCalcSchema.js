// taxCalcSchema.js
/* A saved income tax calculation.

This model stores the BRACKET model described in docs/TAX_CONCEPTS.md: the
gross tax the brackets produced, the cumulative age-based rebate that reduced
it, and the resulting tax payable. It previously stored a single flat `taxRate`
percentage and derived the tax as `taxableIncome × taxRate / 100`, which is a
flat-rate model - a record saved that way could not reproduce the figures the
calculator displayed. That discrepancy is the one flagged at the bottom of
docs/TAX_CONCEPTS.md.

The stored shape follows the TaxCalculation model in planning/PLANNING_DRAFT.md
and matches the result shape TaxCalculatorForm.js renders. */
const mongoose = require('mongoose');

const taxCalcSchema = new mongoose.Schema({
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
    // ==============NESTED INCOME OBJECT=================
    income: {
        // Field for the user's gross annual income
        grossIncome: {
            type: Number,
            required: [true, 'gross income is required'],
            min: [0, 'Gross income cannot be negative'],
        },
        /* Field for the tax year the calculation applies to. A SARS year of
        assessment straddles two calendar years (1 March - 28/29 February), so
        it is stored as the "2025-2026" string used by TaxYearConfig rather
        than as a single number. */
        taxYear: {
            type: String,
            required: [true, 'tax year is required'],
            trim: true,
            match: [/^\d{4}-\d{4}$/, 'Tax year must be in the format YYYY-YYYY'],
        },
    },
    // Deductions applied to gross income before tax is calculated
    deductions: {
        type: Number,
        default: 0,
        min: [0, 'Deductions cannot be negative'],
    },
    // Taxpayer's age, which decides how many rebates they qualify for
    age: {
        type: Number,
        required: [true, 'age is required'],
        min: [16, 'Age cannot be less than 16'],
        max: [120, 'Age cannot exceed 120'],
    },
    /* Age band the rebates were applied from, resolved at calculation time so
    the record still explains itself if the rebate rules later change. */
    ageGroup: {
        type: String,
        enum: ['under65', 'age65to74', 'age75plus'],
        required: [true, 'age group is required'],
    },
    /* Number of medical scheme dependants. Recorded for reference only - no
    medical scheme fees tax credit is applied, because TaxYearConfig holds no
    per-year credit figures to apply one from. */
    dependants: {
        type: Number,
        default: 0,
        min: [0, 'Dependants cannot be negative'],
    },
    /*===========CALCULATED RESULT=================
    Worked out by utils/taxCalculator.js from the tax year's brackets and
    rebates, and stored so the record reproduces exactly what the user saw. */
    // Tax the brackets produced, before any rebate
    grossTax: {
        type: Number,
        required: [true, 'gross tax is required'],
        min: [0, 'Gross tax cannot be negative'],
    },
    // Cumulative rebate the taxpayer's age qualified them for
    rebate: {
        type: Number,
        required: [true, 'rebate is required'],
        min: [0, 'Rebate cannot be negative'],
    },
    /* Tax actually payable. Rebates are non-refundable, so this is floored at
    zero rather than going negative when the rebate exceeds the gross tax. */
    netTax: {
        type: Number,
        required: [true, 'net tax is required'],
        min: [0, 'Net tax cannot be negative'],
    },
    // Total tax as a percentage of total income
    effectiveRate: {
        type: Number,
        required: [true, 'effective rate is required'],
        min: [0, 'Effective rate cannot be negative'],
        max: [100, 'Effective rate cannot exceed 100'],
    },
    // Percentage rate charged on the taxpayer's next rand earned
    marginalRate: {
        type: Number,
        required: [true, 'marginal rate is required'],
        min: [0, 'Marginal rate cannot be negative'],
        max: [100, 'Marginal rate cannot exceed 100'],
    },
},{
    timestamps:true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

// Virtual field returning income remaining after deductions
taxCalcSchema.virtual('taxableIncome').get(function () {
    return this.income.grossIncome - this.deductions;
});

// Virtual field returning income remaining after tax
taxCalcSchema.virtual('netIncome').get(function () {
    return this.income.grossIncome - this.netTax;
});

// Virtual field returning the monthly PAYE equivalent of the annual tax payable
taxCalcSchema.virtual('monthlyTax').get(function () {
    return this.netTax / 12;
});

module.exports = mongoose.model('tax', taxCalcSchema);
