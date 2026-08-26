// calculationFunc.js
/*Utility(helper) functions relating to tax and interest calculations and forms
*/
import { NOT_AVAILABLE } from './formatCalculations'
import { evaluate } from 'mathjs'

//-----------SHARED FORMATTING-----------
/* Format a figure as rands, e.g. R 1 500,00. Used by the tax and interest
calculator forms, which work only in rands. A missing figure is shown as R 0,00
rather than as nothing, because a result card with no number in it reads as a
fault rather than as a zero. */
export const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
        maximumFractionDigits: 2,
    }).format(value || 0);
}

// Format a percentage held as a number, e.g. 26.5 as 26.50%
export const formatPercent = (value) => `${(value || 0).toFixed(2)}%`;

/* Format a figure as whole rands, e.g. 237100 as R 237 100. The tax year's
brackets, rebates and thresholds are published as whole rands, so showing them
to two decimals would only add noise. */
export const toWholeRands = (value) =>
    `R ${new Intl.NumberFormat('en-ZA').format(value)}`

/* Format a decimal rate as a percentage, e.g. 0.18 as 18%. A rate that lands on
a whole number is shown without decimals, because the published brackets are
quoted that way ("18%", not "18,00%"). */
export const toRatePercent = (rate) =>
    `${(rate * 100).toFixed(rate * 100 % 1 === 0 ? 0 : 2)}%`

// Round a currency value to two decimals without accumulating float drift
const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

//===========================================================================
// TAX CALCULATOR FORM (TaxCalculatorForm.js)
//===========================================================================
// The tax calculator's inputs before the user has filled anything in
export const BLANK_TAX_FORM = {
    incomeType: "annual", // "annual" | "monthly"
    income: "",
    age: "",
    taxYear: "",
    dependants: "0",
};

/* Check the tax calculator's inputs, returning a field -> message object. An
empty object means the form is good to submit. */
export const validateTaxForm = (form) => {
    const errs = {};
    if (!form.income || Number(form.income) <= 0) {
        errs.income = "Enter an income amount greater than 0";
    }
    if (!form.age || Number(form.age) < 16 || Number(form.age) > 120) {
        errs.age = "Enter a valid age";
    }
    if (!form.taxYear) {
        errs.taxYear = "Select a tax year";
    }
    if (form.dependants === "" || Number(form.dependants) < 0) {
        errs.dependants = "Cannot be negative";
    }
    return errs;
}

/* Assemble the request body for POST /tax/calculate. A monthly income is
sent as its annual equivalent, because the brackets are annual figures. */
export const buildTaxPayload = (form) => {
    const annualIncome =
        form.incomeType === "monthly"
            ? Number(form.income) * 12
            : Number(form.income);

    return {
        annualIncome,
        age: Number(form.age),
        taxYear: form.taxYear,
        dependants: Number(form.dependants) || 0,
    };
}

//===========================================================================
// PROVISIONAL TAX CALCULATOR FORM (ProvisionalTaxCalculatorForm.js)
//===========================================================================
/* The three IRP6 payments a provisional taxpayer makes in a year of assessment.
`value` is what the backend accepts as `period`; the rest is what the form shows,
so the calculator can explain which payment is being worked out without the
component holding the wording itself.

The first payment covers HALF the year's liability. The second squares up the
whole year, and the third is a voluntary top-up made after the year has ended -
what makes it smaller is the two payments already deducted from it, not a
smaller portion of the year. */
export const PROVISIONAL_PERIODS = [
    {
        value: 'first',
        label: 'FIRST',
        heading: 'First payment',
        portionLabel: '50% of the year’s liability',
        dueLabel: 'Due by the last day of the sixth month of the tax year',
        // Nothing can have been paid towards the year yet
        acceptsPriorPayments: false,
    },
    {
        value: 'second',
        label: 'SECOND',
        heading: 'Second payment',
        portionLabel: '100% of the year’s liability, less the first payment',
        dueLabel: 'Due by the last day of the tax year',
        acceptsPriorPayments: true,
    },
    {
        value: 'third',
        label: 'THIRD (TOP-UP)',
        heading: 'Third (top-up) payment',
        portionLabel: '100% of the year’s liability, less the first two payments',
        dueLabel: 'Voluntary, due seven months after the tax year ends',
        acceptsPriorPayments: true,
    },
];

