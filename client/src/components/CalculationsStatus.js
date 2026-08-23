// CalculationsStatus.js
/* The inline request feedback shown above each saved-calculation list
(CurrencyCalculations.js, TaxCalculations.js, InterestCalculations.js).

Shared so the three lists cannot drift apart on how a message is announced: a
failure is an assertive `alert`, because the user pressed a button and needs to
know it did not work, while a success is a polite `status` that does not
interrupt what a screen reader is already reading. */
import React from 'react'

/* `status` is the outcome of the user's own last action (a delete), and
`loadError` is a history that would not load. The action wins when both are
present, because it is the more recent thing the user did. */
export default function CalculationsStatus({ status, loadError }) {
  const feedback = status || (loadError ? { type: 'error', text: loadError } : null)

  if (!feedback) return null;// Nothing to report

  return (
    <div className='calculations-status'>
      <p
        className='msgText'
        role={feedback.type === 'error' ? 'alert' : 'status'}
        aria-live={feedback.type === 'error' ? 'assertive' : 'polite'}
        style={{ color: feedback.type === 'error' ? '#C22419' : '#1B6E2F' }}
      >
        {feedback.text}
      </p>
    </div>
  )
}
