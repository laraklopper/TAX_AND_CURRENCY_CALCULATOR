// app.js
require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');

const port = process.env.PORT || 3001;
const app = express();


if (!port) {
    console.error('[ERROR app.js]: PORT enviromental variable is missing');
    process.exit(1);
}

app.use(express.json())
app.use(cors())
app.use(helmet())

mongoose.set('strictPopulate', false)

 app.listen(port, () => {
        console.info(`[INFO:app.js] server is running on ${port}`)// Log a message in the console indicating the server is running
    })