// Helper returning the config for the currently selected IRP6 period
export const provisionalPeriodConfig = (period) =>
    PROVISIONAL_PERIODS.find((p) => p.value === period) ?? PROVISIONAL_PERIODS[0];

/* The optional rand figures on the form. All four are left blank by a taxpayer
they do not apply to, so each is validated the same way (not negative) and sent
as 0 rather than as an empty string. */
const PROV_TAX_OPTIONAL_AMOUNTS = [
    'employeesTax',
    'foreignTaxCredits',
    'medicalCredits',
    'priorPayments',
];

// The provisional tax calculator's inputs before the user has filled anything in
export const BLANK_PROV_TAX_FORM = {
    period: 'first', // 'first' | 'second' | 'third'
    taxYear: '',
    // The estimate for the WHOLE year of assessment, not for the period
    estimatedIncome: '',
    age: '',
    employeesTax: '',
    foreignTaxCredits: '',
    medicalCredits: '',
    priorPayments: '',
    basicAmount: '',
};

/* Check the provisional tax calculator's inputs, returning a field -> message
object. An empty object means the form is good to submit.

An estimate BELOW the basic amount is not an error: paragraph 19(3) leaves that
to SARS to revise, so the result warns about it rather than the form refusing to
work the figures out. */
export const validateProvTaxForm = (form) => {
    const errs = {};
    const period = provisionalPeriodConfig(form.period);

    if (!form.estimatedIncome || Number(form.estimatedIncome) <= 0) {
        errs.estimatedIncome = 'Enter an estimated taxable income greater than 0';
    }
    if (!form.age || Number(form.age) < 16 || Number(form.age) > 120) {
        errs.age = 'Enter a valid age';
    }
    if (!form.taxYear) {
        errs.taxYear = 'Select a tax year';
    }
    if (!PROVISIONAL_PERIODS.some((p) => p.value === form.period)) {
        errs.period = 'Select which payment this is';
    }

    /* The optional amounts may be left blank, but not entered as negatives.
    Only the fields the SELECTED period actually shows are judged: a figure
    typed in before the period was changed is no longer on screen, so an error
    against it would be an error the user cannot see or clear. The payload
    drops those same fields, so nothing unchecked is ever sent. */
    [...PROV_TAX_OPTIONAL_AMOUNTS, 'basicAmount'].forEach((field) => {
        if (field === 'priorPayments' && !period.acceptsPriorPayments) return;
        if (field === 'basicAmount' && period.value === 'third') return;
        if (form[field] !== '' && Number(form[field]) < 0) {
            errs[field] = 'Cannot be negative';
        }
    });

    return errs;
}

/* Assemble the request body for POST /provisional/calculate and
POST /provisional/save.

The blank optional amounts become 0, because a field left blank means none of
that kind applies. The basic amount is the exception and is sent as NULL: a
taxpayer filing their first IRP6 has no assessment to take one from, and a
missing basic amount is not the same as a basic amount of nil - the backend
skips the underestimation check rather than judging the estimate against zero. */
export const buildProvTaxPayload = (form) => {
    const period = provisionalPeriodConfig(form.period);

    const payload = {
        period: period.value,
        taxYear: form.taxYear,
        estimatedTaxableIncome: Number(form.estimatedIncome),
        age: Number(form.age),
        /* Left out on a third payment as well as when it is blank: that payment
        is made once the year has ended, so there is no estimate left to judge
        against the basic amount and the form does not offer the field. */
        basicAmount: form.basicAmount === '' || period.value === 'third'
            ? null
            : Number(form.basicAmount),
    };

    PROV_TAX_OPTIONAL_AMOUNTS.forEach((field) => {
        payload[field] = Number(form[field]) || 0;
    });

    /* A first payment cannot have anything paid towards the year already, and
    the backend rejects one that says it has, so the field the form hides is
    sent as 0 rather than as whatever was typed before the period was changed. */
    if (!period.acceptsPriorPayments) payload.priorPayments = 0;

    return payload;
}

