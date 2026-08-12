// app.js
require('dotenv').config()
//  Custom security utility
const ensureJwtSecret = require('./config/ensureJwtSecret')
ensureJwtSecret()// Ensures JWT secret key before anything else loads
// IMPORT REQUIRED MODULES AND PACKAGES
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
// Import connection function
const connectDB = require('./config/connect')
// ============IMPORT ROUTES===================
const authRoutes = require('./routes/authRoutes')
// Extract enviromental variables
const port = process.env.PORT || 3001;

const app = express();// Create an Express application

//=====CHECK IF ALL THE ENVIRONMENTAL VARIABLES A PRESENT=========
// Conditional rendering to check if the environmental variables are missing
if (!port) {
    console.error('[ERROR app.js]: PORT enviromental variable is missing');
    process.exit(1);
}

app.use(express.json())
app.use(cors())
app.use(helmet())
app.use(express.urlencoded({extended:true}))

// =======ROUTES===========
// Prefix all route modules with their base path.
app.use('/auth', authRoutes)
mongoose.set('strictPopulate', false)


//=============START THE SERVER=============
// Connect to MongoDB first; only start listening once the DB is available.
// This avoids “server started but DB is down” race conditions.
connectDB().then(() => {
    app.listen(port, () => {
        console.info(`[INFO:app.js] server is running on ${port}`)
    })
}).catch((error) => {
    console.error('[ERROR: app.js]: Database connection failed');
    process.exit();
})