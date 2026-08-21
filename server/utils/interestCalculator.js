// interestCalculator.js
/* Shared interest maths used by the /api/interest/calculate route.
Kept out of the route file so the calculation can be unit tested and reused
(for example when saving a calculation to a user's history).

The user chooses whether the time period is measured in YEARS (annual) or
MONTHS (monthly) - this matches the `time.unit` enum on interestSchema.js.
The interest rate is always supplied as an ANNUAL nominal rate, because that
is how rates are quoted; the calculator converts it to the requested period. */

// Number of times per year interest is compounded, per frequency name
const COMPOUND_FREQUENCIES = {
    annually: 1,
    semiannually: 2,
    quarterly: 4,
    monthly: 12,
    daily: 365,
};

// Longest period accepted per unit, used by the route's validation
const MAX_DURATION = {
    years: 100,
    months: 1200, // 100 years expressed in months
};

// Round a currency value to two decimals without accumulating float drift
const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

/*=============================
INTEREST CALCULATION
==============================*/
/* Simulates the balance one month at a time - the finest granularity the form
allows for contributions - then groups those months into the reporting period
the user asked for (one row per month, or one row per year).

Compound interest is grown by the monthly equivalent of the selected
compounding frequency: (1 + r/n)^(n/12). Over twelve months this multiplies
out to exactly (1 + r/n)^n, so the annual total still matches the standard
compound interest formula while giving a usable month-by-month breakdown.

Simple interest is only ever charged on capital paid in (the principal plus
any recurring contributions), never on interest already earned. */
const calculateInterest = ({
    type = 'simple',
    principal,
    rate,
    duration,
    periodUnit = 'years',
    compoundingFrequency = 'annually',
    monthlyContribution = 0,
}) => {
    const unit = periodUnit === 'months' ? 'months' : 'years';
    const isCompound = type === 'compound';

    const annualRate = rate / 100;// Convert the percentage to a decimal
    const contribution = Number(monthlyContribution) || 0;
    // Months to simulate, and how many of those months make up one output row
    const totalMonths = Math.round(unit === 'months' ? duration : duration * 12);
    const monthsPerRow = unit === 'months' ? 1 : 12;

    // Times per year interest is compounded (only relevant for compound interest)
    const timesPerYear = COMPOUND_FREQUENCIES[compoundingFrequency] || 1;
    /* Monthly growth factor for compound interest. Falls back to 1 for simple
    interest, where growth is worked out from the capital base instead. */
    const monthlyGrowth = isCompound
        ? Math.pow(1 + annualRate / timesPerYear, timesPerYear / 12)
        : 1;
    const monthlySimpleRate = annualRate / 12;// Simple interest accrued per month

    let balance = principal;// Running balance, including interest earned
    let capitalBase = principal;// Capital paid in, used for simple interest only
    let totalInterest = 0;
    let totalContributions = 0;
    // Totals for the row currently being built up
    let rowInterest = 0;
    let rowContributions = 0;
    const breakdown = [];

    for (let month = 1; month <= totalMonths; month++) {
        // Interest for this month, then add it to the balance
        const interest = isCompound
            ? balance * (monthlyGrowth - 1)
            : capitalBase * monthlySimpleRate;
        balance += interest;
        totalInterest += interest;
        rowInterest += interest;

        // Recurring contribution is paid in at the end of the month
        if (contribution > 0) {
            balance += contribution;
            capitalBase += contribution;
            totalContributions += contribution;
            rowContributions += contribution;
        }

        /* Close off a row on every reporting boundary, and always on the final
        month so a part-year is still reported rather than silently dropped. */
        if (month % monthsPerRow === 0 || month === totalMonths) {
            breakdown.push({
                period: breakdown.length + 1,
                contributions: round2(rowContributions),
                interest: round2(rowInterest),
                balance: round2(balance),
            });
            rowInterest = 0;
            rowContributions = 0;
        }
    }

    return {
        type: isCompound ? 'compound' : 'simple',
        principal: round2(principal),
        rate,
        duration,
        periodUnit: unit,
        // Label used by the client for the breakdown table's first column
        periodLabel: unit === 'months' ? 'month' : 'year',
        durationInMonths: totalMonths,
        compoundingFrequency: isCompound ? compoundingFrequency : null,
        monthlyContribution: contribution,
        totalContributions: round2(totalContributions),
        totalInterest: round2(totalInterest),
        finalAmount: round2(balance),
        breakdown,
    };
};

module.exports = { calculateInterest, COMPOUND_FREQUENCIES, MAX_DURATION };