//===========================================================================
// INTEREST CALCULATOR FORM (InterestCalculatorForm.js)
//===========================================================================
export const COMPOUND_FREQUENCIES = [
    { value: "annually", label: "Annually", timesPerYear: 1 },
    { value: "semiannually", label: "Semi-annually", timesPerYear: 2 },
    { value: "quarterly", label: "Quarterly", timesPerYear: 4 },
    { value: "monthly", label: "Monthly", timesPerYear: 12 },
    { value: "daily", label: "Daily", timesPerYear: 365 },
];

/* The time period options. `value` matches the `time.unit` enum the backend
stores, while `label` is what the user sees on the toggle buttons. */
export const PERIOD_UNITS = [
    { value: "years", label: "Annual", noun: "years", max: 100, placeholder: "10" },
    { value: "months", label: "Monthly", noun: "months", max: 1200, placeholder: "18" },
];

// Helper returning the config for the currently selected time period unit
export const periodConfig = (unit) =>
    PERIOD_UNITS.find((p) => p.value === unit) ?? PERIOD_UNITS[0];

// The interest calculator's inputs before the user has filled anything in
export const BLANK_INTEREST_FORM = {
    type: "compound", // "simple" | "compound"
    principal: "",
    rate: "",
    time: "",
    periodUnit: "years", // "years" (annual) | "months" (monthly)
    compoundingFrequency: "annually",
    monthlyContribution: "",
};

/* Check the interest calculator's inputs, returning a field -> message object.
The time period is validated against the unit the user selected, so the same
figure is judged as years or as months depending on the toggle. */
export const validateInterestForm = (form) => {
    const period = periodConfig(form.periodUnit);
    const errs = {};
    if (!form.principal || Number(form.principal) <= 0) {
        errs.principal = "Enter an amount greater than 0";
    }
    if (!form.rate || Number(form.rate) <= 0 || Number(form.rate) > 100) {
        errs.rate = "Enter a rate between 0 and 100";
    }
    if (
        !form.time ||
        Number(form.time) <= 0 ||
        !Number.isInteger(Number(form.time)) ||
        Number(form.time) > period.max
    ) {
        errs.time = `Enter a whole number of ${period.noun} between 1 and ${period.max}`;
    }
    if (form.monthlyContribution && Number(form.monthlyContribution) < 0) {
        errs.monthlyContribution = "Cannot be negative";
    }
    return errs;
}

/* Reads the logged in user's first and last name off the currentUser object
the app fetched from GET /users/me, trimmed and never undefined. The interest
calculator shows these in its read only FULL NAME fields and sends them with a
save, so a saved record carries the name of the person who made it. */
export const toInterestFullName = (currentUser) => ({
    firstName: (currentUser?.fullName?.firstName ?? "").trim(),
    lastName: (currentUser?.fullName?.lastName ?? "").trim(),
});

/* A calculation can only be saved against a complete name, because the
interest schema requires both halves of fullName. */
export const hasCompleteFullName = (fullName) =>
    Boolean(fullName?.firstName && fullName?.lastName);

/* Assemble the request body for POST /interest/calculate, and for
POST /interest/save when a `fullName` is supplied.

The name is only attached when it is complete: /calculate has no use for it,
and the save route reads the stored name off the user record anyway, so a
half filled name would be noise in the request rather than useful input. */
export const buildInterestPayload = (form, fullName) => {
    const payload = {
        type: form.type,
        principal: Number(form.principal),
        rate: Number(form.rate),
        // `duration` is measured in whatever `periodUnit` says
        duration: Number(form.time),
        periodUnit: form.periodUnit,
        compoundingFrequency:
            form.type === "compound" ? form.compoundingFrequency : null,
        monthlyContribution: Number(form.monthlyContribution) || 0,
    };

    // Conditional check so only a complete name is sent to /save
    if (hasCompleteFullName(fullName)) {
        payload.fullName = {
            firstName: fullName.firstName.trim(),
            lastName: fullName.lastName.trim(),
        };
    }

    return payload;
}

