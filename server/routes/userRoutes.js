//userRoutes.js
/* Load environment variables from a .env 
file using the dotenv package*/
require('dotenv').config();
const express = require('express');
const router = express.Router()

const User = require('../models/userSchema');
const { checkJwtToken, checkPassword } = require('./middleware');

// ======ROUTES=====================
/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/
// Send a get request to /users/fetchUsers endpoint to fetch all users
router.get('/fetchUsers', checkJwtToken, async (req, res) => {
    try {
        const users = await User.find()
        .select('-password')
        .exec()

        console.log(`[SUCCESS: userRoutes.js, GET /fetchUsers] Returned ${users.length} users`);

        return res.status(200).json(users);
        
    } catch (error) {
        console.error('[ERROR: userRoutes.js, GET /] Error fetching users:', error.message);
        return res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
    
})
// send a GET request to /users/me endpoint to fetch current user data
router.get('/me', checkJwtToken, async (req, res) => {
    try {
        const userId = req.user.userId;// The token payload signed in authRoutes.js uses `userId`
        const user = await User.findById(userId)
        .select('-password')
        .exec();

        //Conditional rendering to check if user is found
        if (!user) {
            console.error('User not found with ID:', userId);
            return res.status(404).json({ error: 'User not found' }); 
        }

        console.log(`[RESPONSE: userRoutes]`, user);
        return res.status(200).json(user); 
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({
            success: false, 
            error: 'An error occurred while fetching the current user'});
    }
})
/*──────────────────────────── PATCH ROUTES ───────────────────────────────────
   PATCH: UPDATE — Used to partially update information in the database
────────────────────────────────────────────────────────────────────────────────*/
// PATCH /users/editUser
router.patch('/editUser', async (req, res) => {
    
})
// PATCH /users/editPassword
// checkJwtToken identifies the user from the token; checkPassword enforces
// strength rules on req.body.newPassword before the handler runs.
// Use Plaintext passwords for development
router.patch('/editPassword', checkJwtToken, checkPassword, async (req, res) => {
    try {
        const userId = req.user.userId;// The token payload signed in authRoutes.js uses `userId`
        const { currentPassword, newPassword } = req.body || {};

        // Conditional rendering to check that both passwords were supplied
        if (!currentPassword || !newPassword) {
            console.error('[ERROR: userRoutes.js, PATCH /editPassword] currentPassword and newPassword are required');
            return res.status(400).json({// Send a 400 (Bad Request) status code with an error message
                success: false,
                message: 'currentPassword and newPassword are required'//JSON message
            });
        }

        // Conditional rendering to check that both passwords are strings
        if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
            console.error('[ERROR: userRoutes.js, PATCH /editPassword] Passwords must be strings');
            return res.status(400).json({// Send a 400 (Bad Request) status code with an error message
                success: false,
                message: 'currentPassword and newPassword must be strings'//JSON message
            });
        }

        // Conditional rendering to reject a "change" that changes nothing
        if (currentPassword === newPassword) {
            console.error('[ERROR: userRoutes.js, PATCH /editPassword] New password matches the current password');
            return res.status(400).json({// Send a 400 (Bad Request) status code with an error message
                success: false,
                message: 'New password must be different from the current password'//JSON message
            });
        }

        // Password field is select:false on the schema, so it must be explicitly requested
        const user = await User.findById(userId).select('+password');

        //Conditional rendering to check if the user still exists
        if (!user) {
            console.error('[ERROR: userRoutes.js, PATCH /editPassword] User not found with ID:', userId);
            return res.status(404).json({// Send a 404 (Not Found) status code with an error message
                success: false,
                message: 'User not found'//JSON message
            });
        }

        // Use Plaintext passwords for development - compare directly, no hashing
        if (user.password !== currentPassword) {
            console.error('[ERROR: userRoutes.js, PATCH /editPassword] Incorrect current password for user:', userId);
            return res.status(401).json({// Send a 401 (Unauthorized) status code with an error message
                success: false,
                message: 'Current password is incorrect'//JSON message
            });
        }

        // Use Plaintext passwords for development - stored as-is, no hashing
        user.password = newPassword;
        await user.save();// save() runs the schema validators on the new password

        console.log('[SUCCESS: userRoutes.js, PATCH /editPassword] Password updated for user:', userId);
        return res.status(200).json({// Send a 200 (OK) status code with a success message
            success: true,
            message: 'Password changed successfully.'//JSON message
        });
    } catch (error) {
        // Mongoose validation errors (min/max length, etc.)
        if (error.name === 'ValidationError') {
            console.error('[ERROR: userRoutes.js, PATCH /editPassword] Validation error:', error.message);
            return res.status(400).json({ success: false, message: error.message });
        }
        console.error('[ERROR: userRoutes.js, PATCH /editPassword]', error.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
})
/*──────────────────────────── DELETE ROUTES ───────────────────────────────────
    DELETE: Used to remove an item from the database
 ────────────────────────────────────────────────────────────────────────────────*/
 //Route to send a DELETE request to the /deleteUser/:id endpoint
 router.delete('/deleteUser/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const removedUser = await User.findByIdAndDelete(id);

        if (!removedUser) {
            console.error('[ERROR: userRoutes.js, /deleteUser/:id] : User not found');
             return res.status(404).json({//Send a 404(Not Found) status response with an error message in JSON response
                success: false, 
                message: 'User not found' //JSON message
            });
        }

        console.log(`[SUCCESS: userRoutes.js, DELETE /deleteUser/:id] Deleted user: ${id}`);
        return res.status(200).json({
             success: true, 
             message: 'User deleted successfully.' 
            });
    } catch (error) {
        console.error('Error deleting user:', error.message);
        res.status(500).json({ error: 'Failed to delete User' });
    }
 })
// =====================
module.exports = router