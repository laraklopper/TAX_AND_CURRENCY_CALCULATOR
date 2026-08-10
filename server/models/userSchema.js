const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: {
        firstName: {
            type: String,
            required: [true,'first Name is required']

        },
        lastName: {
            type: String,
            required: [true, 'Last Name is required']
        },
    },
    email:{
        type: String,
        

    },
    dateOfBirth:{
        type: Date,

    },
    password: {
        type: String,
        required:[true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        maxlength: [1024, 'Password cannot exceed 1024 characters'],
        select: false,
    },
    // ========PASSWORD RESET FIELDS============
    resetPasswordToken:{
        
    },
    // Field for the password expiry time
    resetPasswordExpiry:{

    }
},{timestamps:true});

module.exports = mongoose.model('user', userSchema)