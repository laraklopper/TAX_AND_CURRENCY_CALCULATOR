// provisionalTaxCalculator.js
/* SARS provisional tax maths (Fourth Schedule to the Income Tax Act), kept out
of the route file so /provisional/calculate and /provisional/save work the same
figures out from the same inputs - a saved record is always recomputed rather
than trusting the figures the browser sends.

Provisional tax is NOT a separate tax: it is the same normal tax the income tax
calculator works out, paid in advance in instalments. The brackets and rebates
therefore come from taxCalculator.js rather than being duplicated here, so a tax
year captured by an admin drives both calculators and the two can never disagree
about what the tax on an income is.

  1. NORMAL TAX on the estimated taxable income for the WHOLE year (brackets)
  2. LESS the cumulative age-based rebates and any medical scheme fees credits
  3. × the PORTION of the year the payment covers - 50% for the first payment,
     100% for the second and third
  4. LESS employees' tax, foreign tax credits and provisional tax already paid
  = the amount payable on this IRP6

The result is floored at zero: an IRP6 cannot ask for a negative payment, so a
taxpayer whose PAYE already covers the liability is reported as having nothing
to pay, with the surplus shown separately as `overpaid`. */

const { calculateTax } = require('./taxCalculator');

// Round a currency value to two decimals without accumulating float drift
const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

/*=============================
THE THREE PROVISIONAL PERIODS
==============================*/
/* The first payment covers HALF the year's liability and is due at the end of
the sixth month; the second squares up the full year and is due on the last day
of the year of assessment. The third is a voluntary top-up made after the year
has ended, so it too works off the full year - what makes it smaller is the two
payments already deducted from it, not a smaller portion. */
const PERIODS = {
    first: {
        label: 'First payment',
        portion: 0.5,
        // Number of months into the year of assessment the payment falls due
        dueMonthOffset: 5,// The sixth month, counting the first month as 0
        acceptsPriorPayments: false,// Nothing can have been paid yet
    },
    second: {
        label: 'Second payment',
        portion: 1,
        dueMonthOffset: null,// Due on the last day of the year itself
        acceptsPriorPayments: true,
    },
    third: {
        label: 'Third (top-up) payment',
        portion: 1,
        dueMonthOffset: null,// Due after the year has ended - see dueDateFor
        acceptsPriorPayments: true,
    },
};

// The periods a request may ask for, used by the route's validation
const PROVISIONAL_PERIODS = Object.keys(PERIODS);

/* Months after the end of the year of assessment that the voluntary third
payment falls due. Seven months for individuals and trusts, so a February year
end makes it 30 September. */
const THIRD_PAYMENT_MONTHS_AFTER_YEAR_END = 7;

/*=============================
UNDERESTIMATION AND PENALTIES
==============================*/
/* Taxable income above which the second estimate is judged against 80% of the
actual taxable income rather than the gentler 90%-or-basic-amount test
(paragraph 20). */
const SECOND_PERIOD_ACCURACY_THRESHOLD = 1_000_000;
/* Tax owing above which section 89quat interest runs from the effective date,
which is what the voluntary third payment exists to avoid. */
const INTEREST_FREE_SHORTFALL = 50_000;
// Penalty for paying an IRP6 late (paragraph 27), as a percentage
const LATE_PAYMENT_PENALTY_RATE = 10;

/*=============================
DUE DATES
==============================*/
/* Last day of a month, as a UTC date. Worked out with day 0 of the FOLLOWING
month, which lands on the last day of the month asked for without needing to
know its length or whether the year is a leap year - the second payment falling
due on 28 or 29 February depends on exactly that. */
const lastDayOfMonth = (year, monthIndex) => new Date(Date.UTC(year, monthIndex + 1, 0));

// Format a date as YYYY-MM-DD, the shape the client's date fields work in
const toIsoDate = (date) => date.toISOString().slice(0, 10);

/* The two dates bounding the year of assessment. A stored TaxYearConfig carries
them, so they are used when they are there; otherwise they are derived from the
tax year LABEL, because a SARS year of assessment for an individual always runs
1 March to the last day of February. Returns null when neither is usable. */
const yearBounds = (config = {}) => {
    const start = config.startDate ? new Date(config.startDate) : null;
    const end = config.endDate ? new Date(config.endDate) : null;
    if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
        return { start, end };
    }

    // Fall back to the label, e.g. "2025-2026" -> 1 March 2025 to 28 February 2026
    const match = /^(\d{4})-(\d{4})$/.exec(String(config.taxYear ?? ''));
    if (!match) return null;
    return {
        start: new Date(Date.UTC(Number(match[1]), 2, 1)),// 1 March of the first year
        end: lastDayOfMonth(Number(match[2]), 1),// Last day of February of the second
    };
};

