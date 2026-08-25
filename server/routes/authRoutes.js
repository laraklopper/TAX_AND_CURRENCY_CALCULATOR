require('dotenv').config()
const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const User = require('../models/userSchema')
const { checkPassword, checkAge, loginRateLimiter, registrationRateLimiter, forgotPasswordRateLimiter, resetPasswordLimiter } = require('./middleware')
const { sendPasswordResetEmail } = require('../utils/mailer')
const router = express.Router()

// Extract environmental variables (with safe fallbacks for local dev)
const rawSecretKey = process.env.JWT_SECRET_KEY;// JWT secret key
const rawExpiration = process.env.JWT_EXPIRATION;// JWT expiration time
const rawAlgorithm = process.env.JWT_ALGORITHM;// JWT algorithm
const secretKey = rawSecretKey || 'secretKey';// Fallback secret key
const expirationTime = rawExpiration || '12h';// Fallback expiration time
const jwtAlgorithm = rawAlgorithm || 'HS256';// Fallback JWT algorithm
const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';// Front end origin used to build the reset link
// How long a reset link stays valid for, in minutes
const resetTokenTtlMinutes = Number(process.env.RESET_TOKEN_TTL_MINUTES) || 60;

//=====CHECK IF ALL THE ENVIRONMENTAL VARIABLES A PRESENT=========
// Conditional rendering to check if the environmental variables are missing
if (!rawSecretKey) {
    console.warn("[WARNING: userRoute.js]: JWT_SECRET_KEY not set. Using fallback key.");// Log a warning message in the console for debugging purposes
}
// Conditional rendering to check if the environmental variables are missing
else if (!rawExpiration) {
    console.warn('[WARNING: userRoute.js] Missing exiration time, using fallback time')// Log a warning message in the console for debugging purposes
}
// Conditional rendering to check if the environmental variables are missing
else if (!rawAlgorithm) {
    console.warn('[WARNING: userRoute.js] Missing jwt algorithm, using fallback algorithm.'); // Log a warning message in the console for debugging purposes
}
//=============ROUTES================
// Use Plaintext passwords for development
/*──────────────────────────── HELPERS ──────────────────────────────*/
// Sign a JWT for the given user document
const signToken = (user) => {
    return jwt.sign(
        { userId: user._id, email: user.email, admin: user.admin },
        secretKey,
        { expiresIn: expirationTime, algorithm: jwtAlgorithm }
    );
}

/* Hash a reset token with SHA-256. Only the hash is stored on the user
document, so a leaked database cannot be used to reset anyone's password:
the raw token exists only in the email that was sent. SHA-256 (rather than
bcrypt) is enough here because the token is 256 bits of random data, not a
guessable, human-chosen secret. */
const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');


/*──────────────────────────── POST ROUTES ──────────────────────────────
    POST: Used to create a new resource/submit data to the database
 ─────────────────────────────────────────────────────────────────────────*/
