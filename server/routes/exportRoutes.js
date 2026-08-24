// exportRoutes.js

/*
GET calculations and allow user to export calculation to .csv and .xlsx
- export/taxHistory.(csv)
- export/taxHistory.(xlsx)
- export/interestHistory.(csv)
- export/interestHistor.(xlsx)
- export/currencyHistory.(csv)
- export/currencyHistory.(xlsx)
*/


// IMPORT REQUIRED MODULES AND PACKAGES
const express = require('express');
const XLSX = require('xlsx');
const { stringify } = require('csv-stringify/sync');
// IMPORT CUSTOM MIDDLEWARE
const { checkJwtToken } = require('./middleware');// Middleware to check JWT token for authentication
// IMPORT SCHEMAS/MODELS
const Interest = require('../models/interestSchema')
const Tax = require('../models/taxCalcSchema')
const Currency = require('../models/curConvertSchema')
const router = express.Router()

// Serialises rows into either XLSX or CSV and sends the file as a download.
function sendExport(res, format, rows, columns, filename) {
    if (format === 'xlsx') {
        const ws = XLSX.utils.json_to_sheet(rows, { header: columns }); // convert row objects to a worksheet, preserving column order
        const wb = XLSX.utils.book_new();                                // create an empty workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Data');                   // attach the worksheet under the tab name 'Data'
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }); // serialise to a binary buffer
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.xlsx"`); // triggers browser Save-As dialog
        return res.send(buf);
    }
    // Default to CSV
    const csv = stringify(rows, { header: true, columns }); // include header row; columns controls order
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    return res.send(csv);
}

// Reads and validates the ?format= query param; sends a 400 and returns null if invalid.
function parseFormat(req, res) {
    const fmt = (req.query.format || 'csv').toLowerCase(); // default to csv when param is omitted
    if (!['csv', 'xlsx'].includes(fmt)) {
        res.status(400).json(// Return 400 (Bad Request) with a JSON message
            { message: 'Invalid format. Use csv or xlsx.' }//JSON message
        );
        return null; // caller checks for null and exits early
    }
    return fmt;
}

/*Routes to export calculations to xlsx and csv files*/
/*──────────────────────────── GET ROUTES ─────────────────────────────────────
   GET: READ — Used to fetch information from the database
────────────────────────────────────────────────────────────────────────────────*/
// Exports all calculations for the authenticated user, sorted newest-first.
// Interest calculations
router.get('/interestHistory', checkJwtToken, async (req, res) => {
    const format = parseFormat(req, res)// Allowed formats: csv or xlsx.
    // Stop if parseFormat already sent an error response.
    if(!format) return
    // Defines the exact column order in the exported file.
    const columns = []
    try {
        const int = await Interest.find({
            userId: req.user.id
        })
        .populate()
        .sort({executed: -1})//Newest calculation first
        .exec()
        
        //Convert Interest Calculation documents to rows
        const rows = int.map(i => ({

        }))
// Generate and send the export file.
        // sendExport handles both CSV and XLSX output.
        sendExport()
    } catch (error) {
        
    }
})
// tax calculations
router.get('/taxHistory',checkJwtToken, async (req, res) => {
    const format = parseFormat(req, res)// Allowed formats: csv or xlsx.
    // Stop if parseFormat already sent an error response.
    if(!format) return
    // Defines the exact column order in the exported file.
    const columns = []
    try {
        // Fetch all tax calculation documents
        const txs = await Tax.find(
            {userId: req.user.id}
        )
        .populate()
        .sort({executed: -1})//Newest calculation first
        .exec()

        //Convert Tax Calculation documents to rows
        const rows = txs.map(t => ({}))

        // Generate and send the export file.
        // sendExport handles both CSV and XLSX output.
        sendExport()
    } catch (error) {
        
    }
})
// Currency calculations
router.get('/currencyHistory', checkJwtToken, async (req, res) => {
    const format = parseFormat(req, res)// Allowed formats: csv or xlsx.
    // Stop if parseFormat already sent an error response.
    if(!format) return
    // Defines the exact column order in the exported file.
    const columns = []
    try {
        const curr = await Currency.find({
            userId: req.user.id
        })
        .populate()
        .sort({executed: -1})//Newest calculation first
        .exec()

        //Convert Currency converter Calculation documents to rows
        const rows = curr.map(c => ({
            
        }))

        // Generate and send the export file.
        // sendExport handles both CSV and XLSX output.
        sendExport()
    } catch (error) {
        
    }
})
module.exports = router;