// exportRoutes.js

/*
GET calculations and allow user to export calculation to .csv and .xlsx
- export/taxHistory.(csv)
- export/taxHistory.(xlsx)
- export/interestHistory.(csv)
- export/interestHistor.(xlsx)
- export/currencyHistory.(csv)
- export/currencyHistory.(xlsx)

Each route returns a FILE rather than JSON, so the response is a download and
not something the client renders. The records are read straight off the saved
documents: the figures in an export are the ones the calculator showed when the
record was saved, never re-derived here.

The user is taken from the JWT rather than a query param, so an export can only
ever contain the requester's own records.
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

/* Upper bound on how many records go into one file. The history endpoints cap
at 100 because that is a list on screen; an export is meant to be the user's
whole history, so this is only here to stop a single request loading an
unbounded number of documents into memory. A truncated export is logged. */
const EXPORT_LIMIT = 5000;

// Shown when a currency code or a name is missing from a record.
const NOT_AVAILABLE = 'N/A';

/*=====================================
VALUE FORMATTING
=======================================*/
/* Formats a timestamp as YYYY-MM-DD HH:mm. Sortable as text in both CSV and
Excel, and unambiguous - a locale-formatted date would read as either
day/month or month/day depending on who opened the file. */
function toDateTime(value) {
    const date = value instanceof Date ? value : new Date(value);
    // Conditional rendering to check the timestamp is usable
    if (!value || Number.isNaN(date.getTime())) return '';// Blank cell rather than 'Invalid Date'

    const pad = (number) => String(number).padStart(2, '0');// 1 -> '01'
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/* Rounds a number to `decimals` places, leaving the cell blank when the value
is missing. Numbers are written as numbers, not strings, so a spreadsheet can
still total a column. */
function toNumber(value, decimals = 2) {
    const number = Number(value);
    // Conditional rendering to check the value is a usable number
    if (!Number.isFinite(number)) return '';// Blank cell rather than NaN

    const factor = 10 ** decimals;
    return Math.round(number * factor) / factor;
}

// Joins the fullName stored on a record into one cell.
function toFullName(fullName) {
    const firstName = fullName?.firstName?.trim() || '';
    const lastName = fullName?.lastName?.trim() || '';
    return `${firstName} ${lastName}`.trim() || NOT_AVAILABLE;
}

// Names the file after the data and the day it was exported, so repeated downloads do not overwrite each other.
function toFilename(name) {
    const [date] = new Date().toISOString().split('T');// YYYY-MM-DD
    return `${name}-${date}`;
}

/*=====================================
FILE GENERATION
=======================================*/
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
    const columns = [
        'DATE SAVED',
        'SAVED BY',
        'INTEREST TYPE',
        'PRINCIPAL',
        'INTEREST RATE (%)',
        'TERM',
        'TERM UNIT',
        'TERM IN YEARS',
        'COMPOUNDED PER YEAR',
        'MONTHLY CONTRIBUTION',
        'TOTAL CONTRIBUTIONS',
        'TOTAL CAPITAL',
        'INTEREST EARNED',
        'FINAL AMOUNT',
    ]
    try {
        const userId = req.user.userId;// The token payload signed in authRoutes.js uses `userId`

        const int = await Interest.find({
            user: userId
        })
        .sort({createdAt: -1})//Newest calculation first
        .limit(EXPORT_LIMIT)
        .exec()

        /* Conditional rendering to check there is anything to export: an empty
        file gives the user no way of telling a working export from a broken one */
        if (int.length === 0) {
            console.warn('[WARN: exportRoutes.js, GET /interestHistory] No saved interest calculations for user', userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({// Return a 404 (Not Found) status code with a message
                success: false,//Success status
                message: 'You have no saved interest calculations to export.'//JSON message
            });
        }

        //Convert Interest Calculation documents to rows
        // Keys match `columns` above: the object keys ARE the header row.
        const rows = int.map(i => ({
            'DATE SAVED': toDateTime(i.createdAt),
            'SAVED BY': toFullName(i.fullName),
            'INTEREST TYPE': (i.interestType || '').toUpperCase(),
            'PRINCIPAL': toNumber(i.principal),
            'INTEREST RATE (%)': toNumber(i.interestRate),
            'TERM': toNumber(i.time?.duration),
            'TERM UNIT': (i.time?.unit || '').toUpperCase(),
            // durationInYears and totalCapital are virtuals on the interest schema
            'TERM IN YEARS': toNumber(i.durationInYears),
            // Only meaningful for compound interest, so left blank for simple
            'COMPOUNDED PER YEAR': i.interestType === 'compound' ? toNumber(i.compoundFrequency, 0) : '',
            'MONTHLY CONTRIBUTION': toNumber(i.monthlyContribution || 0),
            'TOTAL CONTRIBUTIONS': toNumber(i.totalContributions || 0),
            'TOTAL CAPITAL': toNumber(i.totalCapital),
            'INTEREST EARNED': toNumber(i.totalInterest),
            'FINAL AMOUNT': toNumber(i.finalAmount),
        }))

        // Say so when the export is only the newest slice of a longer history
        if (rows.length === EXPORT_LIMIT) {
            console.warn('[WARN: exportRoutes.js, GET /interestHistory] Export truncated to the newest', EXPORT_LIMIT, 'calculation(s) for user', userId);// Log a warning message in the console for debugging purposes
        }

        console.log('[SUCCESS: exportRoutes.js, GET /interestHistory] Exported', rows.length, 'calculation(s) as', format, 'for user', userId);//Log a success message in the console for debugging purposes
// Generate and send the export file.
        // sendExport handles both CSV and XLSX output.
        return sendExport(res, format, rows, columns, toFilename('interest-calculations'))
    } catch (error) {
        console.error('[ERROR: exportRoutes.js, GET /interestHistory]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})
// tax calculations
router.get('/taxHistory',checkJwtToken, async (req, res) => {
    const format = parseFormat(req, res)// Allowed formats: csv or xlsx.
    // Stop if parseFormat already sent an error response.
    if(!format) return
    // Defines the exact column order in the exported file.
    const columns = [
        'DATE SAVED',
        'SAVED BY',
        'TAX YEAR',
        'AGE',
        'AGE GROUP',
        'DEPENDANTS',
        'GROSS INCOME',
        'DEDUCTIONS',
        'TAXABLE INCOME',
        'GROSS TAX',
        'REBATE',
        'TAX PAYABLE',
        'MONTHLY TAX',
        'NET INCOME',
        'EFFECTIVE RATE (%)',
        'MARGINAL RATE (%)',
    ]
    try {
        const userId = req.user.userId;// The token payload signed in authRoutes.js uses `userId`

        // Fetch all tax calculation documents
        const txs = await Tax.find(
            {user: userId}
        )
        .sort({createdAt: -1})//Newest calculation first
        .limit(EXPORT_LIMIT)
        .exec()

        /* Conditional rendering to check there is anything to export: an empty
        file gives the user no way of telling a working export from a broken one */
        if (txs.length === 0) {
            console.warn('[WARN: exportRoutes.js, GET /taxHistory] No saved tax calculations for user', userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({// Return a 404 (Not Found) status code with a message
                success: false,//Success status
                message: 'You have no saved tax calculations to export.'//JSON message
            });
        }

        //Convert Tax Calculation documents to rows
        // Keys match `columns` above: the object keys ARE the header row.
        const rows = txs.map(t => ({
            'DATE SAVED': toDateTime(t.createdAt),
            'SAVED BY': toFullName(t.fullName),
            'TAX YEAR': t.income?.taxYear || NOT_AVAILABLE,
            'AGE': toNumber(t.age, 0),
            'AGE GROUP': t.ageGroup || NOT_AVAILABLE,
            'DEPENDANTS': toNumber(t.dependants || 0, 0),
            'GROSS INCOME': toNumber(t.income?.grossIncome),
            'DEDUCTIONS': toNumber(t.deductions || 0),
            // taxableIncome, monthlyTax and netIncome are virtuals on the tax schema
            'TAXABLE INCOME': toNumber(t.taxableIncome),
            'GROSS TAX': toNumber(t.grossTax),
            'REBATE': toNumber(t.rebate),
            'TAX PAYABLE': toNumber(t.netTax),
            'MONTHLY TAX': toNumber(t.monthlyTax),
            'NET INCOME': toNumber(t.netIncome),
            'EFFECTIVE RATE (%)': toNumber(t.effectiveRate),
            'MARGINAL RATE (%)': toNumber(t.marginalRate),
        }))

        // Say so when the export is only the newest slice of a longer history
        if (rows.length === EXPORT_LIMIT) {
            console.warn('[WARN: exportRoutes.js, GET /taxHistory] Export truncated to the newest', EXPORT_LIMIT, 'calculation(s) for user', userId);// Log a warning message in the console for debugging purposes
        }

        console.log('[SUCCESS: exportRoutes.js, GET /taxHistory] Exported', rows.length, 'calculation(s) as', format, 'for user', userId);//Log a success message in the console for debugging purposes
        // Generate and send the export file.
        // sendExport handles both CSV and XLSX output.
        return sendExport(res, format, rows, columns, toFilename('tax-calculations'))
    } catch (error) {
        console.error('[ERROR: exportRoutes.js, GET /taxHistory]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})
// Currency calculations
router.get('/currencyHistory', checkJwtToken, async (req, res) => {
    const format = parseFormat(req, res)// Allowed formats: csv or xlsx.
    // Stop if parseFormat already sent an error response.
    if(!format) return
    // Defines the exact column order in the exported file.
    const columns = [
        'DATE SAVED',
        'SAVED BY',
        'AMOUNT',
        'FROM',
        'TO',
        'RATE',
        'CONVERTED AMOUNT',
    ]
    try {
        const userId = req.user.userId;// The token payload signed in authRoutes.js uses `userId`

        const curr = await Currency.find({
            user: userId
        })
        .sort({createdAt: -1})//Newest calculation first
        .limit(EXPORT_LIMIT)
        .exec()

        /* Conditional rendering to check there is anything to export: an empty
        file gives the user no way of telling a working export from a broken one */
        if (curr.length === 0) {
            console.warn('[WARN: exportRoutes.js, GET /currencyHistory] No saved conversions for user', userId);// Log a warning message in the console for debugging purposes
            return res.status(404).json({// Return a 404 (Not Found) status code with a message
                success: false,//Success status
                message: 'You have no saved currency conversions to export.'//JSON message
            });
        }

        //Convert Currency converter Calculation documents to rows
        // Keys match `columns` above: the object keys ARE the header row.
        const rows = curr.map(c => ({
            'DATE SAVED': toDateTime(c.createdAt),
            'SAVED BY': toFullName(c.fullName),
            'AMOUNT': toNumber(c.amount),
            'FROM': c.currency?.baseCurrency || NOT_AVAILABLE,
            'TO': c.currency?.targetCurrency || NOT_AVAILABLE,
            /* The rate the conversion was saved with, kept to 6 decimals as it
            is on screen: rounding it to 2 would not reproduce the conversion */
            'RATE': toNumber(c.rate, 6),
            // convertedAmount is a virtual on the currency schema
            'CONVERTED AMOUNT': toNumber(c.convertedAmount),
        }))

        // Say so when the export is only the newest slice of a longer history
        if (rows.length === EXPORT_LIMIT) {
            console.warn('[WARN: exportRoutes.js, GET /currencyHistory] Export truncated to the newest', EXPORT_LIMIT, 'conversion(s) for user', userId);// Log a warning message in the console for debugging purposes
        }

        console.log('[SUCCESS: exportRoutes.js, GET /currencyHistory] Exported', rows.length, 'conversion(s) as', format, 'for user', userId);//Log a success message in the console for debugging purposes
        // Generate and send the export file.
        // sendExport handles both CSV and XLSX output.
        return sendExport(res, format, rows, columns, toFilename('currency-conversions'))
    } catch (error) {
        console.error('[ERROR: exportRoutes.js, GET /currencyHistory]', error.message);// Log an error message in the console for debugging purposes
        return res.status(500).json({ success: false, message: 'Internal Server Error' });// Return a 500 (Internal Server Error) status code with a message
    }
})
module.exports = router;
