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

//================================================

router.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body || {};

        if (!email || !password) {
            console.error('[ERROR: authRoutes.js, /login] email and password are required');
            return res.status(400).json({ message: 'email and password are required' });// Send a 400 (Bad Request) status code with a  JSON message
        }

        if (typeof email !== 'string' || typeof password !== 'string') {
            console.error('[ERROR: authRoutes.js, /login] email and password must be strings');
            return res.status(400).json({ message: 'email and password are required' });
        }

          //Find the user by username and include the password field
        const user = await User.findOne({ username: username.trim() })
            .select('+password')//Include the password
            .exec();//Execute the query

        // Conditional rendering to check if user exists
        // Use the same status/message as an incorrect password so usernames cannot be enumerated
        if (!user) {
            console.error('[ERROR: authRoutes.js, /login] User not found');// Log an error message in the console for debugging purposes
            return res.status(401).json({// Send a 401 (Unauthorized) status code with a JSON message
                 message: 'Invalid credentials' //JSON message
                });
        }

            if (password !== user.password) {
            console.error('[ERROR: authRoutes.js, /login] Incorrect password');
            return res.status(401).json({ message: 'Invalid credentials' });
          }
          const isAdmin = user.admin === true;// Determine whether the logged-in user is an administrator
        
        // Generate a JSON Web Token (JWT) for the authenticated user
        const jwtToken = jwt.sign(
            {
                id: user._id,// Set the user id in the token payload
                isAdmin// Store the user's admin status in the token payload
            },
            secretKey,// Use the secret key to sign the token
            { 
                expiresIn: expirationTime, // Set the token expiration time
                algorithm: jwtAlgorithm // Set the JWT algorithm
            }
        );

        // Log a successful login to the server console for debugging and auditing purposes
        console.log('[INFO: authRoutes.js, /login] User logged in:',
            {
                userId: user._id,         // Unique MongoDB ObjectId of the authenticated user
                username: user.username   // Username of the authenticated user
            }
        );

        
       // Return the JWT token and user information to the client
        return res.status(200).json({// Send a 200 OK status code with the JWT token and user details
            token: jwtToken,         // Authentication token
            userId: user._id,        // User's unique ID
            fullName: user.fullName, // User's full name
            isAdmin,                 // Indicates whether the user is an administrator
        });

    } catch (error) {
         console.error('[ERROR: authRoutes.js, /login] Login Failed:', error.message);// Log an error message in the console for debugging purposes
        res.status(500).json({ success: false, message: 'Internal Server Error' });// Send a 500 Internal Server Error status code with a message
    }
})

//Route to register a new user
//Send a POST request to the auth/register endpoint
router.post('/register', checkPassword , checkAge, registrationRateLimiter, hashPassword, async (req, res) => {
    console.log(req.body);//Log the request body in the console for debugging purposes
    try {
        const { // Extract incoming data from the request body
            username,
            fullName = {},
            email,
            dateOfBirth,
            preferences = {},
            admin,
            password,
        } = req.body || {};

        const { firstName, lastName } = fullName || {};// Exract the firstName and lastName from fullName
        const { currency, timezone } = preferences || {};//Extract email and contactNumber from contactDetails

        // Conditional rendering to check for required fields
        const missingFields = [];// Create an empty array to store the names of any required fields that are missing
        


/*Conditional rendering to check for required fields 
if the field is missing add it to the missingFields array*/
        if (!username) missingFields.push('Username');// Check if the username was provided; 
        if (!firstName) missingFields.push('First Name');// Check if the user's first name was provided;
        if (!lastName) missingFields.push('Last Name');// Check if the user's last name was provided;
        if (!email) missingFields.push('Email');// Check if the email address was provided;
        if (!dateOfBirth) missingFields.push('Date of Birth');// Check if the date of birth was provided; 
        if (!password) missingFields.push('Password');// Check if the password was provided;

         // Conditional rendering to check for missing fields
        if (missingFields.length > 0) {
            console.error(`[ERROR: authRoutes.js, /register] Missing required fields: ${missingFields.join(', ')}`);// Log an error message in the console for debugging purposes
            return res.status(400).json(// Send a 400 (Bad Request) status code with a  JSON message
                { message: `All required fields must be provided. Missing: ${missingFields.join(', ')}` });
        }
        /* PLAINTEXT STORAGE EQUIVALENT  (reference only):
         password: password  // store the raw plaintext password as-is
          req.body.password has already been overwritten with a bcrypt hash by the 
         hashPassword middleware before this handler runs. */
        // Create and save a new user instance
        const newUser = new User({
            username,
            fullName,
            email,
            preferences: {
                currency: currency || 'ZAR',
                timezone: timezone || 'Africa/Johannesburg',
            },
            admin: admin === true,
            dateOfBirth,
            password: password,
        });

        
        const savedUser = await newUser.save();// Save the new user to the database
        console.log('[INFO: authRoutes.js, /register] New user saved:', savedUser._id);//Log the saved userId in the consike f

          // Generate JWT Token
        const token = jwt.sign(
            {
                id: savedUser._id, // Set the user id in the token payload
                isAdmin: savedUser.admin === true,
            },
            secretKey,// Use the secret key from .env file to sign the token
            { // Set the token options
                expiresIn: expirationTime, // Set the token expiration time
                algorithm: jwtAlgorithm // Set the JWT algorithm
            }
        );

        return res.status(201).json({// Send a 201 (Created) status code with the JWT token and user details
            token,
            userId: savedUser._id,
            fullName: savedUser.fullName,
        });

    } catch (error) {
        // Handle duplicate values such as duplicate username or email
        if (error.code === 11000) {
            const field = Object.keys(error.keyValue || {})[0] || 'field';// Get the duplicate field name (e.g. username or email)
            console.error(`[ERROR: authRoutes.js, /register] Duplicate ${field}:`, error.message);// Log an error message in the console for debugging purposes
            return res.status(409).json({ // Send a 409 (conflict) response with a JSON message
                message: `An account with that ${field} already exists.` //JSON message
            });
        }
        console.error('[ERROR: authRoutes.js, /register]', error.message);// Log an error message in the console for debugging purposes
        res.status(500).json({// Send a 500 Internal Server Error status code with a message
             success: false, //Success status
             message: 'Internal Server Error' //JSON message
            });
    }
});


module.exports = router;