require('dotenv').config()
const express = require('express');
const User = require('../models/userSchema')
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

        
    } catch (error) {
        
    }
})

//Route to register a new user
//Send a POST request to the auth/register endpoint
router.post('/register', async () => {
    try {
        
    } catch (error) {
        
    }
})

module.exports = router;