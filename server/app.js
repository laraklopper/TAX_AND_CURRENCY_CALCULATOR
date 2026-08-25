// app.js (server-side)
/* Load environment variables from a .env 
file using the dotenv package*/
require('dotenv').config()
/** Custom security utility: Guarantees JWT_SECRET_KEY enviromental 
 variable exists. 
 Generates one automatically if missing (dev) and Prevents app 
 from running insecurely */
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
const apiRoutes = require('./routes/apiRoutes')
const taxRoutes = require('./routes/taxRoutes')
const userRoutes = require('./routes/userRoutes')
const interestRoutes = require('./routes/interestRoutes')
const exportRoutes = require('./routes/exportRoutes')
// Extract enviromental variables
const port = process.env.PORT || 3001;

const app = express();// Create an Express application

//=====CHECK IF ALL THE ENVIRONMENTAL VARIABLES A PRESENT=========
// Conditional rendering to check if the environmental variables are missing
if (!port) {
    console.error('[ERROR app.js]: PORT enviromental variable is missing');
    process.exit(1);
}

// =======GLOBAL MIDDLEWARE==============
app.use(express.json())// Enable parsing of JSON bodies in incoming requests
app.use(cors())// Enable CORS for cross-origin requests (frontend <-> backend).
app.use(helmet())// Use Helmet for setting secure HTTP headers  for security (XSS, clickjacking, etc.)
app.use(express.urlencoded({extended:true}))// Parse URL-encoded form data (e.g. HTML forms)

// =======ROUTES===========
// Prefix all route modules with their base path.
app.use('/auth', authRoutes)//Routes for auth: login, registration, forgotPassword, resetPassword
app.use('/api', apiRoutes)//Api routes from third party API's
app.use('/api/tax', taxRoutes)// Income tax: /config, /calculate, /save and /history
app.use('/users', userRoutes)//User Routes: /me , fetchUsers, editUser, editPassword, deleteUser:id
app.use('/interest', interestRoutes)// Interest: /calculate, /save and /history
app.use('/export', exportRoutes)//Routes to export calculations
//-------MONGOOSE CONFIG
/*/ Disable strict populate to prevent errors when 
populating paths that are conditionally defined*/
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