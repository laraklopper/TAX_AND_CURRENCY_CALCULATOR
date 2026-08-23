// curConvertSchema.js
const mongoose = require('mongoose');

/* Both currency codes are validated by format rather than against a list of
codes. The set of currencies the converter accepts is read from Frankfurter at
runtime, so a whitelist baked in here would drift away from it and could start
rejecting conversions the API had already quoted. /convert is what decides
whether a code is supported; the schema only insists the stored value is a
3-letter uppercase code. */
const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

const currencyConvertSchema = new mongoose.Schema({
    //===============NESTED FULL NAME OBJECT=========
    // Current logged in user fullName
    fullName : {
        //Field for user first name
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
    // ==============NESTED CURRENCY OBJECT=================
    currency: {
        // Field for base currency
        baseCurrency: {
            type: String,
            required: [true, 'base currency is required'],
            trim: true,
            uppercase: true,
            match: [CURRENCY_CODE_PATTERN, 'Base currency must be a 3-letter currency code'],
        },
        // Field for target currency
        targetCurrency:{
            type: String,
            required: [true, 'target currency is required'],
            trim: true,
            uppercase: true,
            match: [CURRENCY_CODE_PATTERN, 'Target currency must be a 3-letter currency code'],
        },
    },
    // Amount entered by the user in the base currency
    amount: {
        type: Number,
        required: [true, 'amount is required'],
        min: [0, 'Amount cannot be negative'],
    },
    // Exchange rate used for the conversion (target per base)
    rate:{
        type: Number,
        required: [true, 'rate is required'],
        min: [0, 'Rate cannot be negative'],
    }
},{ 
    timestamps:true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

// Virtual field returning the converted amount (amount * rate)
currencyConvertSchema.virtual('convertedAmount').get(function () {
    return this.amount * this.rate;
});

module.exports = mongoose.model('currency', currencyConvertSchema);