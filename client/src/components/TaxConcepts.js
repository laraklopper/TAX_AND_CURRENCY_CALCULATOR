// TaxConcepts.js
// Plain-language explanations of the three sets of figures shown by TaxDataDisplay.js.
// Source: docs/TAX_CONCEPTS.md
import React from 'react'
import Accordion from 'react-bootstrap/Accordion'
export default function TaxConcepts() {
  return (
    <div id='tax-concept-info'>
         <Accordion  id='tax-concepts'>
      <Accordion.Item eventKey="0">
        <Accordion.Header>INCOME TAX BRACKETS</Accordion.Header>
        <Accordion.Body>
      <div className='tax-concept-div'>
            {/* EXPLAIN INCOME TAX BRACKETS */}
            <p className='concept-para'>
              A bracket is an income band with its own tax rate. South Africa uses a
              progressive, sliced system: each slice of income is taxed at the rate for
              its own band, not the top rate on the whole amount. Rather than re-adding
              every slice on each calculation, SARS publishes each band as a base amount
              (the tax already accumulated by everyone below that band) plus a marginal
              rate charged on the portion of income inside the band, so that gross tax =
              base amount + rate &times; (taxable income &minus; the top of the previous bracket).
            </p>
            <p className='concept-para'>
              This produces two different rates, and confusing them is the most common
              misreading of a bracket table. The marginal rate is the rate on your next
              rand earned &mdash; the rate shown in the table. The effective rate is total
              tax divided by total income, and it is always lower, because the earlier
              slices were taxed more lightly. Someone in the 31% bracket does not pay 31%
              of their income: on R450 000 the tax works out to R84 772 after the primary
              rebate, an effective rate of 18.84%.
            </p>
        </div>
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey="1">
        <Accordion.Header>REBATES</Accordion.Header>
        <Accordion.Body>
          <div className='tax-concept-div'>
            {/* EXPLAIN REBATES */}
            <p className='concept-para'>
              A rebate is a flat rand amount subtracted from tax already calculated, not
              from income &mdash; which is what separates it from a deduction. A deduction
              comes off taxable income before the brackets are applied, so it is worth more
              to higher earners: R1 000 saves an 18% taxpayer R180 and a 45% taxpayer R450.
              A rebate is applied after the brackets, so R1 000 saves both of them exactly
              R1 000.
            </p>
            <p className='concept-para'>
              The three rebates are cumulative, not alternatives. Every individual taxpayer
              receives the primary rebate, a taxpayer aged 65 to below 75 also receives the
              secondary rebate, and a taxpayer of 75 and older receives all three. For
              2025-2026 that means R17 235, R26 679 or R29 824 respectively. Age is assessed
              over the whole year of assessment, so a taxpayer who turns 65 at any point
              during the tax year gets the full secondary rebate for that year rather than a
              pro-rated share. Rebates are also non-refundable: they can reduce tax payable
              to zero but never below it, and any excess is simply lost.
            </p>
        </div>
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey="3">
        <Accordion.Header>TAX THRESHOLDS</Accordion.Header>
        <Accordion.Body>
           <div className='tax-concept-div'>
            {/* EXPLAIN TAX THRESHOLDS */}
            <p className='concept-para'>
              The threshold is the annual income below which no income tax is payable. It is
              not an independently legislated figure &mdash; it exists because of the rebates.
              Since a rebate is subtracted from tax payable, tax only becomes payable once the
              gross tax exceeds the rebates, which puts the threshold at total rebates divided
              by 0.18, the rate of the lowest bracket. Every threshold falls inside that first
              bracket, so the divisor is always 18%: R17 235 &divide; 0.18 = R95 750 under 65,
              R26 679 &divide; 0.18 = R148 217 for ages 65 to below 75, and R29 824 &divide; 0.18
              = R165 689 from 75. Change a rebate and the matching threshold moves with it.
            </p>
            <p className='concept-para'>
              A threshold is used to decide whether a taxpayer must submit a return at all, to
              set the point at which an employer starts deducting PAYE, and as a quick
              eligibility check before running a full calculation. It is not a tax-free
              allowance carved off the top of a higher earner's income: someone earning
              R400 000 does not get the first R95 750 free, they get the R17 235 rebate, which
              is a different and much smaller benefit.
            </p>
        </div>
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey='4'>
        <Accordion.Header>PROVISIONAL TAX</Accordion.Header>
        <Accordion.Body>
        {/* EXPLAIN PROVISIONAL TAX */}
          <div className='tax-concept-div'>

          </div>
        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey='5'>
        <Accordion.Header>VALUE ADDED TAX (VAT)</Accordion.Header>
        <Accordion.Body>
        {/* Explain VALUE ADDED TAX */}
          <div className='tax-concept-div'>

          </div>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
    
    </div>
  )
}