/* Local fallback calculation, used if no onCalculate prop is supplied
(e.g. for preview/demo). The backend should always recompute and be
the source of truth for anything saved, so this mirrors the maths in
server/utils/interestCalculator.js exactly.

The balance is simulated one month at a time - the finest granularity the
form allows for contributions - and those months are then grouped into the
reporting period the user selected. */
export const calculateInterestLocally = (form) => {
    const isCompound = form.type === "compound";
    const unit = form.periodUnit === "months" ? "months" : "years";
    const P = Number(form.principal);
    const annualRate = Number(form.rate) / 100;
    const contribution = Number(form.monthlyContribution) || 0;

    // Months to simulate, and how many of those months make up one output row
    const totalMonths = Math.round(
        unit === "months" ? Number(form.duration) : Number(form.duration) * 12
    );
    const monthsPerRow = unit === "months" ? 1 : 12;

    const timesPerYear =
        COMPOUND_FREQUENCIES.find((f) => f.value === form.compoundingFrequency)
            ?.timesPerYear ?? 1;
    /* Monthly growth factor for compound interest: over twelve months this
    multiplies out to exactly (1 + r/n)^n, so the annual total still matches
    the standard compound interest formula. */
    const monthlyGrowth = isCompound
        ? Math.pow(1 + annualRate / timesPerYear, timesPerYear / 12)
        : 1;
    const monthlySimpleRate = annualRate / 12;

    let balance = P;// Running balance, including interest earned
    let capitalBase = P;// Capital paid in, used for simple interest only
    let totalInterest = 0;
    let totalContributions = 0;
    let rowInterest = 0;
    let rowContributions = 0;
    const breakdown = [];

    for (let month = 1; month <= totalMonths; month++) {
        // Simple interest is only ever charged on capital paid in, never on interest
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
        periodUnit: unit,
        periodLabel: unit === "months" ? "month" : "year",
        totalContributions: round2(totalContributions),
        totalInterest: round2(totalInterest),
        finalAmount: round2(balance),
        breakdown,
    };
}

//===========================================================================
// TAX YEAR CONFIGURATION FORM (AddTaxDataForm.js)
//===========================================================================
// A bracket row with nothing filled in yet
export const emptyBracket = () => ({ min: "", max: "", baseAmount: "", rate: "" });

// The tax year configuration form with nothing filled in yet
const BLANK_TAX_YEAR_FORM = {
    taxYear: "",
    startDate: "",
    endDate: "",
    brackets: [emptyBracket()],
    rebates: { primary: "", secondary: "", tertiary: "" },
    thresholds: { under65: "", age65to74: "", age75plus: "" },
    isActive: true,
};

/* Turn a stored TaxYearConfig into the form's own shape: every field becomes a
string, because that is what an input holds, and the rates are shown as
percentages rather than as the decimals the schema stores. */
export const toTaxYearFormShape = (data) => {
    if (!data) return BLANK_TAX_YEAR_FORM;
    return {
        taxYear: data.taxYear ?? "",
        startDate: data.startDate ? data.startDate.slice(0, 10) : "",
        endDate: data.endDate ? data.endDate.slice(0, 10) : "",
        brackets:
            data.brackets?.length > 0
                ? data.brackets.map((b) => ({
                    min: b.min ?? "",
                    max: b.max ?? "",
                    baseAmount: b.baseAmount ?? "",
                    rate: b.rate != null ? b.rate * 100 : "", // store as % in the UI
                }))
                : [emptyBracket()],
        rebates: {
            primary: data.rebates?.primary ?? "",
            secondary: data.rebates?.secondary ?? "",
            tertiary: data.rebates?.tertiary ?? "",
        },
        thresholds: {
            under65: data.thresholds?.under65 ?? "",
            age65to74: data.thresholds?.age65to74 ?? "",
            age75plus: data.thresholds?.age75plus ?? "",
        },
        isActive: data.isActive ?? true,
    };
}

