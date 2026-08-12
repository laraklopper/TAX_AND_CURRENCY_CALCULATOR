// interestSchena.js
const mongoose = require('mongoose');

const interestSchema = new mongoose.Schema({
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
},{
    timestamps:true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

// Virtual field returning the duration converted to years
interestSchema.virtual('durationInYears').get(function () {
    return this.time.unit === 'months' ? this.time.duration / 12 : this.time.duration;
});

// Virtual field returning the interest earned, based on interestType
interestSchema.virtual('interestAmount').get(function () {
    const rate = this.interestRate / 100;
    const years = this.durationInYears;

    if (this.interestType === 'compound') {
        return this.principal * Math.pow(1 + rate / this.compoundFrequency, this.compoundFrequency * years) - this.principal;
    }

    return this.principal * rate * years;
});

// Virtual field returning the principal plus interest earned
interestSchema.virtual('totalAmount').get(function () {
    return this.principal + this.interestAmount;
});

module.exports = mongoose.model('interest', interestSchema);