/* The date an IRP6 for this period falls due. Returned as a YYYY-MM-DD string,
or null when the tax year's dates could not be resolved - a missing due date is
reported as unknown rather than guessed at. */
const dueDateFor = (period, config) => {
    const bounds = yearBounds(config);
    if (!bounds) return null;

    // The first payment is due on the last day of the sixth month of the year
    if (period === 'first') {
        const offset = PERIODS.first.dueMonthOffset;
        return toIsoDate(lastDayOfMonth(
            bounds.start.getUTCFullYear(),
            bounds.start.getUTCMonth() + offset
        ));
    }

    /* The third payment is due seven months after the year end. The month is
    stepped rather than the day, so it lands on the last day of that month
    (30 September for a February year end) rather than on the 28th. */
    if (period === 'third') {
        return toIsoDate(lastDayOfMonth(
            bounds.end.getUTCFullYear(),
            bounds.end.getUTCMonth() + THIRD_PAYMENT_MONTHS_AFTER_YEAR_END
        ));
    }

    // The second payment is due on the last day of the year of assessment itself
    return toIsoDate(bounds.end);
};

/*=============================
UNDERESTIMATION GUIDANCE
==============================*/
/* Which accuracy test paragraph 20 applies to the estimate. The first payment
is measured against the BASIC AMOUNT - the taxable income from the most recent
assessment - while the second is measured against the actual taxable income for
the year, on a test that tightens once the income passes a million rand. The
third payment is made after the year has ended, so there is nothing left to
estimate. */
const underEstimationRuleFor = (period, estimatedTaxableIncome) => {
    if (period === 'first') return 'basicAmount';
    if (period === 'third') return 'notApplicable';
    return estimatedTaxableIncome > SECOND_PERIOD_ACCURACY_THRESHOLD
        ? 'eightyPercent'
        : 'ninetyPercentOrBasicAmount';
};

// Format a figure as whole rands for the warning messages, e.g. R1 000 000
const toWholeRands = (value) =>
    `R${new Intl.NumberFormat('en-ZA', { maximumFractionDigits: 0 }).format(value)}`;

/* Plain-language notes to show beneath the result. These are the rules the
figures cannot show on their own: what happens if the estimate turns out to be
too low, and what happens if the payment is made late. Returned as an array of
strings so the form can render them without knowing which apply. */
const warningsFor = ({ period, estimatedTaxableIncome, basicAmount, amountPayable }) => {
    const warnings = [];

    /* An estimate below the basic amount is the one thing that can be checked
    here and now, so it is called out with both figures rather than left as a
    general rule. Only the two ESTIMATED periods are judged against it: the
    third payment is made once the year has ended, so there is no estimate left
    for SARS to revise. */
    if (period !== 'third' && typeof basicAmount === 'number' && estimatedTaxableIncome < basicAmount) {
        warnings.push(
            `The estimated taxable income of ${toWholeRands(estimatedTaxableIncome)} is below the basic amount of ${toWholeRands(basicAmount)}. SARS may increase the estimate to the basic amount (paragraph 19(3)).`
        );
    }

    if (period === 'first') {
        warnings.push(
            'The first estimate may not be less than the basic amount - the taxable income per the most recent assessment, escalated by 8% a year where that assessment is more than 18 months old.'
        );
    }

    if (period === 'second') {
        warnings.push(
            estimatedTaxableIncome > SECOND_PERIOD_ACCURACY_THRESHOLD
                ? `Because the estimate is more than ${toWholeRands(SECOND_PERIOD_ACCURACY_THRESHOLD)}, it must be at least 80% of the actual taxable income for the year or a 20% underestimation penalty applies (paragraph 20).`
                : 'The estimate must be at least the lesser of 90% of the actual taxable income and 100% of the basic amount, or a 20% underestimation penalty applies (paragraph 20).'
        );
    }

    if (period === 'third') {
        warnings.push(
            `The third payment is voluntary. It is what stops section 89quat interest running on tax owing of more than ${toWholeRands(INTEREST_FREE_SHORTFALL)}, so it is worth making where the first two payments fell short.`
        );
    }

    // Applies to every IRP6, so it closes the list rather than opening it
    if (amountPayable > 0) {
        warnings.push(
            `A payment made after the due date attracts a ${LATE_PAYMENT_PENALTY_RATE}% late payment penalty on the amount outstanding (paragraph 27).`
        );
    }

    return warnings;
};

