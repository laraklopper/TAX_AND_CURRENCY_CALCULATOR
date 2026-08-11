const mongoose = require('mongoose');

const currencyConvertSchema = new mongoose.Schema({
    // Field for current user fullName
    fullName : {
        firstName: {
            

        },
        lastName:{

        },
    },
    currency: {
        baseCurrency: {
            type: String,
            required: [true, 'base currency is required'],
            trim: true,

        },
        targetCurrency:{
            type: String,

        },
    },
    amount: {

    },
    rate:{

    }
},{timestamps:true,
    toJSON: {virtuals: true},
    toObject: {virtuals: true}
});

module.exports = mongoose.model('currency', currencyConvertSchema);