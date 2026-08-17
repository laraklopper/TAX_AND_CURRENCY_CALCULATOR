require('dotenv').config()
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/userSchema')
const { checkPassword, checkAge } = require('./middleware')
const router = express.Router()

// Extract environmental variables (with safe fallbacks for local dev)
const rawSecretKey = process.env.JWT_SECRET_KEY;// JWT secret key
const rawExpiration = process.env.JWT_EXPIRATION;// JWT expiration time
const rawAlgorithm = process.env.JWT_ALGORITHM;// JWT algorithm
const secretKey = rawSecretKey || 'secretKey';// Fallback secret key
const expirationTime = rawExpiration || '12h';// Fallback expiration time
const jwtAlgorithm = rawAlgorithm || 'HS256';// Fallback JWT algorithm

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

/*──────────────────────────── POST ROUTES ──────────────────────────────
    POST: Used to create a new resource/submit data to the database
 ─────────────────────────────────────────────────────────────────────────*/
// Send a POST request to the /auth/login route
router.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body || {};

        if (!email || !password) {
            console.error('[ERROR: authRoutes.js, /login] email and password are required');
            return res.status(400).json({ message: 'email and password are required' });// Send a 400 (Bad Request) status code with a  JSON message
        }

        if (typeof email !== 'string' || typeof password !== 'string') {
            console.error('[ERROR: authRoutes.js, /login] username and password must be strings');
            return res.status(400).json({ message: 'username and password are required' });
        }

        // Password field is select:false on the schema, so it must be explicitly requested
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

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
router.post('/register', checkAge, checkPassword, async (req, res) => {
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

module.exports = router;