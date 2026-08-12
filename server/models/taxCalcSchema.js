// taxCalcSchema.js
const mongoose = require('mongoose');

const taxCalcSchema = new mongoose.Schema({
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
        // Field for the tax year the calculation applies to
        taxYear: {
            type: Number,
            required: [true, 'tax year is required'],
            min: [2000, 'Tax year must be 2000 or later'],
            max: [2100, 'Tax year must be 2100 or earlier'],
        },
    },
    // Deductions applied to gross income before tax is calculated
    deductions: {
        type: Number,
        default: 0,
        min: [0, 'Deductions cannot be negative'],
    },
    // Tax rate (percentage) applied to the taxable income
    taxRate: {
        type: Number,
        required: [true, 'tax rate is required'],
        min: [0, 'Tax rate cannot be negative'],
        max: [100, 'Tax rate cannot exceed 100'],
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

// Virtual field returning the tax owed on the taxable income
taxCalcSchema.virtual('taxAmount').get(function () {
    return this.taxableIncome * (this.taxRate / 100);
});

// Virtual field returning income remaining after tax
taxCalcSchema.virtual('netIncome').get(function () {
    return this.income.grossIncome - this.taxAmount;
});

module.exports = mongoose.model('tax', taxCalcSchema);