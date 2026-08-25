//userRoutes.js
/* Load environment variables from a .env 
file using the dotenv package*/
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router()

const User = require('../models/userSchema');
const { checkJwtToken, checkAdmin, checkPassword, generalRateLimiter, passwordUpdateRateLimiter } = require('./middleware');

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
// checkJwtToken identifies the user from the token, so a user can only ever
// edit their own profile (the id is never taken from the request body).
// Only the details supplied in the body are updated: any field left out or
// sent blank keeps the value already stored on the user.
router.patch('/editUser', checkJwtToken, generalRateLimiter, async (req, res) => {
    try {
        const userId = req.user.userId;// The token payload signed in authRoutes.js uses `userId`
        const { fullName, email, address } = req.body || {};

        // Return a trimmed string, or undefined when the value is missing/blank
        const cleanText = (value) =>
            (typeof value === 'string' && value.trim()) || undefined;

        /* Build the update with dot-notation keys so that sending one nested
        field (e.g. address.city) does not wipe the rest of the nested object */
        const updates = {};

        const firstName = cleanText(fullName?.firstName);
        if (firstName) updates['fullName.firstName'] = firstName;

        const lastName = cleanText(fullName?.lastName);
        if (lastName) updates['fullName.lastName'] = lastName;

        const newEmail = cleanText(email);
        if (newEmail) updates.email = newEmail.toLowerCase();

        const line1 = cleanText(address?.line1);
        if (line1) updates['address.line1'] = line1;

        const line2 = cleanText(address?.line2);
        if (line2) updates['address.line2'] = line2;

        const city = cleanText(address?.city);
        if (city) updates['address.city'] = city;

        const province = cleanText(address?.province);
        if (province) updates['address.province'] = province;

        // Conditional rendering to check that at least one detail was supplied
        if (Object.keys(updates).length === 0) {
            console.error('[ERROR: userRoutes.js, PATCH /editUser] No details supplied to update');
            return res.status(400).json({// Send a 400 (Bad Request) status code with an error message
                success: false,
                message: 'At least one detail is required to update the profile'//JSON message
            });
        }

        /* Email is unique on the schema: check it is not already taken by
        another user so the client gets a clear message instead of a 500 */
        if (updates.email) {
            const emailOwner = await User.findOne({ email: updates.email })
                .select('_id')
                .exec();

            if (emailOwner && String(emailOwner._id) !== String(userId)) {
                console.error('[ERROR: userRoutes.js, PATCH /editUser] Email already in use:', updates.email);
                return res.status(409).json({// Send a 409 (Conflict) status code with an error message
                    success: false,
                    message: 'That email address is already in use'//JSON message
                });
            }
        }

        // runValidators applies the schema rules (lengths, email format, province enum)
        // context: 'query' lets the custom validators run on an update
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, runValidators: true, context: 'query' }
        )
            .select('-password')
            .exec();

        //Conditional rendering to check if the user still exists
        if (!updatedUser) {
            console.error('[ERROR: userRoutes.js, PATCH /editUser] User not found with ID:', userId);
            return res.status(404).json({// Send a 404 (Not Found) status code with an error message
                success: false,
                message: 'User not found'//JSON message
            });
        }

        console.log(`[SUCCESS: userRoutes.js, PATCH /editUser] Updated ${Object.keys(updates).join(', ')} for user: ${userId}`);
        return res.status(200).json({// Send a 200 (OK) status code with the updated user
            success: true,
            message: 'Profile updated successfully.',//JSON message
            user: updatedUser// Returned so the client can refresh the details on screen
        });
    } catch (error) {
        // Mongoose validation errors (min/max length, email format, province enum)
        if (error.name === 'ValidationError') {
            console.error('[ERROR: userRoutes.js, PATCH /editUser] Validation error:', error.message);
            return res.status(400).json({ success: false, message: error.message });
        }
        // Duplicate key error raised by the unique index on email
        if (error.code === 11000) {
            console.error('[ERROR: userRoutes.js, PATCH /editUser] Duplicate email:', error.message);
            return res.status(409).json({ success: false, message: 'That email address is already in use' });
        }
        console.error('[ERROR: userRoutes.js, PATCH /editUser]', error.message);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
})
// PATCH /users/editPassword
// checkJwtToken identifies the user from the token; checkPassword enforces
// strength rules on req.body.newPassword before the handler runs.
// Use Plaintext passwords for development
router.patch('/editPassword', checkJwtToken, checkPassword, passwordUpdateRateLimiter, async (req, res) => {
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
 // checkJwtToken identifies the requester from the token; checkAdmin confirms
 // the requester still holds admin privileges in the database.
 // Admin users cannot be removed, and an admin cannot delete their own account.
 router.delete('/deleteUser/:id', checkJwtToken, checkAdmin, async (req, res) => {
    try {
        const {id} = req.params;
        const requesterId = req.user.userId;// The token payload signed in authRoutes.js uses `userId`

        /* Conditional rendering to check the id is a valid ObjectId: findById
        raises a CastError on a malformed id, which would return a 500 */
        if (!mongoose.Types.ObjectId.isValid(id)) {
            console.error('[ERROR: userRoutes.js, DELETE /deleteUser/:id] Invalid user id:', id);
            return res.status(400).json({//Send a 400 (Bad Request) status response with an error message in JSON response
                success: false,
                message: 'Invalid user id' //JSON message
            });
        }

        // An admin cannot delete the account they are logged in with
        if (String(id) === String(requesterId)) {
            console.error('[ERROR: userRoutes.js, DELETE /deleteUser/:id] Admin attempted to delete their own account:', id);
            return res.status(403).json({//Send a 403 (Forbidden) status response with an error message in JSON response
                success: false,
                message: 'You cannot delete the account you are logged in with' //JSON message
            });
        }

        /* Fetch the user first so the admin flag can be checked before the
        record is removed */
        const user = await User.findById(id).select('admin email').exec();

        //Conditional rendering to check if the user exists
        if (!user) {
            console.error('[ERROR: userRoutes.js, /deleteUser/:id] : User not found');
             return res.status(404).json({//Send a 404(Not Found) status response with an error message in JSON response
                success: false,
                message: 'User not found' //JSON message
            });
        }

        // Admin users cannot be removed
        if (user.admin) {
            console.error('[ERROR: userRoutes.js, DELETE /deleteUser/:id] Attempted to delete an admin user:', id);
            return res.status(403).json({//Send a 403 (Forbidden) status response with an error message in JSON response
                success: false,
                message: 'Admin users cannot be removed' //JSON message
            });
        }

        const removedUser = await User.findByIdAndDelete(id).select('-password').exec();

        //Conditional rendering to check the user was not already deleted by another request
        if (!removedUser) {
            console.error('[ERROR: userRoutes.js, /deleteUser/:id] : User not found');
             return res.status(404).json({//Send a 404(Not Found) status response with an error message in JSON response
                success: false,
                message: 'User not found' //JSON message
            });
        }

        console.log(`[SUCCESS: userRoutes.js, DELETE /deleteUser/:id] Deleted user: ${id} by admin: ${requesterId}`);
        return res.status(200).json({
             success: true,
             message: 'User deleted successfully.',
             userId: id// Returned so the client can drop the user from the list on screen
            });
    } catch (error) {
        console.error('[ERROR: userRoutes.js, DELETE /deleteUser/:id] Error deleting user:', error.message);
        return res.status(500).json({ success: false, message: 'Failed to delete User' });
    }
 })
 
// =======EXPORT THE ROUTER==============
module.exports = router;// Export the router to be used in other parts of the application