/* Check the tax year configuration, returning a field -> message object. The
bracket errors are keyed by row (`bracket-0-min`) so each input can show its own
message, and each bracket is also checked against the one before it: the
brackets have to run on from one another to cover every income without a gap. */
export const validateTaxYearForm = (form) => {
    const errs = {};

    if (!/^\d{4}-\d{4}$/.test(form.taxYear.trim())) {
        errs.taxYear = "Use the format YYYY-YYYY, e.g. 2025-2026";
    }
    if (!form.startDate) errs.startDate = "Start date is required";
    if (!form.endDate) errs.endDate = "End date is required";
    if (form.startDate && form.endDate && form.startDate >= form.endDate) {
        errs.endDate = "End date must be after start date";
    }

    if (form.brackets.length === 0) {
        errs.brackets = "At least one bracket is required";
    }

    form.brackets.forEach((b, i) => {
        if (b.min === "" || Number(b.min) < 0) {
            errs[`bracket-${i}-min`] = "Required";
        }
        if (b.max !== "" && Number(b.max) <= Number(b.min)) {
            errs[`bracket-${i}-max`] = "Must be greater than min";
        }
        if (b.baseAmount === "" || Number(b.baseAmount) < 0) {
            errs[`bracket-${i}-baseAmount`] = "Required";
        }
        if (b.rate === "" || Number(b.rate) <= 0 || Number(b.rate) > 100) {
            errs[`bracket-${i}-rate`] = "0–100";
        }
        if (i > 0) {
            const prev = form.brackets[i - 1];
            if (prev.max !== "" && b.min !== "" && Number(b.min) !== Number(prev.max) + 1) {
                errs[`bracket-${i}-min`] = `Should follow previous bracket (${
                    prev.max === "" ? "?" : Number(prev.max) + 1
                })`;
            }
        }
    });

    ["primary", "secondary", "tertiary"].forEach((k) => {
        if (form.rebates[k] === "" || Number(form.rebates[k]) < 0) {
            errs[`rebate-${k}`] = "Required";
        }
    });

    ["under65", "age65to74", "age75plus"].forEach((k) => {
        if (form.thresholds[k] === "" || Number(form.thresholds[k]) < 0) {
            errs[`threshold-${k}`] = "Required";
        }
    });

    return errs;
}

/* Assemble the tax year configuration for saving. Every figure goes back to a
number, a blank ceiling becomes null (the top bracket has no upper limit) and
the rates go back to the decimals the schema stores. */
export const buildTaxYearPayload = (form) => {
    return {
        taxYear: form.taxYear.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        brackets: form.brackets.map((b) => ({
            min: Number(b.min),
            max: b.max === "" ? null : Number(b.max),
            baseAmount: Number(b.baseAmount),
            rate: Number(b.rate) / 100, // convert % back to decimal
        })),
        rebates: {
            primary: Number(form.rebates.primary),
            secondary: Number(form.rebates.secondary),
            tertiary: Number(form.rebates.tertiary),
        },
        thresholds: {
            under65: Number(form.thresholds.under65),
            age65to74: Number(form.thresholds.age65to74),
            age75plus: Number(form.thresholds.age75plus),
        },
        isActive: form.isActive,
    };
}

//===========================================================================
// SAVED TAX CALCULATIONS (TaxCalculations.js)
//===========================================================================
/* The age bands the rebates are applied from. The schema stores the band as an
enum resolved at calculation time, so the record still explains itself if the
rebate rules later change; these are the labels for those stored values. */
const AGE_GROUP_LABELS = {
    under65: 'UNDER 65',
    age65to74: '65 TO 74',
    age75plus: '75 AND OVER'
}

// Label a stored age group, falling back to the raw value for an unknown band
export const toAgeGroup = (ageGroup) => AGE_GROUP_LABELS[ageGroup] || ageGroup || NOT_AVAILABLE

