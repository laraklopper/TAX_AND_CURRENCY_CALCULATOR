// middleware.js
/* Load environment variables from a .env 
file using the dotenv package*/
require('dotenv').config();
// Import Required modules and packages
const jwt = require('jsonwebtoken');// Import the JSON Web Token (JWT) library
const bcrypt = require('bcrypt');
const User = require('../models/userSchema');
// Extract enviromental variables
const secretKey = process.env.JWT_SECRET_KEY || 'secretKey';

/*=============================
JWT VERIFICATION MIDDLEWARE
 ====================================*/ 
//Middleware function to check and verify a JWT token from the 'token' header
const checkJwtToken = (req, res, next) => {
    console.log('[DEBUG: middleware.js] [checkJwtToken] Middleware triggered');// Log a message in the console for debugging purposes
    try {
        let authHeader = req.headers.authorization || '';// Retrieve the authorization header from the request

        /*Conditional rendering to check if the header exists 
        and follows "Bearer <token>" format*/
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.warn('[WARN: middleware.js ,checkJwtToken] Authorization header missing or malformed');// Log a warning message in the console for debugging purposes
            return res.status(401).json(// Respond with a 401 (Unauthorised) status code and an error message
                { 
                    success: false,
                    message: 'Access denied. No token provided.' 
                });
        }

        const token = authHeader.split(' ')[1];// Extract the actual token part after "Bearer "

        //Conditional rendering to check if the token is present
        if (!token) {// Extra safety check: ensure token string is not empty
            console.warn('[WARN: middleware.js, checkJwtToken] Token is empty after split');// Log a warning message in the console for debugging purposes
            return res.status(401).json({// Respond with a 401 (Unauthorised) status code and an error message
                success: false,//Success status
                message: 'Access denied. No token provided.'//JSON message
            });
        }

        const decoded = jwt.verify(token, secretKey)// Verify and decode the JWT using the secret key
        req.user = decoded;// Attach decoded user information to the request object
        // This allows routes to access req.user.userId, req.user.isAdmin, etc.

        console.log('[SUCCESS: middleware.js, checkJwtToken ]: Token provided');//Log a message in the console for debugging purposes
        next()// Call the next middleware or route handler


    } catch (error) {
        console.error('[ERROR: middleware.js] No token attatched to the request', error.message);//Log an error message in the console for debugging purposes
       
        // Provide specific error messages based on JWT error type
        if (error.name === 'TokenExpiredError') {
            console.error('[ERROR: middleware.js, checkJwtToken]: Token expired');
            return res.status(401).json({ // Respond with a 401 (Unauthorized) status code with an error message 
                success: false, //Success status
                message: 'Token has expired. Please login again.'//JSON message
            });
        } else if (error.name === 'JsonWebTokenError') {
            console.error('[ERROR: middleware.js, checkJwtToken]: Invalid token');// Log an error message in the console for debugging purposes
            return res.status(401).json({ // Respond with a 401 (Unauthorized) status code with an error message 
                success: false, //Success Status
                message: 'Invalid token. Please login again.'//JSON message
            });
        }
        return res.status(401).json({// Respond with a 401 (Unauthorized) status code with an error message 
            success: false, //Success status
            message: 'Invalid or expired token.'//JSON message
        });
    }
}

/*=============================
ADMIN AUTHORISATION MIDDLEWARE
 ====================================*/
