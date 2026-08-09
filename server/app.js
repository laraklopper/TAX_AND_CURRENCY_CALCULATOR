// app.js
require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/connect')
const port = process.env.PORT || 3001;
const app = express();


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