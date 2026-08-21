// taxCalculator.js
/* SARS income tax maths, kept out of the route file so it can be reused by
both /api/tax/calculate and /api/tax/save - a saved record is always recomputed
from the user's inputs rather than trusting figures sent by the browser.

Follows docs/TAX_CONCEPTS.md:
  1. BRACKETS produce the gross tax
  2. REBATES reduce it (cumulative by age, never below zero)
  3. THRESHOLD is the income at which the rebates wipe the tax out entirely */

const mongoose = require('mongoose');
const seedTaxYear = require('../dataArrays/taxSeedData.json');
const TaxYearConfig = require('../models/TaxYearSchema');

/* True only when mongoose is actually connected. Checked before querying so a
lookup falls straight through to the seeded figures instead of sitting in
mongoose's buffer for ten seconds while the connection is down. */
const isDbConnected = () => mongoose.connection.readyState === 1;

// Round a currency value to two decimals without accumulating float drift
const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

/*=============================
AGE GROUPS
==============================*/
/* Which rebates a taxpayer qualifies for is decided by age alone, and age is
assessed over the whole year of assessment - a taxpayer who turns 65 at any
point in the year gets the full secondary rebate, it is never pro-rated. */
const ageGroupFor = (age) => {
    if (age >= 75) return 'age75plus';
    if (age >= 65) return 'age65to74';
    return 'under65';
};

/* Rebates are CUMULATIVE, not alternatives: a 78 year old receives the
primary, secondary and tertiary rebate together. */
const rebateFor = (age, rebates) => {
    let total = rebates.primary;// Every individual taxpayer gets the primary rebate
    if (age >= 65) total += rebates.secondary;
    if (age >= 75) total += rebates.tertiary;
    return total;
};

/*=============================
TAX YEAR CONFIG LOOKUP
==============================*/
/* Returns the bracket/rebate/threshold set for a tax year. Reads from the
database first so an admin-captured year is used when present, and falls back
to the seeded 2025-2026 figures so the calculator still works on a fresh
database. The fallback is read-only - nothing is written back. */
const getTaxYearConfig = async (taxYear) => {
    try {
        const stored = !isDbConnected()
            ? null
            : taxYear
                ? await TaxYearConfig.findOne({ taxYear }).lean().exec()
                : await TaxYearConfig.findOne({ isActive: true }).lean().exec();
        if (stored) return stored;
    } catch (error) {
        // A database problem must not take the calculator down; fall through to the seed
        console.error('[ERROR: taxCalculator.js, getTaxYearConfig]', error.message);
    }

    // Conditional rendering to check the requested year matches the seeded year
    if (!taxYear || taxYear === seedTaxYear.taxYear) return seedTaxYear;
    return null;// Unknown tax year - the route turns this into a 400
};

/* Returns every tax year the calculator can work with, newest first, with the
seeded year included so the client always has at least one option. */
const listTaxYears = async () => {
    let stored = [];
    try {
        if (isDbConnected()) stored = await TaxYearConfig.find().select('taxYear').lean().exec();
    } catch (error) {
        console.error('[ERROR: taxCalculator.js, listTaxYears]', error.message);
    }
    const years = new Set(stored.map((doc) => doc.taxYear));
    years.add(seedTaxYear.taxYear);// Guarantee the seeded year is always offered
    return [...years].sort().reverse();
};

/*=============================
TAX CALCULATION
==============================*/
/* Works out the tax payable on an annual income for a given tax year config.

`dependants` (medical scheme dependants) is recorded on the calculation but is
NOT applied: medical scheme fees tax credits are not part of TaxYearConfig, so
there are no per-year figures to apply them from. See PLANNING.md, where the
input is listed as optional/outstanding. */
const calculateTax = ({ annualIncome, age, dependants = 0, config }) => {
    const income = annualIncome;

    /* Find the bracket the income falls into. `max: null` marks the top
    bracket, which has no ceiling. */
    const bracket = config.brackets.find(
        (b) => income >= b.min && (b.max === null || b.max === undefined || income <= b.max)
    ) ?? config.brackets[config.brackets.length - 1];

    /* The marginal rate is charged on income above the TOP OF THE PREVIOUS
    bracket. The stored `min` is that figure plus one (237101, 370501...), so
    the floor is `min - 1`. Subtracting `min` instead would under-charge by one
    rand's worth of the marginal rate on every calculation. */
    const bracketFloor = bracket.min - 1;
    const grossTax = bracket.baseAmount + bracket.rate * (income - bracketFloor);

    const rebate = rebateFor(age, config.rebates);
    /* Rebates are non-refundable: they can reduce the tax to zero but never
    below it, so the surplus on a below-threshold taxpayer is simply lost. */
    const netTax = Math.max(0, grossTax - rebate);

    /* Bracket-by-bracket view of where the tax came from. Each band is charged
    only on the slice of income inside it, so these rows add up to the gross
    tax worked out from the base amount above. */
    const bracketBreakdown = [];
    for (const b of config.brackets) {
        const floor = b.min - 1;
        if (income <= floor) break;// Income never reached this band
        const ceiling = b.max === null || b.max === undefined ? income : Math.min(income, b.max);
        const amountInBracket = ceiling - floor;
        bracketBreakdown.push({
            min: b.min,
            max: b.max ?? null,
            rate: b.rate,// Kept as a decimal fraction, e.g. 0.18 for 18%
            amountInBracket: round2(amountInBracket),
            taxForBracket: round2(amountInBracket * b.rate),
        });
    }

    const ageGroup = ageGroupFor(age);

    return {
        taxYear: config.taxYear,
        annualIncome: round2(income),
        age,
        ageGroup,
        dependants,
        // The income below which no tax is payable for this age group
        threshold: config.thresholds?.[ageGroup] ?? null,
        grossTax: round2(grossTax),
        rebate: round2(rebate),
        netTax: round2(netTax),
        // Monthly PAYE equivalent of the annual tax payable
        monthlyTax: round2(netTax / 12),
        // Total tax as a percentage of total income - always below the marginal rate
        effectiveRate: income > 0 ? round2((netTax / income) * 100) : 0,
        // The rate charged on the next rand earned, as a percentage
        marginalRate: round2(bracket.rate * 100),
        bracketBreakdown,
    };
};

module.exports = { calculateTax, getTaxYearConfig, listTaxYears, ageGroupFor, rebateFor };
