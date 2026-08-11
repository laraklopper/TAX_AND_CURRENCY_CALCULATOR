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

        },
        targetCurrency:{
            

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