//userRoutes.js
/* Load environment variables from a .env 
file using the dotenv package*/
require('dotenv').config();
const express = require('express');
const router = express.Router()

const User = require('../models/userSchema');
const { checkJwtToken } = require('./middleware');

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
        const userId = req.user.id;
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
router.patch('/editPassword', async (req, res) => {
    
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