/* Income remaining after deductions. Exposed as a virtual by the schema, so it
arrives on the record; it is recomputed only as a fallback. */
export const taxableIncomeOf = (calculation) => {
    if (typeof calculation?.taxableIncome === 'number') return calculation.taxableIncome
    if (typeof calculation?.income?.grossIncome === 'number') {
        return calculation.income.grossIncome - (calculation.deductions || 0)
    }
    return null
}

// Income remaining after tax, as above
export const netIncomeOf = (calculation) => {
    if (typeof calculation?.netIncome === 'number') return calculation.netIncome
    if (typeof calculation?.income?.grossIncome === 'number' && typeof calculation?.netTax === 'number') {
        return calculation.income.grossIncome - calculation.netTax
    }
    return null
}

// The monthly PAYE equivalent of the annual tax payable, as above
export const monthlyTaxOf = (calculation) => {
    if (typeof calculation?.monthlyTax === 'number') return calculation.monthlyTax
    if (typeof calculation?.netTax === 'number') return calculation.netTax / 12
    return null
}

//===========================================================================
// SAVED INTEREST CALCULATIONS (InterestCalculations.js)
//===========================================================================
/* The schema stores the compounding frequency as a NUMBER of times per year,
because that is what the maths needs; these are the names the calculator form
offers for those counts. */
const COMPOUND_FREQUENCY_LABELS = {
    1: 'ANNUALLY',
    2: 'SEMI-ANNUALLY',
    4: 'QUARTERLY',
    12: 'MONTHLY',
    365: 'DAILY'
}

/* Label a stored compounding frequency. Simple interest does not compound, and
the schema falls back to 1 for it, so the frequency is reported as not applicable
rather than as a misleading "ANNUALLY". */
export const toCompounding = (calculation) => {
    if (calculation?.interestType === 'simple') return 'NOT APPLICABLE (SIMPLE INTEREST)'
    const frequency = calculation?.compoundFrequency
    if (typeof frequency !== 'number') return NOT_AVAILABLE
    return COMPOUND_FREQUENCY_LABELS[frequency] || `${frequency} TIMES PER YEAR`
}

/* The term as stored, e.g. 18 MONTHS. A whole number of periods is shown
without decimals, because "18 MONTHS" reads better than "18,00 MONTHS". */
export const toTerm = (time) => {
    if (typeof time?.duration !== 'number') return NOT_AVAILABLE
    const duration = time.duration.toLocaleString('en-ZA', { maximumFractionDigits: 2 })
    return `${duration} ${(time.unit || 'years').toUpperCase()}`
}

/* The term converted to years. Exposed as a virtual by the schema, so it
arrives on the record; it is recomputed only as a fallback. */
export const durationInYearsOf = (calculation) => {
    if (typeof calculation?.durationInYears === 'number') return calculation.durationInYears
    if (typeof calculation?.time?.duration !== 'number') return null
    return calculation.time.unit === 'months' ? calculation.time.duration / 12 : calculation.time.duration
}

/* The capital the user paid in themselves, as opposed to the interest earned on
top of it. Exposed as a virtual by the schema, as above. */
export const totalCapitalOf = (calculation) => {
    if (typeof calculation?.totalCapital === 'number') return calculation.totalCapital
    if (typeof calculation?.principal === 'number') {
        return calculation.principal + (calculation.totalContributions || 0)
    }
    return null
}

//===========================================================================
// BASIC CALCULATOR (NumberCalculator.js)
//===========================================================================
/* True for the keys the basic calculator accepts from the keyboard: the digits,
the decimal point and the four operators. */
export const isCalculatorKey = (key) => /[0-9+\-*/.]/.test(key)

/* Work out a typed expression with math.js. The expression comes from the user,
so an unfinished one ("5 +") is expected rather than exceptional: a failure is
reported as `{ ok: false }` for the caller to show, instead of being thrown. */
export const evaluateExpression = (expression) => {
    try {
        return { ok: true, value: evaluate(expression) }
    } catch (error) {
        return { ok: false, value: null }
    }
}
