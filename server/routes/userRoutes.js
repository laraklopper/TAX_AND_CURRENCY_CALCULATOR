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
// =====================
module.exports = router