/*=============================
PROVISIONAL TAX CALCULATION
==============================*/
/* Works out what is payable on one IRP6.

`estimatedTaxableIncome` is the taxpayer's estimate of their taxable income for
the WHOLE year of assessment, not the income for the six months the first
payment covers: the brackets are annual and progressive, so halving the income
and taxing that would tax it at a lower rate than the year will actually attract.
The portion is applied to the TAX, after the brackets have been worked out.

`medicalCredits` is supplied by the taxpayer rather than worked out here.
TaxYearConfig holds no medical scheme fees tax credit figures - the same reason
the income tax calculator records dependants without applying a credit - so the
figure is taken as an input and deducted as given. */
const calculateProvisionalTax = ({
    period,
    estimatedTaxableIncome,
    age,
    employeesTax = 0,
    foreignTaxCredits = 0,
    priorPayments = 0,
    medicalCredits = 0,
    basicAmount = null,
    config,
}) => {
    const periodConfig = PERIODS[period] ?? PERIODS.first;

    /* The normal tax on the full year's estimate, from the same function the
    income tax calculator uses. `netTax` is the tax after the age-based rebates,
    already floored at zero. */
    const annual = calculateTax({
        annualIncome: estimatedTaxableIncome,
        age,
        config,
    });

    /* Medical scheme fees tax credits come off after the rebates and, like the
    rebates, are non-refundable: they can take the liability to zero but not
    below it. */
    const annualTaxLiability = Math.max(0, annual.netTax - medicalCredits);

    // The share of the year's liability this IRP6 covers
    const taxForPeriod = round2(annualTaxLiability * periodConfig.portion);

    /* Everything already paid towards the year, whether withheld by an
    employer, credited for tax paid abroad or paid on an earlier IRP6. */
    const totalCredits = round2(employeesTax + foreignTaxCredits + priorPayments);

    const balance = round2(taxForPeriod - totalCredits);
    /* An IRP6 cannot ask for a negative payment. A balance in the taxpayer's
    favour is reported as nothing payable, with the surplus shown separately so
    it is visible rather than silently rounded away. */
    const amountPayable = Math.max(0, balance);
    const overpaid = balance < 0 ? round2(-balance) : 0;

    /* The working, laid out the way an IRP6 is: each row either adds to or comes
    off the figure above it, and the totals are the lines the taxpayer is asked
    to sign. Built here rather than in the form so the printed working and the
    stored figures can never drift apart. */
    const breakdown = [
        {
            label: 'Tax on estimated taxable income',
            amount: annual.grossTax,
            type: 'add',
        },
        {
            label: 'Less: rebates',
            amount: annual.rebate,
            type: 'deduct',
        },
    ];

    // Only shown when there is one: a zero row reads as a mistake rather than a nil
    if (medicalCredits > 0) {
        breakdown.push({
            label: 'Less: medical scheme fees tax credits',
            amount: round2(medicalCredits),
            type: 'deduct',
        });
    }

    breakdown.push({
        label: 'Tax liability for the year',
        amount: round2(annualTaxLiability),
        type: 'total',
    });

    breakdown.push({
        label: `Portion for this period (${round2(periodConfig.portion * 100)}%)`,
        amount: taxForPeriod,
        type: 'total',
    });

    if (employeesTax > 0) {
        breakdown.push({
            label: "Less: employees' tax (PAYE) for the period",
            amount: round2(employeesTax),
            type: 'deduct',
        });
    }
    if (foreignTaxCredits > 0) {
        breakdown.push({
            label: 'Less: foreign tax credits',
            amount: round2(foreignTaxCredits),
            type: 'deduct',
        });
    }
    if (priorPayments > 0) {
        breakdown.push({
            label: 'Less: provisional tax already paid',
            amount: round2(priorPayments),
            type: 'deduct',
        });
    }

    breakdown.push({
        label: 'Amount payable',
        amount: amountPayable,
        type: 'total',
    });

    return {
        taxYear: annual.taxYear,
        period,
        periodLabel: periodConfig.label,
        periodPortion: periodConfig.portion,
        // Null when the tax year carries no usable dates - never a guessed date
        dueDate: dueDateFor(period, config),
        estimatedTaxableIncome: round2(estimatedTaxableIncome),
        age,
        ageGroup: annual.ageGroup,
        // The income below which no tax is payable for this age group
        threshold: annual.threshold,
        taxOnEstimate: annual.grossTax,
        rebate: annual.rebate,
        medicalCredits: round2(medicalCredits),
        annualTaxLiability: round2(annualTaxLiability),
        taxForPeriod,
        employeesTax: round2(employeesTax),
        foreignTaxCredits: round2(foreignTaxCredits),
        priorPayments: round2(priorPayments),
        totalCredits,
        amountPayable,
        overpaid,
        // Rates for the whole year, so they describe the estimate rather than the instalment
        effectiveRate: estimatedTaxableIncome > 0
            ? round2((annualTaxLiability / estimatedTaxableIncome) * 100)
            : 0,
        marginalRate: annual.marginalRate,
        basicAmount: typeof basicAmount === 'number' ? round2(basicAmount) : null,
        /* Null when no basic amount was supplied: the estimate has not been
        judged against it, which is not the same as having failed the test. */
        meetsBasicAmount: typeof basicAmount === 'number'
            ? estimatedTaxableIncome >= basicAmount
            : null,
        underEstimationRule: underEstimationRuleFor(period, estimatedTaxableIncome),
        breakdown,
        // Where the tax on the estimate came from, bracket by bracket
        bracketBreakdown: annual.bracketBreakdown,
        warnings: warningsFor({ period, estimatedTaxableIncome, basicAmount, amountPayable }),
    };
};

module.exports = {
    calculateProvisionalTax,
    PROVISIONAL_PERIODS,
    PERIODS,
    dueDateFor,
    SECOND_PERIOD_ACCURACY_THRESHOLD,
};