// Send a POST request to the /auth/login route
router.post('/login', loginRateLimiter, async (req, res) => {
    try {
        const {email, password} = req.body || {};//Extract the usersername and password from the request body

        // Conditional rendering to check that both email and password are present
        if (!email || !password) {
            console.error('[ERROR: authRoutes.js, /login] email and password are required');
            return res.status(400).json({ message: 'email and password are required' });// Send a 400 (Bad Request) status code with a  JSON message
        }

        if (typeof email !== 'string' || typeof password !== 'string') {
            console.error('[ERROR: authRoutes.js, /login] username and password must be strings');
            return res.status(400).json({ message: 'username and password are required' });
        }

        // Password field is select:false on the schema, so it must be explicitly requested
        const user = await User.findOne({ email: email.toLowerCase().trim() })
            .select('+password')
            .exec();

        // Use Plaintext passwords for development - compare directly, no hashing
        if (!user || user.password !== password) {
            console.error('[ERROR: authRoutes.js, /login] Invalid email or password');
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = signToken(user);
        const userObj = user.toObject();
        delete userObj.password;// Never send the password back to the client

        console.log('[SUCCESS: authRoutes.js, /login] User logged in:', user.email);
        return res.status(200).json({ message: 'Login successful', token, user: userObj });
    } catch (error) {
        console.error('[ERROR: authRoutes.js, /login]', error.message);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
})

//Route to register a new user
//Send a POST request to the auth/register endpoint
// Use Plaintext passwords for development
router.post('/register', checkAge, checkPassword, registrationRateLimiter, async (req, res) => {
    try {
        const { fullName, email, password, dateOfBirth, address, admin } = req.body || {};

        if (!fullName || !fullName.firstName || !fullName.lastName || !email || !password || !dateOfBirth) {
            console.error('[ERROR: authRoutes.js, /register] Missing required registration fields');
            return res.status(400).json({ message: 'fullName, email, password and dateOfBirth are required' });
        }

        if (!address || !address.line1 || !address.city) {
            console.error('[ERROR: authRoutes.js, /register] Missing required address fields');
            return res.status(400).json({ message: 'address line1 and city are required' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingUser) {
            console.error('[ERROR: authRoutes.js, /register] Email already registered:', email);
            return res.status(409).json({ message: 'Email is already registered' });
        }

        // Use Plaintext passwords for development - stored as-is, no hashing
        const newUser = await User.create({
            fullName,
            email,
            password,
            dateOfBirth,
            address,
            admin: admin === true,
        });

        const token = signToken(newUser);
        const userObj = newUser.toObject();
        delete userObj.password;// Never send the password back to the client

        console.log('[SUCCESS: authRoutes.js, /register] User registered:', newUser.email);
        return res.status(201).json({ message: 'Registration successful', token, user: userObj });
    } catch (error) {
        // Mongoose validation errors (required fields, min/max length, etc.)
        if (error.name === 'ValidationError') {
            console.error('[ERROR: authRoutes.js, /register] Validation error:', error.message);
            return res.status(400).json({ message: error.message });
        }
        // Duplicate key error (unique email constraint)
        if (error.code === 11000) {
            console.error('[ERROR: authRoutes.js, /register] Duplicate email:', req.body?.email);
            return res.status(409).json({ message: 'Email is already registered' });
        }
        console.error('[ERROR: authRoutes.js, /register]', error.message);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
})

/*────────────────────── PASSWORD RESET ──────────────────────────────*/
// Route to request a password reset link
// Send a POST request to the /auth/forgotPassword endpoint
/* The response is deliberately identical whether or not the email is
registered. Confirming that an address exists would turn this endpoint into a
way of harvesting valid account emails. */
router.post('/forgotPassword', forgotPasswordRateLimiter, async (req, res) => {
    // Generic reply used for every outcome that is not a malformed request
    const genericResponse = { message: 'If that email is registered, a reset link has been sent.' };
    try {
        const { email } = req.body || {};// Extract the email from the request body

        // Conditional rendering to check that an email was supplied
        if (!email || typeof email !== 'string') {
            console.error('[ERROR: authRoutes.js, /forgotPassword] A valid email is required');
            return res.status(400).json({ message: 'A valid email address is required' });// Send a 400 (Bad Request) status code with a JSON message
        }

        const normalisedEmail = email.toLowerCase().trim();// Users are stored with a lowercased, trimmed email
        const user = await User.findOne({ email: normalisedEmail }).exec();

        /* Conditional rendering to check if the account exists. An unknown
        email still gets the success response, so the caller learns nothing. */
        if (!user) {
            console.warn('[WARN: authRoutes.js, /forgotPassword] Reset requested for an unknown email:', normalisedEmail);
            return res.status(200).json(genericResponse);// Send a 200 (OK) status code with the generic message
        }

        const resetToken = crypto.randomBytes(32).toString('hex');// The raw token: only ever sent by email
        // Store the hash and an expiry rather than the token itself
        user.resetPasswordToken = hashResetToken(resetToken);
        user.resetPasswordExpiry = new Date(Date.now() + resetTokenTtlMinutes * 60 * 1000);
        /* validateBeforeSave is off because password is select:false and so is
        absent from this document: a full validation would fail on the required
        password field even though the field is untouched. */
        await user.save({ validateBeforeSave: false });

        // The path here must match the front end route in App.js
        const resetUrl = `${clientUrl}/resetPassword/${resetToken}`;

        try {
            await sendPasswordResetEmail({
                to: user.email,//Recipient address
                resetUrl,//One time link to the reset form
                firstName: user.fullName?.firstName,//Used to greet the user by name
                expiryMinutes: resetTokenTtlMinutes,//Told to the user in the email body
            });
        } catch (mailError) {
            /* A failed send would otherwise leave a live token on the account
            that nobody can use, so it is cleared before reporting the failure. */
            user.resetPasswordToken = undefined;
            user.resetPasswordExpiry = undefined;
            await user.save({ validateBeforeSave: false });

            console.error('[ERROR: authRoutes.js, /forgotPassword] Failed to send reset email:', mailError.message);
            return res.status(502).json({ message: 'Could not send the reset email. Please try again later.' });// Send a 502 (Bad Gateway) status code with a JSON message
        }

        console.log('[SUCCESS: authRoutes.js, /forgotPassword] Reset link issued for:', user.email);
        return res.status(200).json(genericResponse);// Send a 200 (OK) status code with the generic message
    } catch (error) {
        console.error('[ERROR: authRoutes.js, /forgotPassword]', error.message);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
})

// Route to check whether a reset link is still usable before showing the form
// Send a GET request to the /auth/resetPassword/:token endpoint
router.get('/resetPassword/:token', resetPasswordLimiter, async (req, res) => {
    try {
        const { token } = req.params;

        // Conditional rendering to check that a token was supplied
        if (!token || typeof token !== 'string') {
            console.error('[ERROR: authRoutes.js, GET /resetPassword/:token] Missing reset token');
            return res.status(400).json({ valid: false, message: 'A reset token is required' });// Send a 400 (Bad Request) status code with a JSON message
        }

        // Match on the hash, and only accept a token that has not expired yet
        const user = await User.findOne({
            resetPasswordToken: hashResetToken(token),
            resetPasswordExpiry: { $gt: new Date() },
        }).exec();

        //Conditional rendering to check if the token matched a live reset
        if (!user) {
            console.warn('[WARN: authRoutes.js, GET /resetPassword/:token] Invalid or expired reset token');
            return res.status(400).json({// Send a 400 (Bad Request) status code with an error message
                valid: false,
                message: 'This password reset link is invalid or has expired. Please request a new one.'//JSON message
            });
        }

        console.log('[SUCCESS: authRoutes.js, GET /resetPassword/:token] Reset token is valid for:', user.email);
        return res.status(200).json({ valid: true, message: 'Reset token is valid' });// Send a 200 (OK) status code with a success message
    } catch (error) {
        console.error('[ERROR: authRoutes.js, GET /resetPassword/:token]', error.message);
        return res.status(500).json({ valid: false, message: 'Internal Server Error' });
    }
})

// Route to set a new password using the token from the reset email
// Send a POST request to the /auth/resetPassword/:token endpoint
// checkPassword enforces the strength rules on req.body.password
// Use Plaintext passwords for development
router.post('/resetPassword/:token', resetPasswordLimiter, checkPassword, async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body || {};// Extract the new password from the request body

        // Conditional rendering to check that a token was supplied
        if (!token || typeof token !== 'string') {
            console.error('[ERROR: authRoutes.js, POST /resetPassword/:token] Missing reset token');
            return res.status(400).json({ message: 'A reset token is required' });// Send a 400 (Bad Request) status code with a JSON message
        }

        /* The reset fields are select:false on the schema, and so is password,
        so all three must be explicitly requested before they can be updated. */
        const user = await User.findOne({
            resetPasswordToken: hashResetToken(token),
            resetPasswordExpiry: { $gt: new Date() },// An expired token is treated as no token at all
        })
            .select('+password +resetPasswordToken +resetPasswordExpiry')
            .exec();

        //Conditional rendering to check if the token matched a live reset
        if (!user) {
            console.warn('[WARN: authRoutes.js, POST /resetPassword/:token] Invalid or expired reset token');
            return res.status(400).json({// Send a 400 (Bad Request) status code with an error message
                message: 'This password reset link is invalid or has expired. Please request a new one.'//JSON message
            });
        }

        // Conditional rendering to reject a "reset" that changes nothing
        // Use Plaintext passwords for development - compare directly, no hashing
        if (user.password === password) {
            console.error('[ERROR: authRoutes.js, POST /resetPassword/:token] New password matches the current password');
            return res.status(400).json({// Send a 400 (Bad Request) status code with an error message
                message: 'New password must be different from your current password'//JSON message
            });
        }

        // Use Plaintext passwords for development - stored as-is, no hashing
        user.password = password;
        /* The token is single use: clearing both fields means the same link
        cannot be replayed to change the password again. */
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiry = undefined;
        await user.save();// save() runs the schema validators on the new password

        console.log('[SUCCESS: authRoutes.js, POST /resetPassword/:token] Password reset for:', user.email);
        return res.status(200).json({ message: 'Password reset successfully. You can now log in.' });// Send a 200 (OK) status code with a success message
    } catch (error) {
        // Mongoose validation errors (min/max length, etc.)
        if (error.name === 'ValidationError') {
            console.error('[ERROR: authRoutes.js, POST /resetPassword/:token] Validation error:', error.message);
            return res.status(400).json({ message: error.message });
        }
        console.error('[ERROR: authRoutes.js, POST /resetPassword/:token]', error.message);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
})

// ========EXPORT ROUTER============
module.exports = router;