/*Middleware function to check that the requester has admin privileges.
Must run AFTER checkJwtToken, which attaches the decoded token to req.user.
The admin flag is re-read from the database rather than trusted from the token:
a token signed before the user's privileges changed would otherwise still grant
admin access until it expired.*/
const checkAdmin = async (req, res, next) => {
    console.log('[DEBUG: middleware.js] [checkAdmin] Middleware triggered');// Log a message in the console for debugging purposes
    try {
        const userId = req.user?.userId;// The token payload signed in authRoutes.js uses `userId`

        //Conditional rendering to check that checkJwtToken ran before this middleware
        if (!userId) {
            console.warn('[WARN: middleware.js, checkAdmin] No user attached to the request');// Log a warning message in the console for debugging purposes
            return res.status(401).json({// Respond with a 401 (Unauthorised) status code and an error message
                success: false,//Success status
                message: 'Access denied. No token provided.'//JSON message
            });
        }

        const requester = await User.findById(userId).select('admin').exec();

        //Conditional rendering to check if the requester still exists
        if (!requester) {
            console.error('[ERROR: middleware.js, checkAdmin] User not found with ID:', userId);// Log an error message in the console for debugging purposes
            return res.status(401).json({// Respond with a 401 (Unauthorised) status code and an error message
                success: false,//Success status
                message: 'Invalid token. Please login again.'//JSON message
            });
        }

        //Conditional rendering to check if the requester has admin privileges
        if (!requester.admin) {
            console.warn('[WARN: middleware.js, checkAdmin] Non-admin user attempted an admin action:', userId);// Log a warning message in the console for debugging purposes
            return res.status(403).json({// Respond with a 403 (Forbidden) status code and an error message
                success: false,//Success status
                message: 'Access denied. Admin privileges are required.'//JSON message
            });
        }

        req.isAdmin = true;// Flag the request as made by an admin for the route handler
        console.log('[SUCCESS: middleware.js, checkAdmin] Admin access granted:', userId);//Log a message in the console for debugging purposes
        next()// Call the next middleware or route handler
    } catch (error) {
        console.error('[ERROR: middleware.js, checkAdmin]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return 500 (Internal Server Error) response
    }
}

/*Middleware to hash password before registration or password changes
 * Expects req.body.password to be present*/
// Use Plaintext passwords for development
const hashPassword = async (req, res, next) => {
    try {
        const {password, newPassword} = req.body || {};// Extract the password and newPassword from the request body
        //Conditional rendering for password hashing
        // Hash password for registration/login
        if (password && !newPassword) {
             const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)// Generate a secure hash of the password using bcrypt
            req.body.password = hashedPassword; // Replace the plain-text password with the hashed password
            console.log('[INFO: middleware.js, hashPassword] Password hashed for registration/login'); // Log a message in the console for debugging purposes
        }
        // Conditional rendering to check if this is a password update request
        // Hash new password for password changes
        if (newPassword) {
            const hashedNewPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);// Generate a secure hash of the new password
            req.body.newPassword = hashedNewPassword;// Replace the plain-text new password with its hash
            console.log('[INFO: hashPassword] New password hashed for update');// Log a message in the console for debugging purposes
        }

        next();// Call the next middleware or route handler
    } catch (error) {
        console.error('[ERROR: middleware.js, hashPassword] Error hashing password:', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ // Return a 500 (Internal Server Error) status code with a message
            message: 'Error processing password' //Message
        });
    }
}
/*Middleware to ensure that the password has a minimum of 
eight characters and at least one special character*/
const checkPassword = (req, res, next) => {
    console.log('[DEBUG: middleware.js checkPassword] Middleware triggered');// Log message in the console for debugging purposes

    // Support both registration (password) and password change (newPassword)
    const pwd = req.body?.password ?? req.body?.newPassword;

    //Conditional rendering to check if password input is provided
    if (typeof pwd !== 'string') {
        console.error('[ERROR: middleware.js, checkPassword]: Password is required');// Log a error message in the console for debugging purposes
        return res.status(400).json({//Return a 400 (Bad Request) status code with a error message
             message: 'Password is required.' //Error Message
            });
    }
    // Regular expression used to validate password strength
    const passwordRegex = /^(?=.*[!@#$%^&*(),.?":{}|<>])[A-Za-z\d!@#$%^&*(),.?":{}|<>]{8,}$/;

    //Conditional rendering to test the password against the regular expression
    if (!passwordRegex.test(pwd)) {
        console.error('[ERROR: middleware.js, checkPassword] Weak password');//Log an error message in the console for debugging purposes
        return res.status(400).json(// Respond with a 400 (Bad Request) status and an error message
            { message: 'Password must be at least 8 characters long and contain one special character.' }//Error message
        );
    }
    return next();// Call the next middleware or route handler
}
/*====================================
AGE VALIDATION MIDDLEWARE
========================*/
/*Middleware function to check that user age
All users must be 16 or older; admin users must be 18 or older*/
const checkAge = (req, res, next) => {
    console.log('[DEBUG: middleware.js checkAge] Middleware triggered');// Log message in the console for debugging purposes
    try {
        const { dateOfBirth, admin } = req.body || {};// Extract the date of birth and admin flag from the request body
        console.log('[DEBUG: middleware.js checkAge] Received date of birth:', dateOfBirth);// Log message in the console for debugging purposes

        // Conditional rendering to check if the date of birth is provided in the request body
        if (!dateOfBirth) {
            console.error(`[ERROR: middleware.js, checkAge] Date of Birth is required`);// Log an error message in the console for debugging purposes
            return res.status(400).json({// Respond with a 400 (Bad Request) status if underage
                message: 'Date of Birth is required'//Error Message
            });
        }


        const dob = new Date(dateOfBirth);// Convert string to JavaScript Date object
        //Conditional rendering to check if date conversion succeeded
        if (Number.isNaN(dob.getTime())) {
            console.error(`[ERROR: middleware.js, checkAge] Invalid Date of Birth format`);// Log a error message in the console for debugging purposes
            return res.status(400).json({ message: 'Invalid Date of Birth format.' });// Respond with a 400 (Bad Request) status if date of Birth is invalid
        }
        const now = new Date();
        if (dob > now) {
            console.error(`[ERROR: middleware.js, checkAge]:Date of Birth cannot be in the future.`); // Log a error message in the console for debugging purposes
            // Respond with a 400 (Bad Request) status if future date
            return res.status(400).json({
                message: 'Date of Birth cannot be in the future.'//Error message
            });
        }
        // Calculate the user's age in years
        const years =
            now.getFullYear() -
            dob.getFullYear() -
            (
                now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate())
                    ? 1 // Birthday has not occurred yet this year
                    : 0 // Birthday has already occurred this year
            );

        // Determine the minimum required age
        const MIN_AGE = admin === true ? 18 : 16; // Admins must be 18+, regular users must be 16+
        // Block registration if user is below the minimum age
        if (years < MIN_AGE) {
            console.error(// Log a error message in the console for debugging purposes
                `[ERROR: middleware.js, checkAge]: You must be at least ${MIN_AGE} years old to register as ${admin === true ? 'an admin' : 'a user'}.`
            );
            return res.status(400).json({ // Respond with a 400 (Bad Request) status
                message: `You must be at least ${MIN_AGE} years old to register as ${admin === true ? 'an admin' : 'a user'}.` //Error Message
            });
        }

        // If age validation passes, continue
        next();// Call the next middleware or route handler
    } catch (error) {
        console.error('[ERROR: middleware.js checkAge]', error.message);// Log a error message in the console for debugging purposes
        return res.status(500).json({ message: 'Internal Server Error' });// Return 500 (Internal Server Error) response
    }
}
module.exports = {checkJwtToken, checkAdmin, checkPassword, checkAge, hashPassword}