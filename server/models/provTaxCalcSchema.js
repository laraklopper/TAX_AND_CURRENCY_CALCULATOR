// provTaxCalcSchema.js
/* A saved provisional tax calculation - one IRP6 as the calculator worked it
out.

Provisional tax is the same normal tax the income tax calculator produces, paid
in advance, so the tax-on-the-estimate figures here mirror taxCalcSchema. What
this model adds is everything that makes an instalment an instalment: WHICH of
the three payments it is, the portion of the year's liability that payment
covers, the date it falls due, and the employees' tax, foreign tax credits and
earlier provisional payments deducted from it.

The figures are stored as they were worked out by utils/provisionalTaxCalculator.js
rather than recomputed on read, so a saved record still reproduces exactly what
the user saw even after the tax year's brackets or the taxpayer's estimate
change. */
const mongoose = require('mongoose');

const provTaxCalcSchema = new mongoose.Schema({
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
    //==============THE IRP6 THIS CALCULATION IS FOR=================
    /* The tax year the estimate applies to. A SARS year of assessment straddles
    two calendar years (1 March - 28/29 February), so it is stored as the
    "2025-2026" string used by TaxYearConfig rather than as a single number. */
    taxYear: {
        type: String,
        required: [true, 'tax year is required'],
        trim: true,
        match: [/^\d{4}-\d{4}$/, 'Tax year must be in the format YYYY-YYYY'],
    },
    /* Which of the three payments this is. The first two are compulsory; the
    third is a voluntary top-up made after the year has ended. */
    period: {
        type: String,
        enum: {
            values: ['first', 'second', 'third'],
            message: 'period must be first, second or third',
        },
        required: [true, 'period is required'],
    },
    /* The share of the year's liability the payment covers: 0.5 for the first
    payment, 1 for the second and third. Stored rather than derived from
    `period`, so the record still explains its own arithmetic if the instalment
    rules ever change. */
    periodPortion: {
        type: Number,
        required: [true, 'period portion is required'],
        min: [0, 'Period portion cannot be negative'],
        max: [1, 'Period portion cannot exceed 1'],
    },
    /* The date the IRP6 fell due. Optional: it is worked out from the tax year's
    start and end dates, and a year captured without usable dates leaves it
    unknown rather than guessed at. */
    dueDate: {
        type: Date,
        default: null,
    },
    //==============THE TAXPAYER'S ESTIMATE=================
    // Estimated taxable income for the WHOLE year of assessment
    estimatedTaxableIncome: {
        type: Number,
        required: [true, 'estimated taxable income is required'],
        min: [0, 'Estimated taxable income cannot be negative'],
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
    /* Taxable income per the most recent assessment, which the first estimate
    may not fall below. Optional, because a taxpayer filing their first IRP6 has
    no assessment to take it from. */
    basicAmount: {
        type: Number,
        default: null,
        min: [0, 'Basic amount cannot be negative'],
    },
    /*===========CALCULATED RESULT=================
    Worked out by utils/provisionalTaxCalculator.js from the tax year's brackets
    and rebates, and stored so the record reproduces exactly what the user saw. */
    // Tax the brackets produced on the estimate, before any rebate
    taxOnEstimate: {
        type: Number,
        required: [true, 'tax on estimate is required'],
        min: [0, 'Tax on estimate cannot be negative'],
    },
    // Cumulative rebate the taxpayer's age qualified them for
    rebate: {
        type: Number,
        required: [true, 'rebate is required'],
        min: [0, 'Rebate cannot be negative'],
    },
    /* Medical scheme fees tax credits, as supplied by the taxpayer.
    TaxYearConfig holds no per-year credit figures, so this is an input rather
    than something the calculator works out. */
    medicalCredits: {
        type: Number,
        default: 0,
        min: [0, 'Medical credits cannot be negative'],
    },
    /* Normal tax on the estimate for the full year, after the rebates and
    credits. Non-refundable, so it is floored at zero. */
    annualTaxLiability: {
        type: Number,
        required: [true, 'annual tax liability is required'],
        min: [0, 'Annual tax liability cannot be negative'],
    },
    // The portion of that liability this period covers
    taxForPeriod: {
        type: Number,
        required: [true, 'tax for the period is required'],
        min: [0, 'Tax for the period cannot be negative'],
    },
    //==============WHAT CAME OFF THE INSTALMENT=================
    // Employees' tax (PAYE) already withheld for the period
    employeesTax: {
        type: Number,
        default: 0,
        min: [0, "Employees' tax cannot be negative"],
    },
    // Credits for tax already paid abroad on the same income
    foreignTaxCredits: {
        type: Number,
        default: 0,
        min: [0, 'Foreign tax credits cannot be negative'],
    },
    /* Provisional tax already paid towards this year of assessment. Always 0 on
    a first payment, because nothing can have been paid yet. */
    priorPayments: {
        type: Number,
        default: 0,
        min: [0, 'Prior payments cannot be negative'],
    },
    /* What is actually payable on this IRP6. Floored at zero: an IRP6 cannot
    ask for a negative payment, so a taxpayer whose PAYE already covers the
    liability has nothing to pay. */
    amountPayable: {
        type: Number,
        required: [true, 'amount payable is required'],
        min: [0, 'Amount payable cannot be negative'],
    },
    // Total tax for the year as a percentage of the estimated taxable income
    effectiveRate: {
        type: Number,
        required: [true, 'effective rate is required'],
        min: [0, 'Effective rate cannot be negative'],
        max: [100, 'Effective rate cannot exceed 100'],
    },
    // Percentage rate charged on the taxpayer's next rand of taxable income
    marginalRate: {
        type: Number,
        required: [true, 'marginal rate is required'],
        min: [0, 'Marginal rate cannot be negative'],
        max: [100, 'Marginal rate cannot exceed 100'],
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

/* Virtual field returning everything already paid towards the year: withheld by
an employer, credited for tax paid abroad, or paid on an earlier IRP6. This is
the figure deducted from the period's tax to arrive at the amount payable. */
provTaxCalcSchema.virtual('totalCredits').get(function () {
    return this.employeesTax + this.foreignTaxCredits + this.priorPayments;
});

/* Virtual field returning the surplus where the credits came to more than the
period's tax. The amount payable is floored at zero, so without this the
overpayment would not appear on the record at all. */
provTaxCalcSchema.virtual('overpaid').get(function () {
    const balance = this.taxForPeriod - this.totalCredits;
    return balance < 0 ? -balance : 0;
});

/* Virtual field returning the liability for the year still to be settled by
later payments - nil on a second or third payment, which square up the full
year, and half the year's liability on a first payment. */
provTaxCalcSchema.virtual('remainingForYear').get(function () {
    return this.annualTaxLiability - this.taxForPeriod;
});

module.exports = mongoose.model('provisionalTax', provTaxCalcSchema);
