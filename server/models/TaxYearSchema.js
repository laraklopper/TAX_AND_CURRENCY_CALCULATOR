const mongoose = require("mongoose");

const BracketSchema = new mongoose.Schema({
  min: { type: Number, required: true },       // lower bound of bracket (R)
  max: { type: Number, default: null },         // upper bound (R), null = no ceiling
  baseAmount: { type: Number, required: true }, // fixed amount owed at bracket start
  rate: { type: Number, required: true }        // marginal rate, e.g. 0.18 for 18%
}, { _id: false });

const RebateSchema = new mongoose.Schema({
  primary: { type: Number, required: true },    // all taxpayers
  secondary: { type: Number, required: true },   // age 65+
  tertiary: { type: Number, required: true }     // age 75+
}, { _id: false });

const ThresholdSchema = new mongoose.Schema({
  under65: { type: Number, required: true },
  age65to74: { type: Number, required: true },
  age75plus: { type: Number, required: true }
}, { _id: false });

const TaxYearConfigSchema = new mongoose.Schema({
  taxYear: { type: String, required: true, unique: true }, // e.g. "2025-2026"
  startDate: { type: Date, required: true },                // 1 March
  endDate: { type: Date, required: true },                  // 28/29 February
  brackets: { type: [BracketSchema], required: true },
  rebates: { type: RebateSchema, required: true },
  thresholds: { type: ThresholdSchema, required: true },
  isActive: { type: Boolean, default: true },                // current tax year flag
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("TaxYearConfig", TaxYearConfigSchema);