// userSchema.js
const mongoose = require('mongoose');
const { provinces } = require('../dataArrays/locations');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema({
    //=================NESTED FULL NAME OBJECT=======================
    // Stores the user's first and last name inside one object.
    fullName: {
        firstName: {
            type: String,
            required: [true,'first Name is required'],
            trim: true,
            minlength: [2, 'First name must be at least 2 characters long'],
            maxlength: [50, 'First name cannot exceed 50 characters'],
        },
     // Field for lastName
        lastName: {
            type: String,
            required: [true, 'Last Name is required'],
            trim: 'true',
            minlength: [2, 'Last name must be at least 2 characters long'],
            maxlength: [50, 'Last name cannot exceed 50 characters'],
        },
    },
    // Field for user email (allow email address for any country)
    // Required for user login
    email:{
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
    },
    /*All users must be 18 years or older*/
    dateOfBirth: {
        type: Date,
        required: [true, 'Date of Birth is required'],
         validate: {
            validator: function (v) {
                return v instanceof Date && !isNaN(v.getTime()) && v < new Date();
            },
            message: 'Date of birth must be in the past'// Error message shown when validation fails
        }
    },
    //===========NESTED ADDRESS OBJECT=========
    address: {
        //Street
        line1:{
            type: String,
            trim: true,
            required: [true, 'Street address is required'],
            minlength: [2, 'Address line 1 must be at least 2 characters long'],
            maxlength: [100, 'Address line 1 cannot exceed 100 characters'],
        },
        // Complex/building/floor/etc. (optional)
        line2:{
            type: String,
            trim: true,
            minlength: [2, 'Line 2 must be at least 2 characters long'],
            maxlength: [100, 'Line 2 cannot exceed 100 characters'],
        },
        //Field for city or town
        city: {
            type: String,
            required: [true, 'City or town name is required'],
            trim: true,
            minlength: [2, 'City or town name must be at least 2 characters long'],
            maxlength: [50, 'City or town name cannot exceed 50 characters']
        },
        //Field for province or region
        province: {
            type: String,
            trim: true,
            enum: provinces,
            minlength: [2, 'Province or region name must be at least 2 characters long'],
            maxlength: [50, 'Province or region name cannot exceed 50 characters']
        },
    },
    // Field for Password (required for login)
    // Password hashing is done in registration request middleware (not used during dev)
    password: {
        type: String,
        required:[true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters long'],
        maxlength: [1024, 'Password cannot exceed 1024 characters'],
        select: false,
    },
    // Role-based access control: true = admin privileges, false/undefined = regular user
    // Admin users must be 21 years or older
    admin:{
        type: Boolean,
        default: false,
    },
    // ========PASSWORD RESET FIELDS============
    resetPasswordToken:{
        type: String,
        select: false,
    },
    // Field for the password expiry time
    resetPasswordExpiry:{
        type: Date,
        select: false,
    }
},{
    timestamps:true,
    toJSON: {virtuals: true},
    toObject: {virtuals:true}
});

module.exports = mongoose.model('user', userSchema)